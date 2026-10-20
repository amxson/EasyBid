import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";

export default function BidHelp({ auctionId }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [useAI, setUseAI] = useState(false);
  useEffect(() => {
    let active = true;
    axios
      .get("/api/v1/help/status")
      .then(({ data }) => {
        if (active) setAiAvailable(data.aiAvailable);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function ask(event) {
    event.preventDefault();
    if (busy || !question.trim()) return;
    setBusy(true);
    setError("");
    const text = question.trim();
    try {
      const { data } = await axios.post(
        "/api/v1/help/ask",
        {
          message: text,
          auctionId,
          budget,
          useAI,
          history: messages
            .slice(-6)
            .map(({ role, content }) => ({ role, content })),
        },
        { withCredentials: true },
      );
      setMessages((current) => [
        ...current.slice(-8),
        { role: "user", content: text },
        {
          role: "assistant",
          content: data.answer,
          mode: data.mode,
          notice: data.notice,
        },
      ]);
      setQuestion("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Cannot reach bid help. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="bg-white border border-stone-200 rounded-md p-5 mt-6">
      <summary className="font-semibold text-lg cursor-pointer">
        Bid help
      </summary>
      <p className="text-sm text-stone-600 mt-3">
        Ask about this listing, check your budget, or get help with EasyBid. No
        bids are placed here.
      </p>
      <div
        role="log"
        aria-label="Bid help conversation"
        aria-live="polite"
        className="space-y-3 my-4 max-h-96 overflow-y-auto"
      >
        {messages.map((item, index) => (
          <div
            key={index}
            className={
              item.role === "user"
                ? "border-l-2 border-[#d6482b] pl-3"
                : "bg-stone-50 rounded-md p-3"
            }
          >
            <p className="text-xs text-stone-500 mb-1">
              {item.role === "user"
                ? "You"
                : item.mode === "ai"
                  ? "AI answer"
                  : "Auction guide"}
            </p>
            {item.notice && (
              <p className="text-sm text-stone-500 mb-1">{item.notice}</p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={ask} className="flex flex-col gap-3">
        <label htmlFor="help-budget" className="text-sm">
          Your limit in Birr (optional)
        </label>
        <input
          id="help-budget"
          type="number"
          min="0.01"
          step="0.01"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="border border-stone-300 rounded-md p-2 max-w-56"
        />
        <label htmlFor="help-question" className="text-sm">
          Your question
        </label>
        <textarea
          id="help-question"
          required
          maxLength={1000}
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What should I check before bidding?"
          className="border border-stone-300 rounded-md p-3"
        />
        {aiAvailable && (
          <label className="text-sm text-stone-600 flex gap-2 items-start">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="mt-1 accent-[#d6482b]"
            />
            Use AI for this answer. Your question, recent chat, budget, and
            listing details are sent to OpenAI. Keep passwords and payment
            details out of chat.
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-[#b8381e]">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="self-start rounded-md bg-[#d6482b] hover:bg-[#b8381e] text-white px-4 py-2 font-semibold"
        >
          {busy ? "Checking…" : "Ask"}
        </button>
      </form>
    </details>
  );
}
BidHelp.propTypes = { auctionId: PropTypes.string.isRequired };
