import { useEffect } from "react";
import { useAppDispatch } from "./reduxHooks";
import { setTheme } from "@/store/slices/themeSlice";

export const useTheme = () => {
  const dispatch = useAppDispatch();

  // theme initialization
  useEffect(() => {
    const themeinLS = localStorage.getItem("theme");

    if (themeinLS) {
      dispatch(setTheme(themeinLS === "dark" ? "dark" : "light"));
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      dispatch(setTheme(isDark ? "dark" : "light"));
    }
  }, [dispatch]);

  // listening for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        dispatch(setTheme(e.matches ? "dark" : "light"));
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [dispatch]);
};
