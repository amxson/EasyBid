import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuctionDetail } from "./auctionSlice";

const bidSlice = createSlice({
  name: "bid",
  initialState: {
    loading: false,
  },
  reducers: {
    bidRequest(state) {
      state.loading = true;
    },
    bidSuccess(state) {
      state.loading = false;
    },
    bidFailed(state) {
      state.loading = false;
    },
  },
});

export const placeBid = (id, data) => async (dispatch, getState) => {
  if (getState().bid.loading) return false;
  dispatch(bidSlice.actions.bidRequest());
  try {
    const response = await axios.post(`/api/v1/bid/place/${id}`, data, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });
    toast.success(response.data.message);
    await dispatch(getAuctionDetail(id, { silent: true }));
    dispatch(bidSlice.actions.bidSuccess());
    return true;
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    if (error.response?.status === 409)
      await dispatch(getAuctionDetail(id, { silent: true }));
    dispatch(bidSlice.actions.bidFailed());
    return false;
  }
};

export default bidSlice.reducer;
