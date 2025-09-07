import axios, { isAxiosError } from "axios";

type TProduceVideoResponse =
  | {
      success: true;
      data: string[];
    }
  | {
      success: false;
      message: string;
    };

export const produceVideoService = async (code: string) => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.post<TProduceVideoResponse>(
      `${API_URL}/api/video/produceVideo`,
      {
        code,
      }
    );

    return result.data;
  } catch (err) {
    console.log("Catch produceVideoService :", err);

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
