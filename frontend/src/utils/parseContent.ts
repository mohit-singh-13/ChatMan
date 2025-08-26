import type { TNDJSONStream } from "@/pages/Home";

const parseContent = (content: string) => {
  const lines = content.split("\n");
  let codeEncountered = false;
  let fullResponse = "";

  for (const line of lines) {
    if (!line.startsWith('{"')) continue;

    const validNDJSON = JSON.parse(line) as TNDJSONStream;

    if (
      (validNDJSON.type === "classNames" || validNDJSON.type === "message") &&
      codeEncountered
    ) {
      fullResponse += "```" + "\n";
      codeEncountered = false;
    }

    if (validNDJSON.type === "message" || validNDJSON.type === "code") {
      if (!codeEncountered && validNDJSON.type === "code") {
        codeEncountered = true;
        fullResponse += "```" + "\n";
      }

      fullResponse += validNDJSON.content;
    }
  }
  console.log("fullResponse");
  console.log(fullResponse);

  return fullResponse;
};

export default parseContent;
