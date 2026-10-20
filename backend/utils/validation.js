import ErrorHandler from "../middlewares/error.js";

export function moneyAmount(value) {
  if (
    !["number", "string"].includes(typeof value) ||
    !/^\d+(\.\d{1,2})?$/.test(String(value))
  ) {
    throw new ErrorHandler(
      "Enter a positive amount with at most two decimal places.",
      400,
    );
  }
  const amount = Number(value);
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > Number.MAX_SAFE_INTEGER / 100
  ) {
    throw new ErrorHandler("Enter a valid positive amount.", 400);
  }
  return amount;
}

export function auctionTimes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start <= new Date() ||
    end <= start
  ) {
    throw new ErrorHandler(
      "Choose a future start time and an end time after it.",
      400,
    );
  }
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}
