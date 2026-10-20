import ErrorHandler from "../middlewares/error.js";

export function registrationDetails(body) {
  const required = ["userName", "email", "phone", "address", "password", "role"];
  if (required.some((key) => typeof body[key] !== "string" || !body[key].trim()))
    throw new ErrorHandler("Complete all personal details and choose your role.", 400);
  const values = Object.fromEntries(required.map((key) => [key, key === "password" ? body[key] : body[key].trim()]));
  if (!["Bidder", "Auctioneer"].includes(values.role)) throw new ErrorHandler("Choose Bidder or Auctioneer.", 400);
  if (values.userName.length < 3 || values.userName.length > 40 || values.address.length > 300)
    throw new ErrorHandler("Use a full name of 3 to 40 characters and an address of up to 300 characters.", 400);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^\+?[0-9]{9,15}$/;
  if (!email.test(values.email) || values.email.length > 254) throw new ErrorHandler("Enter a valid email address.", 400);
  if (!phone.test(values.phone)) throw new ErrorHandler("Enter a phone number with 9 to 15 digits, optionally starting with +.", 400);
  if (values.password.length < 8) throw new ErrorHandler("Use at least 8 characters for your password.", 400);
  if (Buffer.byteLength(values.password, "utf8") > 72) throw new ErrorHandler("This password is too long. Use a shorter password.", 400);
  for (const key of ["bankAccountNumber", "bankAccountName", "bankName", "TelebirrAccountNumber", "paypalEmail"]) {
    if (body[key] !== undefined && typeof body[key] !== "string") throw new ErrorHandler("Enter valid payment details.", 400);
    values[key] = values.role === "Auctioneer" ? (body[key] || "").trim() : "";
    if (values[key].length > 100) throw new ErrorHandler("Payment details must contain no more than 100 characters per field.", 400);
  }
  if (values.role === "Auctioneer") {
    const bank = [values.bankAccountName, values.bankAccountNumber, values.bankName];
    if (bank.some(Boolean) && !bank.every(Boolean)) throw new ErrorHandler("Complete all bank details or leave them empty.", 400);
    if (!bank.every(Boolean) && !values.TelebirrAccountNumber && !values.paypalEmail)
      throw new ErrorHandler("Add a complete bank account, Telebirr number, or PayPal email for receiving payment.", 400);
    if (values.TelebirrAccountNumber && !phone.test(values.TelebirrAccountNumber)) throw new ErrorHandler("Enter a valid Telebirr phone number.", 400);
    if (values.paypalEmail && !email.test(values.paypalEmail)) throw new ErrorHandler("Enter a valid PayPal email address.", 400);
  }
  return values;
}

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
