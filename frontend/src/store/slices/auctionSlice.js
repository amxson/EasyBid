import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const auctionSlice = createSlice({
  name: "auction",
  initialState: {
    loading: false,
    itemDetail: {},
    auctionDetail: {},
    auctionBidders: [],
    detailError: null,
    myAuctions: [],
    allAuctions: [],
  },
  reducers: {
    createAuctionRequest(state) {
      state.loading = true;
    },
    createAuctionSuccess(state) {
      state.loading = false;
    },
    createAuctionFailed(state) {
      state.loading = false;
    },
    getAllAuctionItemRequest(state) {
      state.loading = true;
    },
    getAllAuctionItemSuccess(state, action) {
      state.loading = false;
      state.allAuctions = action.payload;
    },
    getAllAuctionItemFailed(state) {
      state.loading = false;
    },
    getAuctionDetailRequest(state, action) {
      if (!action.payload?.silent) state.loading = true;
      if (state.requestedId !== action.payload.id) {
        state.auctionDetail = {};
        state.auctionBidders = [];
      }
      state.detailError = null;
      state.requestedId = action.payload.id;
    },
    getAuctionDetailSuccess(state, action) {
      if (state.requestedId !== action.payload.auctionItem._id) return;
      state.loading = false;
      state.auctionDetail = action.payload.auctionItem;
      state.auctionBidders = action.payload.bidders;
    },
    getAuctionDetailFailed(state, action) {
      state.loading = false;
      if (state.requestedId !== action.payload.id) return;
      state.detailError = action.payload.message;
    },
    getMyAuctionsRequest(state) {
      state.loading = true;
      state.myAuctions = [];
    },
    getMyAuctionsSuccess(state, action) {
      state.loading = false;
      state.myAuctions = action.payload;
    },
    getMyAuctionsFailed(state) {
      state.loading = false;
      state.myAuctions = [];
    },
    deleteAuctionItemRequest(state) {
      state.loading = true;
    },
    deleteAuctionItemSuccess(state) {
      state.loading = false;
    },
    deleteAuctionItemFailed(state) {
      state.loading = false;
    },
    republishItemRequest(state) {
      state.loading = true;
    },
    republishItemSuccess(state) {
      state.loading = false;
    },
    republishItemFailed(state) {
      state.loading = false;
    },

    resetSlice(state) {
      state.loading = false;
    },
  },
});

export const getAllAuctionItems = () => async (dispatch) => {
  dispatch(auctionSlice.actions.getAllAuctionItemRequest());
  try {
    const response = await axios.get("/api/v1/auctionitem/allitems", {
      withCredentials: true,
    });
    dispatch(
      auctionSlice.actions.getAllAuctionItemSuccess(response.data.items),
    );
    dispatch(auctionSlice.actions.resetSlice());
  } catch (error) {
    dispatch(auctionSlice.actions.getAllAuctionItemFailed());
    console.error(error);
    dispatch(auctionSlice.actions.resetSlice());
  }
};

export const getMyAuctionItems = () => async (dispatch) => {
  dispatch(auctionSlice.actions.getMyAuctionsRequest());
  try {
    const response = await axios.get("/api/v1/auctionitem/myitems", {
      withCredentials: true,
    });
    dispatch(auctionSlice.actions.getMyAuctionsSuccess(response.data.items));
    dispatch(auctionSlice.actions.resetSlice());
  } catch (error) {
    dispatch(auctionSlice.actions.getMyAuctionsFailed());
    console.error(error);
    dispatch(auctionSlice.actions.resetSlice());
  }
};

export const getAuctionDetail =
  (id, { silent = false } = {}) =>
  async (dispatch) => {
    dispatch(auctionSlice.actions.getAuctionDetailRequest({ id, silent }));
    try {
      const response = await axios.get(`/api/v1/auctionitem/auction/${id}`, {
        withCredentials: true,
      });
      dispatch(auctionSlice.actions.getAuctionDetailSuccess(response.data));
      dispatch(auctionSlice.actions.resetSlice());
    } catch (error) {
      dispatch(
        auctionSlice.actions.getAuctionDetailFailed({
          id,
          message: error.response?.data?.message || "Cannot load this auction.",
        }),
      );
      console.error(error);
      dispatch(auctionSlice.actions.resetSlice());
    }
  };

export const createAuction = (data) => async (dispatch) => {
  dispatch(auctionSlice.actions.createAuctionRequest());
  try {
    const response = await axios.post("/api/v1/auctionitem/create", data, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(auctionSlice.actions.createAuctionSuccess());
    toast.success(response.data.message);
    dispatch(getAllAuctionItems());
    dispatch(auctionSlice.actions.resetSlice());
  } catch (error) {
    dispatch(auctionSlice.actions.createAuctionFailed());
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    dispatch(auctionSlice.actions.resetSlice());
  }
};

export const republishAuction = (id, data) => async (dispatch) => {
  dispatch(auctionSlice.actions.republishItemRequest());
  try {
    const response = await axios.put(
      `/api/v1/auctionitem/item/republish/${id}`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      },
    );
    dispatch(auctionSlice.actions.republishItemSuccess());
    toast.success(response.data.message);
    dispatch(getMyAuctionItems());
    dispatch(getAllAuctionItems());
    dispatch(auctionSlice.actions.resetSlice());
  } catch (error) {
    dispatch(auctionSlice.actions.republishItemFailed());
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    dispatch(auctionSlice.actions.resetSlice());
  }
};

export const deleteAuction = (id) => async (dispatch) => {
  dispatch(auctionSlice.actions.deleteAuctionItemRequest());
  try {
    const response = await axios.delete(`/api/v1/auctionitem/delete/${id}`, {
      withCredentials: true,
    });
    dispatch(auctionSlice.actions.deleteAuctionItemSuccess());
    toast.success(response.data.message);
    dispatch(getMyAuctionItems());
    dispatch(getAllAuctionItems());
    dispatch(auctionSlice.actions.resetSlice());
  } catch (error) {
    dispatch(auctionSlice.actions.deleteAuctionItemFailed());
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    dispatch(auctionSlice.actions.resetSlice());
  }
};

export default auctionSlice.reducer;
