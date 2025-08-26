import type { TRole } from "@/pages/Home";
import axios, { isAxiosError } from "axios";

type TGetAllChatsResponse = {
  success: boolean;
  message: string;
  data: {
    conversation_id: string;
    title: string;
  }[];
};

type TGetChatResponse = {
  success: boolean;
  message: string;
  data: {
    role: TRole;
    conversation_id: string;
    content: string;
    id: number;
  }[];
};

export const getAllChatsService = async () => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.get<TGetAllChatsResponse>(
      `${API_URL}/api/chat/getAllChats`
    );

    return result.data;
  } catch (err) {
    console.log("Catch getAllChatsService :", err);

    if (isAxiosError(err)) {
      return err.message;
    }

    return "Service unavailable";
  }
};

export const getChatService = async (conversationId: string) => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.get<TGetChatResponse>(
      `${API_URL}/api/chat/getChat/${conversationId}`
    );

    return result.data;
  } catch (err) {
    console.log("Catch getChat :", err);

    if (isAxiosError(err)) {
      return err.message;
    }

    return "Service unavailable";
  }
};
