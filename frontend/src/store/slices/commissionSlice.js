import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { requestError } from "@/lib/forms";

const commissionSlice = createSlice({
  name: "commission",
  initialState: {
    loading: false,
  },
  reducers: {
    postCommissionProofRequest(state) {
      state.loading = true;
    },
    postCommissionProofSuccess(state) {
      state.loading = false;
    },
    postCommissionProofFailed(state) {
      state.loading = false;
    },
  },
});

export const postCommissionProof = (data) => async (dispatch) => {
  dispatch(commissionSlice.actions.postCommissionProofRequest());
  try {
    const response = await axios.post("/api/v1/commission/proof", data, {
      withCredentials: true,
      timeout: 45000,
    });
    dispatch(commissionSlice.actions.postCommissionProofSuccess());
    toast.success(response.data.message);
    return { success: true, message: response.data.message };
  } catch (error) {
    dispatch(commissionSlice.actions.postCommissionProofFailed());
    const message = requestError(error);
    toast.error(message);
    return { success: false, message };
  }
};

export default commissionSlice.reducer;
