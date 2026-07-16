import {
  clearAllSuperAdminSliceErrors,
  getAllPaymentProofs,
  getAllUsers,
  getMonthlyRevenue,
} from "@/store/slices/superAdminSlice";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuctionItemDelete from "./sub-components/AuctionItemDelete";
import BiddersAuctioneersGraph from "./sub-components/BiddersAuctioneersGraph";
import PaymentGraph from "./sub-components/PaymentGraph";
import PaymentProofs from "./sub-components/PaymentProofs";
import Spinner from "@/custom-components/Spinner";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.superAdmin);
  const {
    user,
    isAuthenticated,
    authenticationChecked,
  } = useSelector((state) => state.user);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!authenticationChecked) {
      return;
    }

    if (!isAuthenticated || user.role !== "Super Admin") {
      navigateTo("/");
      return;
    }

    dispatch(getMonthlyRevenue());
    dispatch(getAllUsers());
    dispatch(getAllPaymentProofs());
    dispatch(clearAllSuperAdminSliceErrors());
  }, [
    authenticationChecked,
    dispatch,
    isAuthenticated,
    navigateTo,
    user.role,
  ]);

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col gap-10">
            <h1
              className={`text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
            >
              Dashboard
            </h1>
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
                  Monthly Total Payments Received
                </h3>
                <PaymentGraph />
              </div>
              <div>
                <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
                  Users
                </h3>
                <BiddersAuctioneersGraph />
              </div>
              <div>
                <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
                  Payment Proofs
                </h3>
                <PaymentProofs />
              </div>
              <div>
                <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
                  Delete Items From Auction
                </h3>
                <AuctionItemDelete />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Dashboard;
