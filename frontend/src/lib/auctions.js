export function auctionStatus(item, now = Date.now()) {
  if (new Date(item.endTime).getTime() <= now) return "ended";
  if (new Date(item.startTime).getTime() > now) return "upcoming";
  return "live";
}
export function filterAuctions(
  items,
  { query = "", status = "all", category = "all", sort = "ending" },
  now = Date.now(),
) {
  const search = query.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        (!search ||
          `${item.title} ${item.description || ""}`
            .toLowerCase()
            .includes(search)) &&
        (status === "all" || auctionStatus(item, now) === status) &&
        (category === "all" || item.category === category),
    )
    .sort((a, b) => {
      if (sort === "price")
        return (
          Math.max(a.currentBid || 0, a.startingBid) -
          Math.max(b.currentBid || 0, b.startingBid)
        );
      if (sort === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      const order = { live: 0, upcoming: 1, ended: 2 };
      return (
        order[auctionStatus(a, now)] - order[auctionStatus(b, now)] ||
        new Date(a.endTime) - new Date(b.endTime)
      );
    });
}
export function countdown(startTime, endTime, now) {
  const target =
    new Date(startTime) > now ? new Date(startTime) : new Date(endTime);
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  if (!Number.isFinite(seconds) || target <= now) return {};
  return {
    type: new Date(startTime) > now ? "Starts In:" : "Ends In:",
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}
