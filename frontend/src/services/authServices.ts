import axios, { isAxiosError } from "axios";

type TAuthResponse =
  | {
      success: true;
      message: string;
      data: {
        token: string;
      };
    }
  | {
      success: false;
      message: string;
    };

export const loginService = async (
  email: string,
  password: string
): Promise<TAuthResponse> => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.post<TAuthResponse>(
      `${API_URL}/api/auth/login`,
      {
        email,
        password,
      }
    );

    if (result.data.success) {
      localStorage.setItem("token", result.data.data.token);
    }

    return result.data;
  } catch (err) {
    console.log("Catch loginService :", err);

    if (isAxiosError(err)) {
      return {
        success: false,
        message: err.response?.data.message,
      };
    }

    return {
      success: false,
      message: "Service unavailable",
    };
  }
};

export const signupService = async (
  name: string,
  email: string,
  password: string
): Promise<TAuthResponse> => {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const result = await axios.post<TAuthResponse>(
      `${API_URL}/api/auth/signup`,
      {
        name,
        email,
        password,
      }
    );

    if (result.data.success) {
      localStorage.setItem("token", result.data.data.token);
    }

    return result.data;
  } catch (err) {
    console.log("Catch signupService :", err);

    if (isAxiosError(err)) {
      return {
        success: false,
        message: err.response?.data.message,
      };
    }

    return {
      success: false,
      message: "Service unavailable",
    };
  }
};
