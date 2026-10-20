import { beforeEach, it, expect, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import axios from "axios";
import bidReducer, { placeBid } from "../store/slices/bidSlice";
import auctionReducer from "../store/slices/auctionSlice";
vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
it("ignores repeat submission while the first bid is pending and refreshes after success", async () => {
  let accept;
  axios.post.mockImplementation(
    () =>
      new Promise((resolve) => {
        accept = resolve;
      }),
  );
  axios.get.mockResolvedValue({
    data: { auctionItem: { _id: "listing", currentBid: 200 }, bidders: [] },
  });
  const store = configureStore({
    reducer: { bid: bidReducer, auction: auctionReducer },
  });
  const first = store.dispatch(placeBid("listing", { amount: 200 }));
  expect(await store.dispatch(placeBid("listing", { amount: 200 }))).toBe(
    false,
  );
  expect(axios.post).toHaveBeenCalledTimes(1);
  accept({ data: { message: "Bid placed." } });
  expect(await first).toBe(true);
  expect(store.getState().auction.auctionDetail.currentBid).toBe(200);
  expect(store.getState().bid.loading).toBe(false);
});
it("refreshes the current price after a conflict and handles network errors", async () => {
  axios.post
    .mockRejectedValueOnce({
      response: { status: 409, data: { message: "Price changed." } },
    })
    .mockRejectedValueOnce(new Error("Network unavailable"));
  axios.get.mockResolvedValue({
    data: { auctionItem: { _id: "listing", currentBid: 250 }, bidders: [] },
  });
  const store = configureStore({
    reducer: { bid: bidReducer, auction: auctionReducer },
  });
  expect(await store.dispatch(placeBid("listing", { amount: 200 }))).toBe(
    false,
  );
  expect(store.getState().auction.auctionDetail.currentBid).toBe(250);
  expect(await store.dispatch(placeBid("listing", { amount: 300 }))).toBe(
    false,
  );
  expect(store.getState().bid.loading).toBe(false);
});
