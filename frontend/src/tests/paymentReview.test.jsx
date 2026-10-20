import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import PaymentProofs from "../pages/Dashboard/sub-components/PaymentProofs";
import superAdmin from "../store/slices/superAdminSlice";
vi.mock("axios", () => ({ default: { get: vi.fn() } }));
it("keeps review closed until requested and initializes the form from the fetched proof", async () => {
  const proof = {
    _id: "proof-id",
    userId: "seller-id",
    status: "Pending",
    amount: 125.5,
    comment: "Receipt",
    proof: { url: "https://example.com/proof.png" },
  };
  axios.get.mockResolvedValue({ data: { paymentProofDetail: proof } });
  const store = configureStore({
    reducer: { superAdmin },
    preloadedState: {
      superAdmin: {
        loading: false,
        monthlyRevenue: [],
        totalAuctioneers: [],
        totalBidders: [],
        paymentProofs: [proof],
        singlePaymentProof: {},
      },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <PaymentProofs />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Update", exact: true }));
  await screen.findByRole("dialog", { name: "Review payment proof" });
  expect(screen.getByLabelText("Amount").value).toBe("125.5");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
