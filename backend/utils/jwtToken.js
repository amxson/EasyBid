export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJsonWebToken();
  res
    .status(statusCode)
    .cookie("token", token, {
      ...cookieOptions(),
      expires: new Date(
        Date.now() + Number(process.env.COOKIE_EXPIRE || 7) * 86400000,
      ),
    })
    .json({ success: true, message, user: user.toJSON() });
};
