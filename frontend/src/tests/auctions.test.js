import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { auctionStatus, countdown, filterAuctions } from "../lib/auctions";
import { useNow } from "../hooks/useNow";
const now = Date.parse("2026-10-20T12:00:00Z");
const items = [
  {
    title: "Camera",
    category: "Electronics",
    startingBid: 100,
    currentBid: 150,
    startTime: "2026-10-20T11:00:00Z",
    endTime: "2026-10-20T13:00:00Z",
  },
  {
    title: "Chair",
    category: "Furniture",
    startingBid: 50,
    startTime: "2026-10-20T13:00:00Z",
    endTime: "2026-10-20T15:00:00Z",
  },
  {
    title: "Watch",
    category: "Collectibles",
    startingBid: 200,
    startTime: "2026-10-20T09:00:00Z",
    endTime: "2026-10-20T12:00:00Z",
  },
];
afterEach(() => vi.useRealTimers());
describe("auction discovery and deadlines", () => {
  it("filters by text, status and category without mutating listings", () => {
    expect(
      filterAuctions(
        items,
        { query: "CAM", status: "live", category: "Electronics" },
        now,
      ).map((i) => i.title),
    ).toEqual(["Camera"]);
    expect(filterAuctions(items, { query: "none" }, now)).toEqual([]);
    expect(items[0].title).toBe("Camera");
  });
  it("sorts by the effective price and puts ended listings last", () => {
    expect(filterAuctions(items, { sort: "price" }, now)[0].title).toBe(
      "Chair",
    );
    expect(filterAuctions(items, {}, now).map((i) => i.title)).toEqual([
      "Camera",
      "Chair",
      "Watch",
    ]);
  });
  it("closes exactly at the deadline and counts down to upcoming starts", () => {
    expect(auctionStatus(items[2], now)).toBe("ended");
    expect(countdown(items[1].startTime, items[1].endTime, now).hours).toBe(1);
    expect(countdown(items[2].startTime, items[2].endTime, now)).toEqual({});
  });
  it("ticks once a second and clears its timer on unmount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { result, unmount } = renderHook(useNow);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(now + 3000);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
