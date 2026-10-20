import { postCommissionProof } from "@/store/slices/commissionSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { IMAGE_ACCEPT, IMAGE_HELP, imageError, amountError } from "@/lib/forms";

const SubmitCommission = () => {
  const photo = useImageUpload();
  const form = useFormSubmission();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");

  const dispatch = useDispatch();
  const handlePaymentProof = (e) => {
    e.preventDefault();
    if (form.submitting || photo.checking) return;
    const problem = amountError(amount) || (!comment.trim() ? "Enter a comment about the payment." : "") || imageError(photo.file);
    if (problem) { form.setError(problem); return; }
    const formData = new FormData();
    formData.append("proof", photo.file);
    formData.append("amount", amount);
    formData.append("comment", comment.trim());
    form.submit(() => dispatch(postCommissionProof(formData)));
  };

  return (
    <>
      <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-start">
        <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
          <form
            className="flex flex-col gap-5 w-full"
            onSubmit={handlePaymentProof}
            onInvalid={() => form.setError("Complete the required payment fields with valid information.")}
            aria-busy={form.submitting}
          >
            <h3
              className={`text-[#D6482B] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl`}
            >
              Upload Payment Proof
            </h3>
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-amount" className="text-[16px] text-stone-500">Amount</label>
              <input
                id="payment-amount" required min="0.01" step="0.01"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-image" className="text-[16px] text-stone-500">
                Payment Proof (ScreenShot)
              </label>
              <input
                id="payment-image" required accept={IMAGE_ACCEPT} aria-describedby="payment-image-help"
                type="file"
                onChange={photo.onChange}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              />
              <p id="payment-image-help" className="text-sm text-stone-600">{IMAGE_HELP}</p>
              {photo.error && <p role="alert" className="text-[#b8381e]">{photo.error}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="payment-comment" className="text-[16px] text-stone-500">Comment</label>
              <textarea
                id="payment-comment" required maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={7}
                className="text-[16px] py-2 bg-transparent border-[1px] rounded-md px-1 border-stone-500 focus:outline-hidden"
              />
            </div>
            {form.error && <p role="alert" className="text-[#b8381e]">{form.error}</p>}
            {form.message && <p role="status" className="text-stone-700">{form.message}</p>}
            <button
              disabled={form.submitting || photo.checking}
              className="bg-[#d6482b] mx-auto font-semibold hover:bg-[#b8381e] text-xl transition-all duration-300 py-2 px-4 rounded-md text-white my-4"
              type="submit"
            >
              {photo.checking ? "Checking image..." : form.submitting ? "Uploading..." : "Upload Payment Proof"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};

export default SubmitCommission;
