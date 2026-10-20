import { useRef, useState } from "react";
import { requestError } from "@/lib/forms";

export function useFormSubmission() {
  const active = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(task) {
    if (active.current) return false;
    active.current = true;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const result = await task();
      if (result === true || result?.success) {
        setMessage(result?.message || "Submitted successfully.");
        return true;
      }
      setError(result?.message || "Could not submit the form. Please try again.");
      return false;
    } catch (error) {
      setError(requestError(error));
      return false;
    } finally {
      active.current = false;
      setSubmitting(false);
    }
  }
  return { submitting, error, message, setError, submit };
}
