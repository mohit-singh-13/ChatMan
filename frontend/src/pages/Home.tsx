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
import { useEffect, useState } from "react";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import Container from "@/components/custom/Container";
import { type ChatStatus } from "ai";
import axios from "axios";
import CustomLoader from "@/components/custom/CustomLoader";
import Preview from "@/components/custom/Preview";
import CustomSidebar from "@/components/custom/CustomSidebar";
import { v4 as uuidV4 } from "uuid";
import { useSearchParams } from "react-router";
import { getChatService } from "@/services/chatServices";
import parseContent from "@/utils/parseContent";

export type TRole = "user" | "assistant";

type TMessage = {
  text: string;
  role: TRole;
};

export type TNDJSONStream =
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

export type TVideoBase64 = {
  fileId: string;
  videoUrl: string;
  message: string;
};

type TLooseAutoCompleteModel<T> = T | (string & {});
type TModels = "CLAUDE" | "DEEPSEEK";

const Home = () => {
  const [input, setInput] = useState("");
  const [model, setModel] =
    useState<TLooseAutoCompleteModel<TModels>>("CLAUDE");
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [videoUrls, setVideoUrls] = useState<TVideoBase64[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [welcomeMessage] = useState({
    heading: "Welcome to ChatMan!",
    content: "You're one prompt away from your amazing video...",
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");

    if (!id) {
      setSearchParams({ id: uuidV4() });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const id = searchParams.get("id");

    if (!id) return;

    const getChat = async (id: string) => {
      const chat = await getChatService(id);

      if (!chat.success) return;

      setMessages(
        chat.data.map((c) => ({
          role: c.role,
          text: c.role === "user" ? c.content : parseContent(c.content),
        }))
      );
    };

    getChat(id);
  }, [searchParams]);

  const models = [
    {
      name: "Claude Sonnet 4",
      value: "CLAUDE",
    },
    {
      name: "Deepseek R1",
      value: "DEEPSEEK",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const conversationId = searchParams.get("id");

    if (!conversationId) return;

    setStatus("submitted");
    setInput("");
    setMessages((prev) => [...prev, { text: input, role: "user" }]);

    const messagesToSend = [...messages, { text: input, role: "user" }];

    try {
      const response = await axios.post<ReadableStream>(
        "http://localhost:8080/api/chat",
        { model, conversationId, messages: messagesToSend },
        { responseType: "stream", adapter: "fetch" }
      );

      setStatus("streaming");
      const stream = response.data;
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      let fullResponse = "";
      let buffer = "";
      let videoUrl = "";
      let codeEncountered = false;

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
          if (line.startsWith("event: loading")) {
            setLoadingPreview(true);
            continue;
          } else if (
            line.startsWith("event: data") ||
            line.startsWith("event: end") ||
            line.startsWith("event: video")
          ) {
            continue;
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              setLoadingPreview(false);
              setMessages((prev) => [
                ...prev,
                { role: "assistant", text: fullResponse },
              ]);
              setStreamingMessage("");
              continue;
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
                setIsPreviewOpen(true);
                videoUrl = "";
              }

              continue;
            }

            buffer += data;

            if (buffer.endsWith('"}')) {
              const validNDJSON = JSON.parse(buffer) as TNDJSONStream;

              if (
                (validNDJSON.type === "classNames" ||
                  validNDJSON.type === "message") &&
                codeEncountered
              ) {
                fullResponse += "```" + "\n";
                setStreamingMessage((prev) => prev + "```" + "\n");
                codeEncountered = false;
              }

              if (
                validNDJSON.type === "message" ||
                validNDJSON.type === "code"
              ) {
                if (!codeEncountered && validNDJSON.type === "code") {
                  codeEncountered = true;
                  fullResponse += "```" + "\n";
                  setStreamingMessage((prev) => prev + "```" + "\n");
                }

                fullResponse += validNDJSON.content;
                setStreamingMessage((prev) => prev + validNDJSON.content);
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
                setIsPreviewOpen(true);
                videoUrl = "";
              }

              continue;
            }

            buffer += line;

            if (buffer.endsWith('"}')) {
              const validNDJSON = JSON.parse(buffer) as TNDJSONStream;

              if (
                (validNDJSON.type === "classNames" ||
                  validNDJSON.type === "message") &&
                codeEncountered
              ) {
                fullResponse += "```" + "\n";
                setStreamingMessage((prev) => prev + "```" + "\n");
                codeEncountered = false;
              }

              if (
                validNDJSON.type === "message" ||
                validNDJSON.type === "code"
              ) {
                if (!codeEncountered && validNDJSON.type === "code") {
                  codeEncountered = true;
                  fullResponse += "```" + "\n";
                  setStreamingMessage((prev) => prev + "```" + "\n");
                }

                fullResponse += validNDJSON.content;
                setStreamingMessage((prev) => prev + validNDJSON.content);
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

  const previewCloseHandler = () => {
    setVideoUrls([]);
    setIsPreviewOpen(false);
  };

  const newChatHandler = () => {
    if (messages.length === 0) {
      return;
    }

    setMessages([]);
    setModel("CLAUDE");
    setSearchParams({ id: uuidV4() });
  };

  const prevChatHandler = async (id: string) => {
    const chat = await getChatService(id);

    if (!chat.success) return;

    setSearchParams({ id });
    setMessages(
      chat.data.map((c) => ({ role: c.role, text: parseContent(c.content) }))
    );
  };

  return (
    <div className="bg-secondary">
      {isPreviewOpen && (
        <Preview videos={videoUrls} onClose={previewCloseHandler} />
      )}

      {loadingPreview && <CustomLoader />}

      <CustomSidebar onNewChat={newChatHandler} onPrevChat={prevChatHandler}>
        <Container>
          <div className="flex flex-col h-full">
            {messages.length <= 0 && (
              <div className="flex-10 flex flex-col gap-4 items-center justify-center text-center">
                <h1 className="font-bold text-5xl">{welcomeMessage.heading}</h1>
                <p className="font-semibold text-lg">
                  {welcomeMessage.content}
                </p>
              </div>
            )}

            <Conversation className="relative">
              <ConversationContent>
                {messages.map((message, index) => (
                  <div key={index}>
                    <Message from={message.role} key={index}>
                      <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground dark:group-[.is-user]:bg-primary-foreground dark:group-[.is-user]:text-primary">
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
              <ConversationScrollButton variant={"secondary"} />
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
      </CustomSidebar>
    </div>
  );
};

export default Home;
