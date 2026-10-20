class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error.";
  if (
    ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
      err.name,
    )
  ) {
    status = 401;
    message = "Your session has expired. Please log in again.";
  } else if (err.name === "CastError" || err.name === "ValidationError") {
    status = 400;
    message = err.errors
      ? Object.values(err.errors)
          .map((error) => error.message)
          .join(" ")
      : "Invalid value.";
  } else if (err.code === 11000) {
    status = 409;
    message = "This record already exists.";
  }
  if (status >= 500) {
    console.error("Request failed:", err);
    message = "Something went wrong. Please try again.";
  }
  res.status(status).json({ success: false, message });
};

export default ErrorHandler;
