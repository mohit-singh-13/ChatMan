import { Request, Response } from "express";
import z from "zod";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import generateVideo from "../helpers/generateVideo";
import { GET_CLASSNAME_PROMPT } from "../constants/prompt";

export const produceVideo = async (req: Request, res: Response) => {
  const ProduceVideoSchema = z.object({
    code: z
      .string({ error: "Invalid code format" })
      .trim()
      .min(1, { error: "Input should be non-empty" }),
  });

  const parsedBody = ProduceVideoSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0].message,
    });
    return;
  }

  const { code } = parsedBody.data;

  try {
    const id = Date.now() + Math.floor(Math.random() * 100000);
    const tempDir = path.join(__dirname, "../temp");
    const scriptPath = path.join(tempDir, `manim-code-${id}.py`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const client = new Anthropic();

    const response = await client.messages.create({
      system: GET_CLASSNAME_PROMPT,
      model: "claude-3-5-haiku-20241022",
      messages: [{ role: "user", content: code }],
      max_tokens: 50,
    });

    const { classNames } = JSON.parse(
      (response.content[0].type === "text" && response.content[0].text) || ""
    );

    const JSONCode = `{
      "code": ${JSON.stringify(code)}
    }`;

    const parsedCode = JSON.parse(JSONCode) as { code: string };

    fs.writeFileSync(scriptPath, parsedCode.code);

    const result = await generateVideo({ fileId: id.toString(), classNames });

    if (!result.success) {
      throw new Error(result.message);
    }

    const videoUrls = result.data.map((videoPath) => {
      const videoBuffer = fs.readFileSync(videoPath);
      const base64Video = videoBuffer.toString("base64");
      const dataUrl = `data:video/mp4;base64,${base64Video}`;

      return dataUrl;
    });

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
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }

    res.status(200).json({
      success: true,
      data: videoUrls,
    });
  } catch (err) {
    console.log("Error produceVideo :", err);

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
