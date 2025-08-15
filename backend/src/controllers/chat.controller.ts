import Anthropic from "@anthropic-ai/sdk";
import { Request, Response } from "express";
import z from "zod";
import { SYSTEM_PROMPT } from "../constants/prompt";
import fs, { existsSync } from "fs";
import { XMLParser } from "fast-xml-parser";
import generateVideo from "../helpers/generateVideo";
import path from "path";

export const chat = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream"); // SSE
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const chatSchema = z.object({
    userPrompt: z.string().min(1),
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

  const { userPrompt } = parsedInput.data;

  try {
    const client = new Anthropic();

    const response = client.messages
      .stream({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
        model: "claude-4-sonnet-20250514",
        max_tokens: 1000,
      })
      .on("text", (text) => {
        // console.log(text);
        res.write(`event: data\ndata: ${text}\n\n`);
      });

    const finalMessage = await response.finalMessage();
    const text =
      (finalMessage.content[0].type === "text" &&
        finalMessage.content[0].text) ||
      "";
    // console.log(text);

    type TMessage =
      | {
          code: true;
          chatman_message?: string;
          chatman_code: string;
          chatman_classNames: string;
        }
      | {
          code: false;
          chatman_message?: string;
        };

    type TRootMessage = {
      chatman_response: TMessage;
    };

    const parser = new XMLParser();
    const message = parser.parse(text) as TRootMessage;

    // console.log(message);

    // save message to a script
    if (message.chatman_response.code) {
      const id = Date.now() + Math.floor(Math.random() * 100000);
      const tempDir = path.join(__dirname, "../temp");
      const scriptPath = path.join(tempDir, `manim-code-${id}.py`);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(scriptPath, message.chatman_response.chatman_code);

      // call codeToVideo with script path
      const result = await generateVideo({
        fileId: id.toString(),
        classNames: JSON.parse(message.chatman_response.chatman_classNames),
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      for (const videoPath of result.data as string[]) {
        const videoBuffer = fs.readFileSync(videoPath);
        const base64Video = videoBuffer.toString("base64");
        const dataUrl = `data:video/mp4;base64,${base64Video}`;

        res.write(
          `event: video\ndata: ${JSON.stringify({
            videoData: dataUrl,
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

        fs.rmSync(
          path.join(
            videoPath,
            `../../../manim-code-${
              videoPath.split("\\").reverse()[2].split("-")[2]
            }`
          ),
          { recursive: true, force: true }
        );
      }

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
