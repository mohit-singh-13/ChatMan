import Anthropic from "@anthropic-ai/sdk";
import { Request, Response } from "express";
import z, { success } from "zod";
import { SYSTEM_PROMPT } from "../constants/prompt";
import fs, { existsSync } from "fs";
import generateVideo from "../helpers/generateVideo";
import path from "path";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

type TNDJSONStream =
  | {
      type: "message";
      content: string;
    }
  | {
      type: "code";
      content: string;
      language: string;
    }
  | {
      type: "classNames";
      content: string[];
    };

export const chat = async (req: Request, res: Response) => {
  const ChatSchema = z.object({
    model: z.enum(["CLAUDE", "DEEPSEEK"], {
      error: "We don't support this model yet",
    }),
    conversationId: z.uuid({ error: "Invalid Conversation ID" }),
    messages: z
      .array(
        z.object(
          {
            text: z.string(),
            role: z.enum(["user", "assistant"], { error: "Invalid role" }),
          },
          { error: "Invalid message" }
        )
      )
      .min(1),
  });

  const parsedInput = ChatSchema.safeParse(req.body);

  if (!parsedInput.success) {
    console.log("Invalid inputs chat :", parsedInput.error);

    res.status(400).json({
      success: false,
      message: parsedInput.error.issues[0].message,
    });
    return;
  }

  const { model, conversationId, messages } = parsedInput.data;

  const prisma = new PrismaClient();

  try {
    const userMessageToSave = messages[messages.length - 1].text;

    const conversation = await prisma.allConversations.findUnique({
      where: {
        conversation_id: conversationId,
      },
    });

    if (!conversation) {
      await prisma.allConversations.create({
        data: {
          conversation_id: conversationId,
          title: userMessageToSave.slice(0, 20),
        },
      });
    }

    await prisma.conversation.create({
      data: {
        conversation_id: conversationId,
        role: "user",
        content: userMessageToSave,
      },
    });
  } catch (err) {
    console.log("Error while saving user chat in DB : ", err);

    await prisma.$disconnect();

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }

  try {
    res.setHeader("Content-Type", "text/event-stream"); // SSE
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let text = "";

    if (model === "CLAUDE") {
      const client = new Anthropic();

      const response = client.messages
        .stream({
          system: SYSTEM_PROMPT,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
          model: "claude-4-sonnet-20250514",
          max_tokens: 8000,
        })
        .on("text", (text) => {
          console.log(text);
          res.write(`event: data\ndata: ${text}\n\n`);
        });

      const finalMessage = await response.finalMessage();
      text =
        (finalMessage.content[0].type === "text" &&
          finalMessage.content[0].text) ||
        "";

      console.log(text);
    } else if (model === "DEEPSEEK") {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.DEEPSEEK_OPEN_ROUTER_API_KEY,
      });

      const stream = await openai.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        ],
        model: "deepseek/deepseek-chat-v3-0324:free",
        stream: true,
      });

      console.log(stream);

      for await (const event of stream) {
        console.log(event.choices[0].delta.content);
        res.write(`event: data\ndata: ${event.choices[0].delta.content}\n\n`);
        text += event.choices[0].delta.content;
      }
    }

    await prisma.conversation.create({
      data: {
        conversation_id: conversationId,
        role: "assistant",
        content: text,
      },
    });

    const validJSONArray = text.split("\n");
    let pythonCode = "";
    let classNames: string[] = [];

    for (const validJSON of validJSONArray) {
      if (!validJSON.trim()) {
        continue;
      }

      const message = JSON.parse(validJSON) as TNDJSONStream;

      console.log("validJSON");
      console.log(validJSON);

      if (message.type === "code") {
        pythonCode += message.content;
      }

      if (message.type === "classNames") {
        classNames = message.content;
      }
    }

    if (pythonCode.trim()) {
      const id = Date.now() + Math.floor(Math.random() * 100000);
      const tempDir = path.join(__dirname, "../temp");
      const scriptPath = path.join(tempDir, `manim-code-${id}.py`);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(scriptPath, pythonCode);

      res.write("event: loading\ndata: [LOADING]\n\n");

      // call generateVideo with script path
      const result = await generateVideo({
        fileId: id.toString(),
        classNames,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      for (const videoPath of result.data) {
        const videoBuffer = fs.readFileSync(videoPath);
        const base64Video = videoBuffer.toString("base64");
        const dataUrl = `data:video/mp4;base64,${base64Video}`;

        res.write(
          `event: video\ndata: ${JSON.stringify({
            videoUrl: dataUrl,
            fileId: id.toString(),
            message: "Video generated successfully",
          })}\n\n`
        );

        console.log("videoPath : ");
        console.log(videoPath);
        console.log(path.join(videoPath, "../../../"));

        console.log("joined path : ");
        console.log(videoPath.split("\\").reverse()[2]);
        console.log(
          path.join(
            videoPath,
            `../../manim-code-${
              videoPath.split("\\").reverse()[2].split("-")[2]
            }`
          )
        );
      }

      fs.rmSync(
        path.join(
          result.data[0],
          `../../../manim-code-${
            result.data[0].split("\\").reverse()[2].split("-")[2]
          }`
        ),
        { recursive: true, force: true }
      );

      // delete script from temp
      if (existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }

    res.write("event: end\ndata: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.log("Catch chat :", err);

    res.write("event: error\ndata: [DONE]\n\n");
    res.end();
  }
};

export const getAllChats = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const chats = await prisma.allConversations.findMany({
      orderBy: {
        updated_at: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Chats retrieved successfully",
      data: chats,
    });
  } catch (err) {
    console.log("Catch getAllChats :", err);

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const getChat = async (req: Request, res: Response) => {
  const GetChatSchema = z.object({
    conversationId: z.uuid({ error: "Invalid Conversation ID" }),
  });

  const parsedParams = GetChatSchema.safeParse(req.params);

  if (!parsedParams.success) {
    console.log("Invalid inputs getChats :", parsedParams.error);

    res.status(400).json({
      success: false,
      message: parsedParams.error.issues[0].message,
    });
    return;
  }

  const { conversationId } = parsedParams.data;
  const prisma = new PrismaClient();

  try {
    const chat = await prisma.conversation.findMany({
      where: {
        conversation_id: conversationId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Chat retrieved successfully",
      data: chat,
    });
  } catch (err) {
    console.log("Catch getChat :", err);

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const renameChat = async (req: Request, res: Response) => {
  const RenameChatSchema = z.object({
    conversationId: z.uuid({ error: "Invalid Conversation ID" }),
    title: z.string().min(1, { message: "Title cannot be empty" }),
  });

  const parsedBody = RenameChatSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0].message,
    });
    return;
  }

  const { conversationId, title } = parsedBody.data;
  const prisma = new PrismaClient();

  try {
    const updated = await prisma.allConversations.update({
      where: { conversation_id: conversationId },
      data: { title },
    });

    res.status(200).json({
      success: true,
      message: "Chat renamed successfully",
      data: updated,
    });
  } catch (err) {
    console.log("Error renaming chat:", err);

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  const DeleteChatSchema = z.object({
    conversationId: z.uuid({ error: "Invalid Conversation ID" }),
  });

  const parsedParams = DeleteChatSchema.safeParse(req.params);

  if (!parsedParams.success) {
    res.status(400).json({
      success: false,
      message: parsedParams.error.issues[0].message,
    });
    return;
  }

  const { conversationId } = parsedParams.data;
  const prisma = new PrismaClient();

  try {
    await prisma.conversation.deleteMany({
      where: { conversation_id: conversationId },
    });

    await prisma.allConversations.delete({
      where: { conversation_id: conversationId },
    });

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (err) {
    console.log("Error deleting chat:", err);

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
