import PropTypes from "prop-types";
import {
  deletePaymentProof,
  getSinglePaymentProofDetail,
  updatePaymentProof,
} from "@/store/slices/superAdminSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

const PaymentProofs = () => {
  const { paymentProofs, singlePaymentProof } = useSelector(
    (state) => state.superAdmin,
  );
  const [openDrawer, setOpenDrawer] = useState(false);
  const dispatch = useDispatch();

  const handlePaymentProofDelete = (id) => {
    dispatch(deletePaymentProof(id));
  };

  const handleFetchPaymentDetail = (id) => {
    dispatch(getSinglePaymentProofDetail(id));
  };

  useEffect(() => {
    if (singlePaymentProof && Object.keys(singlePaymentProof).length > 0) {
      setOpenDrawer(true);
    }
  }, [singlePaymentProof]);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white mt-5">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="w-1/3 py-2">User ID</th>
              <th className="w-1/3 py-2">Status</th>
              <th className="w-1/3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {paymentProofs.length > 0 ? (
              paymentProofs.map((element, index) => {
                return (
                  <tr key={index}>
                    <td className="py-2 px-4 text-center">{element.userId}</td>
                    <td className="py-2 px-4 text-center">{element.status}</td>
                    <td className="flex items-center py-4 justify-center gap-3">
                      <button
                        className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-700 transition-all duration-300"
                        onClick={() => handleFetchPaymentDetail(element._id)}
                      >
                        Update
                      </button>
                      <button
                        disabled={["Approved", "Settled"].includes(
                          element.status,
                        )}
                        className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-700 transition-all duration-300"
                        onClick={() => handlePaymentProofDelete(element._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="text-center text-xl text-sky-600 py-3">
                <td>No payment proofs are found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {openDrawer && singlePaymentProof._id && (
        <Drawer key={singlePaymentProof._id} setOpenDrawer={setOpenDrawer} />
      )}
    </>
  );
};

export default PaymentProofs;
export const Drawer = ({ setOpenDrawer }) => {
  const { singlePaymentProof, loading } = useSelector(
    (state) => state.superAdmin,
  );
  const [amount, setAmount] = useState(singlePaymentProof.amount || "");
  const [status, setStatus] = useState(singlePaymentProof.status || "");

  const dispatch = useDispatch();
  const handlePaymentProofUpdate = async () => {
    if (
      await dispatch(updatePaymentProof(singlePaymentProof._id, status, amount))
    )
      setOpenDrawer(false);
  };

  return (
    <>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Review payment proof"
        className="fixed inset-0 z-[60] w-full h-full bg-[#00000087] flex items-end"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpenDrawer(false);
        }}
      >
        <div className="bg-white w-full h-full max-h-full sm:max-w-[640px] sm:m-auto transition-all duration-300 flex flex-col">
          <div className="overflow-y-auto px-5 py-8">
            <h3 className="text-[#D6482B] text-3xl font-semibold text-center mb-1">
              Update Payment Proof
            </h3>
            <p className="text-stone-600">
              You can update payment status and amount.
            </p>
            <form className="flex flex-col gap-5 my-5">
              <div className="flex flex-col gap-3">
                <label className="text-[16px] text-stone-600 ">User ID</label>
                <input
                  type="text"
                  value={singlePaymentProof.userId || ""}
                  disabled
                  onChange={(e) => e.target.value}
                  className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-hidden  text-stone-600"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="proof-amount"
                  className="text-[16px] text-stone-600"
                >
                  Amount
                </label>
                <input
                  id="proof-amount"
                  min="0.01"
                  step="0.01"
                  disabled={singlePaymentProof.status === "Settled"}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-hidden"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[16px] text-stone-600">Status</label>
                <select
                  disabled={singlePaymentProof.status === "Settled"}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-hidden"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  {singlePaymentProof.status === "Settled" && (
                    <option value="Settled">Settled</option>
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[16px] text-stone-600">Comment</label>
                <textarea
                  rows={5}
                  value={singlePaymentProof.comment || ""}
                  onChange={(e) => e.target.value}
                  disabled
                  className="text-xl px-1 py-2 bg-transparent border-[1px] border-stone-600  rounded-md focus:outline-hidden text-stone-600"
                />
              </div>
              <div>
                <Link
                  to={singlePaymentProof.proof?.url || ""}
                  className="bg-[#D6482B] flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-[#b8381e]"
                  target="_blank"
                >
                  Payment Proof (SS)
                </Link>
              </div>
              <div>
                <button
                  type="button"
                  className="bg-blue-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-blue-700"
                  disabled={loading || singlePaymentProof.status === "Settled"}
                  onClick={handlePaymentProofUpdate}
                >
                  {loading ? "Updating Payment Proof" : "Update Payment Proof"}
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="bg-yellow-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-yellow-700"
                  onClick={() => setOpenDrawer(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

Drawer.propTypes = {
  setOpenDrawer: PropTypes.func.isRequired,
};
