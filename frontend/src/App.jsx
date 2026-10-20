import Spinner from "./custom-components/Spinner";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideDrawer from "./layout/SideDrawer";
const Home = lazy(() => import("./pages/Home"));
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/Login"));
const SubmitCommission = lazy(() => import("./pages/SubmitCommission"));
import { useDispatch } from "react-redux";
import { fetchLeaderboard, fetchUser } from "./store/slices/userSlice";
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
import { getAllAuctionItems } from "./store/slices/auctionSlice";
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionItem = lazy(() => import("./pages/AuctionItem"));
const CreateAuction = lazy(() => import("./pages/CreateAuction"));
const ViewMyAuctions = lazy(() => import("./pages/ViewMyAuctions"));
const ViewAuctionDetails = lazy(() => import("./pages/ViewAuctionDetails"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const PasswordRecovery = lazy(() => import("./pages/PasswordRecovery"));
import ProtectedRoute from "./custom-components/ProtectedRoute";
const UserProfile = lazy(() => import("./pages/UserProfile"));

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchUser());
    dispatch(getAllAuctionItems());
    dispatch(fetchLeaderboard());
  }, [dispatch]);
  return (
    <Router>
      <SideDrawer />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />
          <Route path="/reset-password/:token" element={<PasswordRecovery />} />
          <Route
            path="/submit-commission"
            element={
              <ProtectedRoute role="Auctioneer">
                <SubmitCommission />
              </ProtectedRoute>
            }
          />
          <Route path="/how-it-works-info" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auction/item/:id" element={<AuctionItem />} />
          <Route
            path="/create-auction"
            element={
              <ProtectedRoute role="Auctioneer">
                <CreateAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-my-auctions"
            element={
              <ProtectedRoute role="Auctioneer">
                <ViewMyAuctions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auction/details/:id"
            element={
              <ProtectedRoute role="Auctioneer">
                <ViewAuctionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="Super Admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <section className="pt-24 px-5 lg:pl-[320px]">
                <h1 className="text-3xl font-bold">Page not found</h1>
                <a href="/" className="text-[#d6482b] underline">
                  Back to EasyBid
                </a>
              </section>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" />
    </Router>
  );
};

export default App;
