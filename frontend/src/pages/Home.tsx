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
import Container from "@/components/ui/custom/Container";
import { type ChatStatus } from "ai";
import axios from "axios";
import CustomLoader from "@/components/ui/custom/CustomLoader";
import Preview from "@/components/ui/custom/Preview";
import CustomSidebar from "@/components/ui/custom/CustomSidebar";
import { v4 as uuidV4 } from "uuid";
import { useNavigate, useSearchParams } from "react-router";
import { getChatService } from "@/services/chatServices";
import parseContent from "@/utils/parseContent";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  setError,
  setLoadingPreview,
  setPreview,
  setVideoUrls,
} from "@/store/slices/videoSlice";

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
  message?: string;
};

type TLooseAutoCompleteModel<T> = T | (string & {});
type TModels = "CLAUDE" | "DEEPSEEK";

const Home = () => {
  const [input, setInput] = useState("");
  const [model, setModel] =
    useState<TLooseAutoCompleteModel<TModels>>("CLAUDE");
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [welcomeMessage] = useState({
    heading: "Welcome to ChatMan!",
    content: "You're one prompt away from your amazing video...",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPreviewOpen, loadingPreview, videoUrls, error } = useAppSelector(
    (state) => state.video
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
      try {
        const chat = await getChatService(id);

        if (!chat.success) return;

        setMessages(
          chat.data.map((c) => ({
            role: c.role,
            text: c.role === "user" ? c.content : parseContent(c.content),
          }))
        );
        dispatch(setError(null));
      } catch (err) {
        console.error("Error loading chat:", err);
        dispatch(setError("Failed to load chat history. Please try again."));
      }
    };

    getChat(id);
  }, [searchParams, dispatch]);

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

    const isLoggedIn = !!localStorage.getItem("token");

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const conversationId = searchParams.get("id");

    if (!conversationId) {
      dispatch(setError("No conversation ID found. Please refresh the page."));
      return;
    }

    setStatus("submitted");
    setInput("");
    dispatch(setError(null));
    setMessages((prev) => [...prev, { text: input, role: "user" }]);

    const messagesToSend = [...messages, { text: input, role: "user" }];

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    try {
      const response = await axios.post<ReadableStream>(
        `${API_URL}/api/chat`,
        { model, conversationId, messages: messagesToSend },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "stream",
          adapter: "fetch",
        }
      );

      setStatus("streaming");
      const stream = response.data;
      const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

      let fullResponse = "";
      let buffer = "";
      let videoUrl = "";
      let codeEncountered = false;

      while (true) {
        try {
          const { value, done } = await reader.read();

          if (done) {
            setStatus("ready");
            break;
          }

          const lines = value.split("\n");
          console.log("lines");
          console.log(lines);

          for (const line of lines) {
            try {
              if (line.startsWith("event: loading")) {
                dispatch(setLoadingPreview(true));
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
                  dispatch(setLoadingPreview(false));
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
                    try {
                      const video = JSON.parse(videoUrl.trim()) as TVideoBase64;
                      dispatch(setVideoUrls([...videoUrls, video]));
                      dispatch(setLoadingPreview(true));
                      videoUrl = "";
                    } catch (parseErr) {
                      console.error("Error parsing video data:", parseErr);
                      dispatch(setError("Error processing video data"));
                    }
                  }

                  continue;
                }

                buffer += data;

                if (buffer.endsWith('"}')) {
                  try {
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
                  } catch (parseErr) {
                    console.error("Error parsing NDJSON:", parseErr);
                    // Continue processing other lines instead of stopping
                    buffer = "";
                  }
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
                    try {
                      const video = JSON.parse(videoUrl.trim()) as TVideoBase64;
                      dispatch(setVideoUrls([...videoUrls, video]));
                      dispatch(setPreview(true));
                      videoUrl = "";
                    } catch (parseErr) {
                      console.error("Error parsing video data:", parseErr);
                      dispatch(setError("Error processing video data"));
                    }
                  }

                  continue;
                }

                buffer += line;

                if (buffer.endsWith('"}')) {
                  try {
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
                  } catch (parseErr) {
                    console.error("Error parsing NDJSON:", parseErr);
                    // Continue processing other lines instead of stopping
                    buffer = "";
                  }
                }
              }
              console.log("fullResponse");
              console.log(fullResponse);
            } catch (lineErr) {
              console.error("Error processing line:", lineErr);
              // Continue with next line instead of stopping
              continue;
            }
          }
        } catch (readerErr) {
          console.error("Error reading stream:", readerErr);
          dispatch(setError("Error reading response stream"));
          setStatus("error");
          break;
        }
      }
    } catch (err) {
      setStatus("error");

      if (axios.isAxiosError(err)) {
        if (err.code === "NETWORK_ERROR" || !err.response) {
          dispatch(
            setError(
              "Network error. Please check your connection and try again."
            )
          );
        } else if (err.response?.status === 500) {
          dispatch(setError("Server error. Please try again later."));
        } else if (err.response?.status === 429) {
          dispatch(
            setError("Too many requests. Please wait a moment and try again.")
          );
        } else {
          dispatch(setError(`Request failed: ${"You're unauthorized"}`));
        }
      } else {
        dispatch(setError("An unexpected error occurred. Please try again."));
      }
    }
  };

  const previewCloseHandler = () => {
    dispatch(setVideoUrls([]));
    dispatch(setPreview(false));
  };

  const newChatHandler = () => {
    if (messages.length === 0) {
      return;
    }

    setMessages([]);
    setModel("CLAUDE");
    dispatch(setError(null));
    setSearchParams({ id: uuidV4() });
  };

  const prevChatHandler = async (id: string) => {
    if (searchParams.get("id") === id) return;

    try {
      const chat = await getChatService(id);

      if (!chat.success) {
        dispatch(setError(chat.message || "Failed to load previous chat"));
        return;
      }

      setSearchParams({ id });
      setMessages(
        chat.data.map((c) => ({
          role: c.role,
          text: c.role === "user" ? c.content : parseContent(c.content),
        }))
      );
      dispatch(setError(null));
    } catch (err) {
      console.error("Error loading previous chat:", err);
      dispatch(setError("Failed to load previous chat. Please try again."));
    }
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
            {/* Error Message Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={() => dispatch(setError(null))}
                    className="ml-4 text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

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
