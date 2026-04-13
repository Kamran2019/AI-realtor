import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { setAccessToken } from "../../api/client";

export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async (_, thunkAPI) => {
  try {
    const { data } = await api.get("/auth/me");
    return data;
  } catch (_error) {
    try {
      const refreshResponse = await api.post("/auth/refresh");
      setAccessToken(refreshResponse.data.accessToken);
      return {
        user: refreshResponse.data.user,
        account: refreshResponse.data.account,
      };
    } catch (refreshError) {
      setAccessToken(null);
      return thunkAPI.rejectWithValue(refreshError.response?.data?.message || "Not authenticated");
    }
  }
});

export const login = createAsyncThunk("auth/login", async (payload, thunkAPI) => {
  try {
    const { data } = await api.post("/auth/login", payload);
    setAccessToken(data.accessToken);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const signup = createAsyncThunk("auth/signup", async (payload, thunkAPI) => {
  try {
    const { data } = await api.post("/auth/signup", payload);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Signup failed");
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await api.post("/auth/logout");
  } catch (_error) {
    return thunkAPI.rejectWithValue("Logout failed");
  } finally {
    setAccessToken(null);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    account: null,
    initialized: false,
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    setSession(state, action) {
      state.user = action.payload.user;
      state.account = action.payload.account;
      state.error = null;
      state.initialized = true;
    },
    clearSession(state) {
      state.user = null;
      state.account = null;
      state.error = null;
      state.initialized = true;
      setAccessToken(null);
    },
    clearAuthMessage(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload.user;
        state.account = action.payload.account;
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.account = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.account = action.payload.account;
        state.successMessage = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.account = null;
      });
  },
});

export const { setSession, clearSession, clearAuthMessage } = authSlice.actions;
export default authSlice.reducer;

