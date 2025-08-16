import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useState } from "react";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import Container from "@/components/custom/Container";
import { type ChatStatus } from "ai";
import axios from "axios";

const models = [
  {
    name: "Claude Sonnet 4",
    value: "openai/gpt-4o",
  },
  {
    name: "Deepseek R1",
    value: "deepseek/deepseek-r1",
  },
];

type TMessage = {
  text: string;
  role: "user" | "assistant";
};

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
      content: string;
    };

type TVideoBase64 = {
  fileId: string;
  videoUrl: string;
  message: string;
};

const Home = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [videoUrls, setVideoUrls] = useState<TVideoBase64[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [welcomeMessage, setWelcomeMessage] = useState({
    heading: "Welcome to ChatMan!",
    content: "You're one prompt away from your amazing video...",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatus("submitted");
    setInput("");
    setMessages((prev) => [...prev, { text: input, role: "user" }]);

    const messagesToSend = [...messages, { text: input, role: "user" }];

    try {
      const response = await axios.post<ReadableStream>(
        "http://localhost:8080/api/chat",
        { messages: messagesToSend },
        { responseType: "stream", adapter: "fetch" }
      );

      setStatus("streaming");
      const stream = response.data;
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      let fullResponse = "";
      let buffer = "";
      let videoUrl = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          setStatus("ready");
          break;
        }

        const lines = value.split("\n");
        console.log("lines");
        console.log(lines);

        for (const line of lines) {
          if (
            line.startsWith("event: data") ||
            line.startsWith("event: end") ||
            line.startsWith("event: video")
          ) {
            continue;
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", text: fullResponse },
              ]);
              setStreamingMessage("");
            }

            if (
              data.includes("videoUrl") ||
              (data.includes("fileId") && data.includes("message"))
            ) {
              videoUrl += data;

              console.log("VIDE URL");
              console.log(videoUrl);

              if (videoUrl.endsWith('"}')) {
                const video = JSON.parse(videoUrl.trim()) as TVideoBase64;
                setVideoUrls((prev) => [...prev, video]);
                videoUrl = "";
              }

              continue;
            }

            buffer += data;

            if (buffer.endsWith('"}')) {
              const validNDJSON = JSON.parse(buffer) as TNDJSONStream;

              if (validNDJSON.type === "message") {
                fullResponse += validNDJSON.content + "\n";
                setStreamingMessage(
                  (prev) => prev + validNDJSON.content + "\n"
                );
              }

              buffer = "";
            }
          } else {
            if (
              line.includes("videoUrl") ||
              (line.includes("fileId") && line.includes("message"))
            ) {
              videoUrl += line;

              console.log("VIDE URL");
              console.log(videoUrl);

              if (videoUrl.endsWith('"}')) {
                const video = JSON.parse(videoUrl.trim()) as TVideoBase64;
                setVideoUrls((prev) => [...prev, video]);
                videoUrl = "";
              }

              continue;
            }

            buffer += line;

            if (buffer.endsWith('"}')) {
              const validNDJSON = JSON.parse(buffer) as TNDJSONStream;

              if (validNDJSON.type === "message") {
                fullResponse += validNDJSON.content + "\n";
                setStreamingMessage(
                  (prev) => prev + validNDJSON.content + "\n"
                );
              }

              buffer = "";
            }
          }
          console.log("fullResponse");
          console.log(fullResponse);
        }
      }
    } catch (err) {
      console.log(err);
      setStatus("error");
    }
  };

  return (
    <div className="bg-gray-100">
      {videoUrls.length > 0 && (
        <div className="mt-4 space-y-4">
          {videoUrls.map((video) => (
            <video
              key={video.fileId}
              controls
              className="w-full max-w-md mx-auto"
              preload="metadata"
            >
              <source src={video.videoUrl} type="video/mp4" />
              <source src={video.videoUrl} type="video/webm" />
              <source src={video.videoUrl} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          ))}
        </div>
      )}

      <Container>
        <div className="flex flex-col h-full">
          <Conversation className="h-full relative">
            <ConversationContent>
              {messages.length <= 0 && (
                <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-max flex flex-col gap-2 items-center">
                  <h1 className="font-bold text-5xl">
                    {welcomeMessage.heading}
                  </h1>
                  <p className="font-semibold text-lg">
                    {welcomeMessage.content}
                  </p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index}>
                  <Message from={message.role} key={index}>
                    <MessageContent>
                      <Response>{message.text}</Response>
                    </MessageContent>
                  </Message>
                </div>
              ))}
              {streamingMessage && (
                <Message from="assistant">
                  <MessageContent>
                    <Response>{streamingMessage}</Response>
                  </MessageContent>
                </Message>
              )}
              {status == "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput onSubmit={handleSubmit} className="mt-4">
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value);
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.value}
                        value={model.value}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={
                  !input || status === "submitted" || status === "streaming"
                }
                status={status}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </Container>
    </div>
  );
};

export default Home;
