import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import videoReducer from "./slices/videoSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    video: videoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
