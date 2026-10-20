import { beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import BidHelp from "../custom-components/BidHelp";
vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockResolvedValue({ data: { aiAvailable: false } });
});
it("uses the built-in guide by default and sends the selected budget", async () => {
  axios.post.mockResolvedValue({
    data: { answer: "Keep your limit.", mode: "guide" },
  });
  render(<BidHelp auctionId="auction-id" />);
  fireEvent.click(screen.getByText("Bid help"));
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "Should I bid?" },
  });
  fireEvent.change(screen.getByLabelText("Your limit in Birr (optional)"), {
    target: { value: "100" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await waitFor(() =>
    expect(screen.getByText("Keep your limit.")).toBeTruthy(),
  );
  expect(axios.post.mock.calls[0][1]).toMatchObject({
    useAI: false,
    budget: "100",
    auctionId: "auction-id",
  });
  expect(screen.getByText("Auction guide")).toBeTruthy();
});
it("requires explicit opt-in for AI and labels the returned answer", async () => {
  axios.get.mockResolvedValue({ data: { aiAvailable: true } });
  axios.post.mockResolvedValue({
    data: { answer: "Review the condition.", mode: "ai" },
  });
  render(<BidHelp auctionId="auction-id" />);
  fireEvent.click(screen.getByText("Bid help"));
  const toggle = await screen.findByRole("checkbox");
  expect(toggle.checked).toBe(false);
  fireEvent.click(toggle);
  fireEvent.change(screen.getByLabelText("Your question"), {
    target: { value: "What should I check?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await screen.findByText("AI answer");
  expect(axios.post.mock.calls[0][1].useAI).toBe(true);
});
