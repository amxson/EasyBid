import PropTypes from "prop-types";
import { useNow } from "@/hooks/useNow";
import { countdown } from "@/lib/auctions";
import { Link } from "react-router-dom";

const Card = ({ imgSrc, title, startingBid, startTime, endTime, id }) => {
  const now = useNow();
  const timeLeft = countdown(startTime, endTime, now);

  const formatTimeLeft = ({ days, hours, minutes, seconds }) => {
    const pad = (num) => String(num).padStart(2, "0");
    return `(${days} Days) ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <>
      <Link
        to={`/auction/item/${id}`}
        className="grow basis-full bg-white rounded-md border border-stone-200 shadow-xs hover:shadow-md transition-shadow group sm:basis-56 lg:basis-60 2xl:basis-80"
      >
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
                {new Intl.NumberFormat("en-US").format(startingBid)}
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
        </div>
      </Link>
    </>
  );
};

Card.propTypes = {
  imgSrc: PropTypes.string,
  title: PropTypes.string,
  startingBid: PropTypes.number,
  startTime: PropTypes.string,
  endTime: PropTypes.string,
  id: PropTypes.string,
};

export default Card;
