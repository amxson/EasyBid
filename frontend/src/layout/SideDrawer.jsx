import { useState } from "react";
import { RiAuctionFill } from "react-icons/ri";
import { MdLeaderboard, MdDashboard } from "react-icons/md";
import { SiGooglesearchconsole } from "react-icons/si";
import { BsFillInfoSquareFill } from "react-icons/bs";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdCloseCircleOutline, IoIosCreate } from "react-icons/io";
import { FaUserCircle } from "react-icons/fa";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { FaEye } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/userSlice";
import { Link } from "react-router-dom";

const SideDrawer = () => {
  const [show, setShow] = useState(false);

  const { isAuthenticated, user } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      <button
        type="button"
        aria-label={show ? "Close menu" : "Open menu"}
        aria-expanded={show}
        aria-controls="main-navigation"
        onClick={() => setShow(!show)}
        className="fixed z-50 right-5 top-5 bg-[#D6482B] text-white text-3xl p-2 rounded-md hover:bg-[#b8381e] lg:hidden"
      >
        <GiHamburgerMenu />
      </button>
      <nav
        id="main-navigation"
        aria-label="Main navigation"
        onClick={(event) => {
          if (event.target.closest("a")) setShow(false);
        }}
        className={`z-40 overflow-y-auto ${show ? "visible" : "invisible"} lg:visible w-[100%] sm:w-[300px] bg-[#f6f4f0] h-full fixed top-0 ${
          show ? "left-0" : "left-[-100%]"
        } transition-all duration-100 p-4 flex flex-col justify-between lg:left-0 border-r-[1px] border-r-stone-500`}
      >
        <div className="relative">
          <Link to={"/"}>
            <h4 className="text-2xl font-semibold mb-4">
              Easy<span className="text-[#D6482b]">Bid</span>
            </h4>
          </Link>
          <ul className="flex flex-col gap-3">
            <li>
              <Link
                to={"/auctions"}
                className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
              >
                <RiAuctionFill /> Auctions
              </Link>
            </li>
            <li>
              <Link
                to={"/leaderboard"}
                className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
              >
                <MdLeaderboard /> Leaderboard
              </Link>
            </li>
            {isAuthenticated && user && user.role === "Auctioneer" && (
              <>
                <li>
                  <Link
                    to={"/submit-commission"}
                    className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
                  >
                    <FaFileInvoiceDollar /> Submit Commission
                  </Link>
                </li>
                <li>
                  <Link
                    to={"/create-auction"}
                    className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
                  >
                    <IoIosCreate /> Create Auction
                  </Link>
                </li>
                <li>
                  <Link
                    to={"/view-my-auctions"}
                    className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
                  >
                    <FaEye /> View My Auctions
                  </Link>
                </li>
              </>
            )}
            {isAuthenticated && user && user.role === "Super Admin" && (
              <li>
                <Link
                  to={"/dashboard"}
                  className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
                >
                  <MdDashboard /> Dashboard
                </Link>
              </li>
            )}
          </ul>
          {!isAuthenticated ? (
            <>
              <div className="my-4 flex gap-2">
                <Link
                  to={"/sign-up"}
                  className="bg-[#D6482B] font-semibold hover:bg-[#b8381e] text-xl py-1 px-4 rounded-md text-white"
                >
                  Sign Up
                </Link>
                <Link
                  to={"/login"}
                  className="text-[#d6482b] bg-transparent border-stone-300 border-2 hover:bg-[#fffefd] hover:text-[#fdba88] font-bold text-xl py-1 px-4 rounded-md"
                >
                  Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="my-4 flex gap-4 w-fit" onClick={handleLogout}>
                <button className="bg-[#D6482B] font-semibold hover:bg-[#b8381e] text-xl py-1 px-4 rounded-md text-white">
                  Logout
                </button>
              </div>
            </>
          )}
          <hr className="mb-4 border-t-[#d6482b]" />
          <ul className="flex flex-col gap-3">
            {isAuthenticated && (
              <li>
                <Link
                  to={"/me"}
                  className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
                >
                  <FaUserCircle /> Profile
                </Link>
              </li>
            )}
            <li>
              <Link
                to={"/how-it-works-info"}
                className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
              >
                <SiGooglesearchconsole /> How it works
              </Link>
            </li>
            <li>
              <Link
                to={"/about"}
                className="flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150"
              >
                <BsFillInfoSquareFill /> About Us
              </Link>
            </li>
          </ul>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setShow(false)}
            className="absolute top-0 right-4 text-[28px] lg:hidden"
          >
            <IoMdCloseCircleOutline />
          </button>
        </div>

        <div>
          <Link
            to={"/contact"}
            className="text-stone-500 font-semibold hover:text-[#d6482b] hover:transition-all hover:duration-150"
          >
            Contact Us
          </Link>
          <p className="text-stone-500">&copy; Easybid, LLC.</p>
          <p className="text-stone-500">
            Designed by{" "}
            <Link
              to={"/"}
              className="font-semibold hover:text-[#d6482b] hover:transition-all hover:duration-150"
            >
              Amar Asfaw
            </Link>
          </p>
        </div>
      </nav>
    </>
  );
};

export default SideDrawer;
