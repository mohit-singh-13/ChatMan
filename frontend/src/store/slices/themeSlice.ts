import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type TThemes = "dark" | "light";

type TInititalState = {
  theme: TThemes;
};

const initialState: TInititalState = {
  theme: "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<TThemes>) => {
      state.theme = action.payload;

      if (action.payload === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
