import type { TRole } from "@/pages/Home";
import axios, { isAxiosError } from "axios";

type TGetAllChatsResponse =
  | {
      success: true;
      message: string;
      data: {
        conversation_id: string;
        title: string;
      }[];
    }
  | {
      success: false;
      message: string;
    };

export const getAllChatsService = async (): Promise<TGetAllChatsResponse> => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.get<TGetAllChatsResponse>(
      `${API_URL}/api/chat/getAllChats`
    );

    return result.data;
  } catch (err) {
    console.log("Catch getAllChatsService :", err);

    if (isAxiosError(err)) {
      return {
        success: false,
        message: err.message,
      };
    }

    return {
      success: false,
      message: "Service unavailable",
    };
  }
};

type TGetChatResponse =
  | {
      success: true;
      message: string;
      data: {
        role: TRole;
        conversation_id: string;
        content: string;
        id: number;
      }[];
    }
  | {
      success: false;
      message: string;
    };

export const getChatService = async (
  conversationId: string
): Promise<TGetChatResponse> => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.get<TGetChatResponse>(
      `${API_URL}/api/chat/getChat/${conversationId}`
    );

    return result.data;
  } catch (err) {
    console.log("Catch getChat :", err);

    if (isAxiosError(err)) {
      return {
        success: false,
        message: err.message,
      };
    }

    return {
      success: false,
      message: "Service unavailable",
    };
  }
};

type TRenameChatResponse =
  | {
      success: true;
      message: string;
      data: {
        title: string;
        conversation_id: string;
      };
    }
  | {
      success: false;
      message: string;
    };

export const renameChatService = async (
  conversationId: string,
  title: string
): Promise<TRenameChatResponse> => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.put<TRenameChatResponse>(
      `${API_URL}/api/chat/renameChat`,
      {
        conversationId,
        title,
      }
    );

    return result.data;
  } catch (err) {
    console.log("Catch getChat :", err);

    if (isAxiosError(err)) {
      return {
        success: false,
        message: err.message,
      };
    }

    return {
      success: false,
      message: "Service unavailable",
    };
  }
};

type TDeleteChatResponse = {
  success: boolean;
  message: string;
};

export const deleteChatService = async (
  conversationId: string
): Promise<TDeleteChatResponse> => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.delete<TDeleteChatResponse>(
      `${API_URL}/api/chat/deleteChat/${conversationId}`
    );

    return result.data;
  } catch (err) {
    console.log("Catch deleteChatService :", err);

    if (isAxiosError(err)) {
      return {
        success: false,
        message: err.message,
      };
    }

    return {
      success: false,
      message: "Service unavailable",
    };
  }
};
