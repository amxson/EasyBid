export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const IMAGE_HELP = "JPEG, PNG, or WebP only. Maximum 4 MB.";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9]{9,15}$/;
const text = (value) => typeof value === "string" && value.trim();

export function imageError(file) {
  if (!file) return "Choose an image.";
  if (!IMAGE_ACCEPT.split(",").includes(file.type))
    return "Choose a JPEG, PNG, or WebP image. Videos are not supported.";
  if (!file.size) return "This image is empty. Choose another image.";
  if (file.size > MAX_IMAGE_BYTES) return "Choose an image no larger than 4 MB.";
  return "";
}

export function registrationError(values, image) {
  if (["userName", "email", "phone", "address", "password", "role"].some((key) => !text(values[key])))
    return "Complete all personal details and choose your role.";
  if (values.userName.trim().length < 3 || values.userName.trim().length > 40)
    return "Full name must contain 3 to 40 characters.";
  if (!emailPattern.test(values.email.trim())) return "Enter a valid email address.";
  if (!phonePattern.test(values.phone.trim())) return "Enter a phone number with 9 to 15 digits, optionally starting with +.";
  if (values.address.trim().length > 300) return "Address must contain no more than 300 characters.";
  if (values.password.length < 8) return "Use at least 8 characters for your password.";
  if (new TextEncoder().encode(values.password).length > 72)
    return "This password is too long. Use a shorter password.";
  if (!["Bidder", "Auctioneer"].includes(values.role)) return "Choose Bidder or Auctioneer.";
  if (values.role === "Auctioneer") {
    const bank = [values.bankName, values.bankAccountName, values.bankAccountNumber].map(text);
    if (bank.some(Boolean) && !bank.every(Boolean)) return "Complete all bank details or leave them empty.";
    if (!bank.every(Boolean) && !text(values.TelebirrAccountNumber) && !text(values.paypalEmail))
      return "Auctioneers must add a complete bank account, Telebirr number, or PayPal email.";
    if (text(values.TelebirrAccountNumber) && !phonePattern.test(values.TelebirrAccountNumber.trim()))
      return "Enter a valid Telebirr phone number.";
    if (text(values.paypalEmail) && !emailPattern.test(values.paypalEmail.trim())) return "Enter a valid PayPal email address.";
  }
  return imageError(image);
}

export function amountError(value) {
  const amount = Number(value);
  return !/^\d+(\.\d{1,2})?$/.test(String(value)) || !Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER / 100
    ? "Enter a positive amount with at most two decimal places."
    : "";
}

export function auctionError(values, image) {
  if (["title", "description", "category", "condition"].some((key) => !text(values[key])))
    return "Complete all auction details.";
  if (values.title.trim().length > 150 || values.description.trim().length > 10000)
    return "Use a title of up to 150 characters and a description of up to 10,000 characters.";
  const priceError = amountError(values.startingBid);
  if (priceError) return priceError;
  const start = new Date(values.startTime).getTime();
  const end = new Date(values.endTime).getTime();
  if (!values.startTime || !values.endTime || !Number.isFinite(start) || !Number.isFinite(end) || start <= Date.now() || end <= start)
    return "Choose a future start time and an end time after it.";
  return imageError(image);
}

export function requestError(error, fallback = "Cannot reach EasyBid. Please try again.") {
  if (error.response?.status === 413) return "The upload is too large. Choose an image no larger than 4 MB.";
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code) || [408, 504].includes(error.response?.status))
    return "The request timed out. Please try again. Your form has been kept.";
  return typeof error.response?.data?.message === "string" ? error.response.data.message : fallback;
}
