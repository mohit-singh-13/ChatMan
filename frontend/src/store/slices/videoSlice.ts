import type { TVideoBase64 } from "@/pages/Home";
import { produceVideoService } from "@/services/videoService";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";

type TInitialState = {
  code: string;
  loadingPreview: boolean;
  isPreviewOpen: boolean;
  videoUrls: TVideoBase64[];
  error: string | null;
};

const initialState: TInitialState = {
  code: "",
  loadingPreview: false,
  isPreviewOpen: false,
  videoUrls: [],
  error: null,
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setVideoUrls: (state, action: PayloadAction<TVideoBase64[]>) => {
      state.videoUrls = action.payload;
      state.error = null;
    },

    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },

    setPreview: (state, action: PayloadAction<boolean>) => {
      state.isPreviewOpen = action.payload;
    },

    setLoadingPreview: (state, action: PayloadAction<boolean>) => {
      state.loadingPreview = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loadingPreview = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, { payload }) => {
        state.isPreviewOpen = true;
        state.loadingPreview = false;
        state.videoUrls = payload ?? [];
        state.error = null;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loadingPreview = false;
        state.error = (action.payload as string) || "Failed to fetch videos";
      });
  },
});

export const fetchVideos = createAsyncThunk<
  TVideoBase64[], // Return type
  void, // Argument type (no argument)
  { state: RootState; rejectValue: string } // ThunkAPI types
>("videos/fetchVideos", async (_, { getState, rejectWithValue }) => {
  try {
    const result = await produceVideoService(getState().video.code);

    if (result.success) {
      return result.data;
    }

    return rejectWithValue(result.message);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return rejectWithValue(errorMessage);
  }
});

export const {
  setVideoUrls,
  setCode,
  setPreview,
  setLoadingPreview,
  setError,
  clearError,
} = videoSlice.actions;
export default videoSlice.reducer;
