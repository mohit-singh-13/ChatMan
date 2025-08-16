import Anthropic from "@anthropic-ai/sdk";
import { Request, Response } from "express";
import z from "zod";
import { SYSTEM_PROMPT } from "../constants/prompt";
import fs, { existsSync } from "fs";
import { XMLParser } from "fast-xml-parser";
import generateVideo from "../helpers/generateVideo";
import path from "path";

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
  const chatSchema = z.object({
    messages: z
      .array(
        z.object({
          text: z.string(),
          role: z.enum(["user", "assistant"]),
        })
      )
      .min(1),
  });

  const parsedInput = chatSchema.safeParse(req.body);

  if (!parsedInput.success) {
    console.log("Invalid inputs chat :", parsedInput.error);

    res.status(400).json({
      success: false,
      message: "Invalid inputs",
    });
    return;
  }

  const { messages } = parsedInput.data;

  try {
    const client = new Anthropic();

    res.setHeader("Content-Type", "text/event-stream"); // SSE
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

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
    const text =
      (finalMessage.content[0].type === "text" &&
        finalMessage.content[0].text) ||
      "";
    console.log(text);

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
  }
};
