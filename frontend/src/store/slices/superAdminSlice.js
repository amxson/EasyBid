import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { getAllAuctionItems } from "./auctionSlice";

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState: {
    loading: false,
    monthlyRevenue: [],
    totalAuctioneers: [],
    totalBidders: [],
    paymentProofs: [],
    singlePaymentProof: {},
  },
  reducers: {
    requestForMonthlyRevenue(state) {
      state.loading = true;
      state.monthlyRevenue = [];
    },
    successForMonthlyRevenue(state, action) {
      state.loading = false;
      state.monthlyRevenue = action.payload;
    },
    failedForMonthlyRevenue(state) {
      state.loading = false;
      state.monthlyRevenue = [];
    },
    requestForAllUsers(state) {
      state.loading = true;
      state.totalAuctioneers = [];
      state.totalBidders = [];
    },
    successForAllUsers(state, action) {
      state.loading = false;
      state.totalAuctioneers = action.payload.auctioneersArray;
      state.totalBidders = action.payload.biddersArray;
    },
    failureForAllUsers(state) {
      state.loading = false;
      state.totalAuctioneers = [];
      state.totalBidders = [];
    },
    requestForPaymentProofs(state) {
      state.loading = true;
      state.paymentProofs = [];
    },
    successForPaymentProofs(state, action) {
      state.loading = false;
      state.paymentProofs = action.payload;
    },
    failureForPaymentProofs(state) {
      state.loading = false;
      state.paymentProofs = [];
    },
    requestForDeletePaymentProof(state) {
      state.loading = true;
    },
    successForDeletePaymentProof(state) {
      state.loading = false;
    },
    failureForDeletePaymentProof(state) {
      state.loading = false;
    },
    requestForSinglePaymentProofDetail(state) {
      state.loading = true;
      state.singlePaymentProof = {};
    },
    successForSinglePaymentProofDetail(state, action) {
      state.loading = false;
      state.singlePaymentProof = action.payload;
    },
    failureForSinglePaymentProofDetail(state) {
      state.loading = false;
      state.singlePaymentProof = {};
    },
    requestForUpdatePaymentProof(state) {
      state.loading = true;
    },
    successForUpdatePaymentProof(state) {
      state.loading = false;
    },
    failureForUpdatePaymentProof(state) {
      state.loading = false;
    },
    requestForAuctionItemDelete(state) {
      state.loading = true;
    },
    successForAuctionItemDelete(state) {
      state.loading = false;
    },
    failureForAuctionItemDelete(state) {
      state.loading = false;
    },
    clearAllErrors(state) {
      state.loading = false;

      state.singlePaymentProof = {};
    },
  },
});

export const getMonthlyRevenue = () => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForMonthlyRevenue());
  try {
    const response = await axios.get("/api/v1/superadmin/monthlyincome", {
      withCredentials: true,
    });
    dispatch(
      superAdminSlice.actions.successForMonthlyRevenue(
        response.data.totalMonthlyRevenue,
      ),
    );
  } catch (error) {
    dispatch(superAdminSlice.actions.failedForMonthlyRevenue());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
  }
};

export const getAllUsers = () => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForAllUsers());
  try {
    const response = await axios.get("/api/v1/superadmin/users/getall", {
      withCredentials: true,
    });
    dispatch(superAdminSlice.actions.successForAllUsers(response.data));
  } catch (error) {
    dispatch(superAdminSlice.actions.failureForAllUsers());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
  }
};

export const getAllPaymentProofs = () => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForPaymentProofs());
  try {
    const response = await axios.get(
      "/api/v1/superadmin/paymentproofs/getall",
      { withCredentials: true },
    );
    dispatch(
      superAdminSlice.actions.successForPaymentProofs(
        response.data.paymentProofs,
      ),
    );
  } catch (error) {
    dispatch(superAdminSlice.actions.failureForPaymentProofs());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
  }
};

export const deletePaymentProof = (id) => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForDeletePaymentProof());
  try {
    const response = await axios.delete(
      `/api/v1/superadmin/paymentproof/delete/${id}`,
      { withCredentials: true },
    );
    dispatch(superAdminSlice.actions.successForDeletePaymentProof());
    dispatch(getAllPaymentProofs());
    toast.success(response.data.message);
  } catch (error) {
    dispatch(superAdminSlice.actions.failureForDeletePaymentProof());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
  }
};

export const getSinglePaymentProofDetail = (id) => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForSinglePaymentProofDetail());
  try {
    const response = await axios.get(`/api/v1/superadmin/paymentproof/${id}`, {
      withCredentials: true,
    });
    dispatch(
      superAdminSlice.actions.successForSinglePaymentProofDetail(
        response.data.paymentProofDetail,
      ),
    );
  } catch (error) {
    dispatch(superAdminSlice.actions.failureForSinglePaymentProofDetail());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
  }
};

export const updatePaymentProof = (id, status, amount) => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForUpdatePaymentProof());
  try {
    const response = await axios.put(
      `/api/v1/superadmin/paymentproof/status/update/${id}`,
      { status, amount },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      },
    );
    dispatch(superAdminSlice.actions.successForUpdatePaymentProof());
    toast.success(response.data.message);
    dispatch(getAllPaymentProofs());
    dispatch(superAdminSlice.actions.clearAllErrors());
    return true;
  } catch (error) {
    dispatch(superAdminSlice.actions.failureForUpdatePaymentProof());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    return false;
  }
};

export const deleteAuctionItem = (id) => async (dispatch) => {
  dispatch(superAdminSlice.actions.requestForAuctionItemDelete());
  try {
    const response = await axios.delete(
      `/api/v1/superadmin/auctionitem/delete/${id}`,
      { withCredentials: true },
    );
    dispatch(superAdminSlice.actions.successForAuctionItemDelete());
    toast.success(response.data.message);
    dispatch(getAllAuctionItems());
  } catch (error) {
    dispatch(superAdminSlice.actions.failureForAuctionItemDelete());
    console.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
    toast.error(
      error.response?.data?.message ||
        "Cannot reach EasyBid. Please try again.",
    );
  }
};

export const clearAllSuperAdminSliceErrors = () => (dispatch) => {
  dispatch(superAdminSlice.actions.clearAllErrors());
};

export default superAdminSlice.reducer;
