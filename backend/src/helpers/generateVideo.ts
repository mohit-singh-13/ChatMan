import { spawn } from "node:child_process";
import path from "path";

type TProps = {
  fileId: string;
  classNames: string[];
};

const generateVideo = async ({ fileId, classNames }: TProps) => {
  try {
    console.log(classNames);
    console.log(typeof classNames);
    const filePath = path.join(__dirname, `../temp/manim-code-${fileId}.py`);
    const manimPath = path.join(__dirname, "../manim_env/Scripts/manim.exe");
    const outputPath = path.join(__dirname, "../media_output");

    for (const pyClass of classNames) {
      await new Promise<void>((resolve, reject) => {
        const process = spawn(manimPath, [
          "-qm",
          filePath,
          pyClass,
          "--media_dir",
          outputPath,
          "--frame_rate",
          "60",
        ]);

        process.on("error", reject);

        process.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Manim process exited with code ${code}`));
          }
        });
      });
    }

    return {
      success: true,
      message: "Video has been generated successfully",
      data: classNames.map(
        (className) =>
          path.join(
            __dirname,
            `../media_output/videos/manim-code-${fileId}/720p60`,
            className
          ) + ".mp4"
      ),
    } as const;
  } catch (err) {
    console.log("Catch generateVideo :", err);

    return {
      success: false,
      message: "Error during production of video",
      data: err as Error,
    } as const;
  }
};

export default generateVideo;
