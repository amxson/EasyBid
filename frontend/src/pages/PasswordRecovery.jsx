import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

export default function PasswordRecovery() {
  const { token } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (token && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = token
        ? await axios.put(
            `/api/v1/user/password/reset/${token}`,
            { password, confirmPassword },
            { withCredentials: true },
          )
        : await axios.post("/api/v1/user/password/forgot", { email });
      setMessage(response.data.message);
      setDone(true);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Cannot reach EasyBid. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="w-full px-5 pt-24 lg:pl-[320px] min-h-screen">
      <div className="mx-auto max-w-lg rounded-md border border-stone-200 bg-white p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-[#d6482b] mb-3">
          {token ? "Set a new password" : "Forgot password?"}
        </h1>
        <p className="text-stone-600 mb-6">
          {token
            ? "Choose a password of 8 to 72 characters."
            : "Enter your account email. We’ll send a link that expires in 15 minutes."}
        </p>
        {message && (
          <p role="status" className="mb-4 text-stone-700">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 text-[#b8381e]">
            {error}
          </p>
        )}
        {!done && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            {token ? (
              <>
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-stone-300 rounded-md p-3"
                />
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-stone-300 rounded-md p-3"
                />
              </>
            ) : (
              <>
                <label htmlFor="recovery-email">Email</label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-stone-300 rounded-md p-3"
                />
              </>
            )}
            <button
              disabled={loading}
              className="bg-[#d6482b] hover:bg-[#b8381e] text-white font-semibold rounded-md py-3"
            >
              {loading
                ? "Please wait…"
                : token
                  ? "Update password"
                  : "Send reset link"}
            </button>
          </form>
        )}
        <Link
          to="/login"
          className="inline-block mt-6 text-[#d6482b] underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    </section>
  );
}
