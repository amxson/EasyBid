import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { requestError } from "@/lib/forms";

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    authGeneration: 0,
    leaderboardLoading: false,
    authenticationChecked: false,
    isAuthenticated: false,
    user: {},
    leaderboard: [],
  },
  reducers: {
    registerRequest(state) {
      state.authGeneration = (state.authGeneration || 0) + 1;
      state.loading = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    registerSuccess(state, action) {
      state.loading = false;
      state.authenticationChecked = true;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    registerFailed(state) {
      state.loading = false;
      state.authenticationChecked = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    loginRequest(state) {
      state.authGeneration = (state.authGeneration || 0) + 1;
      state.loading = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.authenticationChecked = true;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    loginFailed(state) {
      state.loading = false;
      state.authenticationChecked = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    fetchUserRequest(state) {
      state.loading = true;
      state.authenticationChecked = false;
      state.isAuthenticated = false;
      state.user = {};
    },
    fetchUserSuccess(state, action) {
      state.loading = false;
      state.authenticationChecked = true;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    fetchUserFailed(state) {
      state.loading = false;
      state.authenticationChecked = true;
      state.isAuthenticated = false;
      state.user = {};
    },

    logoutSuccess(state) {
      state.authGeneration = (state.authGeneration || 0) + 1;
      state.authenticationChecked = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    logoutFailed(state) {
      state.loading = false;
    },
    fetchLeaderboardRequest(state) {
      state.leaderboardLoading = true;
      state.leaderboard = [];
    },
    fetchLeaderboardSuccess(state, action) {
      state.leaderboardLoading = false;
      state.leaderboard = action.payload;
    },
    fetchLeaderboardFailed(state) {
      state.leaderboardLoading = false;
      state.leaderboard = [];
    },
    clearAllErrors(state) {
      state.loading = false;
    },
  },
});

export const register = (data) => async (dispatch) => {
  dispatch(userSlice.actions.registerRequest());
  try {
    const response = await axios.post("/api/v1/user/register", data, {
      withCredentials: true,
      timeout: 45000,
    });
    dispatch(userSlice.actions.registerSuccess(response.data));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
    return { success: true, message: response.data.message };
  } catch (error) {
    dispatch(userSlice.actions.registerFailed());
    const message = requestError(error);
    toast.error(message);
    dispatch(userSlice.actions.clearAllErrors());
    return { success: false, message };
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(userSlice.actions.loginRequest());
  try {
    const response = await axios.post("/api/v1/user/login", data, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    dispatch(userSlice.actions.loginSuccess(response.data));
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
    return { success: true, message: response.data.message };
  } catch (error) {
    dispatch(userSlice.actions.loginFailed());
    const message = requestError(error);
    toast.error(message);
    dispatch(userSlice.actions.clearAllErrors());
    return { success: false, message };
  }
};

export const logout = () => async (dispatch) => {
  try {
    const response = await axios.post(
      "/api/v1/user/logout",
      {},
      { withCredentials: true },
    );
    dispatch(userSlice.actions.logoutSuccess());
    toast.success(response.data.message);
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    dispatch(userSlice.actions.logoutFailed());
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    dispatch(userSlice.actions.clearAllErrors());
  }
};

export const fetchUser = () => async (dispatch, getState) => {
  const generation = getState().user.authGeneration;
  dispatch(userSlice.actions.fetchUserRequest());
  try {
    const response = await axios.get("/api/v1/user/me", {
      withCredentials: true,
    });
    if (getState().user.authGeneration !== generation) return;
    dispatch(userSlice.actions.fetchUserSuccess(response.data.user));
    dispatch(userSlice.actions.clearAllErrors());
  } catch (error) {
    if (getState().user.authGeneration !== generation) return;
    dispatch(userSlice.actions.fetchUserFailed());
    dispatch(userSlice.actions.clearAllErrors());
    console.error(error);
  }
};

export const fetchLeaderboard = () => async (dispatch) => {
  dispatch(userSlice.actions.fetchLeaderboardRequest());
  try {
    const response = await axios.get("/api/v1/user/leaderboard", {
      withCredentials: true,
    });
    dispatch(
      userSlice.actions.fetchLeaderboardSuccess(response.data.leaderboard),
    );
  } catch (error) {
    dispatch(userSlice.actions.fetchLeaderboardFailed());
    console.error(error);
  }
};

export default userSlice.reducer;
