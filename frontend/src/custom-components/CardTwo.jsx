import PropTypes from "prop-types";
import { useNow } from "@/hooks/useNow";
import { countdown } from "@/lib/auctions";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { deleteAuction, republishAuction } from "@/store/slices/auctionSlice";

const CardTwo = ({ imgSrc, title, startingBid, startTime, endTime, id }) => {
  const now = useNow();
  const timeLeft = countdown(startTime, endTime, now);

  const formatTimeLeft = ({ days, hours, minutes, seconds }) => {
    const pad = (num) => String(num).padStart(2, "0");
    return `(${days} Days) ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const dispatch = useDispatch();
  const handleDeleteAuction = () => {
    dispatch(deleteAuction(id));
  };

  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <>
      <div className="basis-full bg-white rounded-md border border-stone-200 shadow-xs hover:shadow-md transition-shadow group sm:basis-56 lg:basis-60 2xl:basis-80">
        <img
          onError={(event) => {
            if (!event.currentTarget.src.endsWith("/item-placeholder.svg"))
              event.currentTarget.src = "/item-placeholder.svg";
          }}
          src={imgSrc}
          alt={title}
          loading="lazy"
          className="w-full aspect-[4/3] object-contain bg-stone-50 p-6"
        />
        <div className="px-2 pt-4 pb-2">
          <h5 className="font-semibold text-[18px] group-hover:text-[#d6482b] mb-2">
            {title}
          </h5>
          {startingBid && (
            <p className="text-stone-600 font-light">
              Starting Bid:{" "}
              <span className="text-[#fdba88] font-bold ml-1">
                {startingBid}
              </span>
            </p>
          )}
          <p className="text-stone-600 font-light">
            {timeLeft.type}
            {Object.keys(timeLeft).length > 1 ? (
              <span className="text-[#fdba88] font-bold ml-1">
                {formatTimeLeft(timeLeft)}
              </span>
            ) : (
              <span className="text-[#fdba88] font-bold ml-1">
                Time&apos;s up!
              </span>
            )}
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <Link
              className="bg-stone-700 text-center text-white text-xl px-4 py-2 rounded-md transition-all duration-300 hover:bg-black"
              to={`/auction/details/${id}`}
            >
              View Auction
            </Link>
            <button
              className="bg-red-400 text-center text-white text-xl px-4 py-2 rounded-md transition-all duration-300 hover:bg-red-600"
              onClick={handleDeleteAuction}
            >
              Delete Auction
            </button>
            <button
              disabled={new Date(endTime) > Date.now()}
              onClick={() => setOpenDrawer(true)}
              className="bg-sky-400 text-center text-white text-xl px-4 py-2 rounded-md transition-all duration-300 hover:bg-sky-700"
            >
              Republish Auction
            </button>
          </div>
        </div>
      </div>
      {openDrawer && (
        <Drawer id={id} openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />
      )}
    </>
  );
};

CardTwo.propTypes = {
  imgSrc: PropTypes.string,
  title: PropTypes.string,
  startingBid: PropTypes.number,
  startTime: PropTypes.string,
  endTime: PropTypes.string,
  id: PropTypes.string,
};

export default CardTwo;

const Drawer = ({ setOpenDrawer, id }) => {
  const dispatch = useDispatch();
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const { loading } = useSelector((state) => state.auction);
  const handleRepbulishAuction = () => {
    const formData = new FormData();
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    dispatch(republishAuction(id, formData));
  };

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Republish auction"
      className="fixed inset-0 z-[60] w-full h-full bg-[#00000087] flex items-end"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpenDrawer(false);
      }}
    >
      <div className="bg-white h-fit transition-all duration-300 w-full">
        <div className="w-full px-5 py-8 sm:max-w-[640px] sm:m-auto">
          <h3 className="text-[#D6482B]  text-3xl font-semibold text-center mb-1">
            Republish Auction
          </h3>
          <p className="text-stone-600">
            Let&apos;s republish auction with same details but new starting and
            ending time.
          </p>
          <form className="flex flex-col gap-5 my-5">
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">
                Republish Auction Start Time
              </label>
              <DatePicker
                selected={startTime}
                onChange={(date) => setStartTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={"MMMM d, yyyy h,mm aa"}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden w-full"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">
                Republish Auction End Time
              </label>
              <DatePicker
                selected={endTime}
                onChange={(date) => setEndTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={"MMMM d, yyyy h,mm aa"}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden w-full"
              />
            </div>
            <div>
              <button
                type="button"
                className="bg-blue-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-blue-700"
                onClick={handleRepbulishAuction}
              >
                {loading ? "Republishing" : "Republish"}
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
  );
};

Drawer.propTypes = {
  setOpenDrawer: PropTypes.func.isRequired,
  id: PropTypes.string,
};
