import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setTheme } from "@/store/slices/themeSlice";
import { Moon, SunMedium } from "lucide-react";

const ThemeToggle = () => {
  const theme = useAppSelector((state) => state.theme.theme);
  const dispatch = useAppDispatch();

  const handleToggle = () => {
    localStorage.setItem("theme", theme === "dark" ? "light" : "dark");
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  };

  return (
    <div className={theme}>
      <button
        onClick={handleToggle}
        title="Toggle theme"
        className={`relative w-16 h-8 rounded-full transition-colors duration-200 focus:outline-none bg-neutral-400 dark:bg-gray-700 cursor-pointer`}
      >
        <div
          className={`
            absolute top-1 w-6 h-6 rounded-full transition-transform duration-200 flex items-center justify-center translate-x-1 bg-white dark:translate-x-9 dark:bg-gray-800
          `}
        >
          {theme === "dark" ? (
            <Moon className="w-4 h-4 text-gray-200" />
          ) : (
            <SunMedium className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
