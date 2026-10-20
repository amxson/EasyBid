import BidHelp from "@/custom-components/BidHelp";
import { useNow } from "@/hooks/useNow";
import Spinner from "@/custom-components/Spinner";
import { getAuctionDetail } from "@/store/slices/auctionSlice";
import { placeBid } from "@/store/slices/bidSlice";
import { useEffect, useState } from "react";
import { FaGreaterThan } from "react-icons/fa";
import { RiAuctionFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";

const AuctionItem = () => {
  const { id } = useParams();
  const { loading, auctionDetail, auctionBidders, detailError } = useSelector(
    (state) => state.auction,
  );
  const { isAuthenticated, user } = useSelector((state) => state.user);

  const now = useNow();
  const bidding = useSelector((state) => state.bid.loading);
  const dispatch = useDispatch();

  const [amount, setAmount] = useState("");
  const handleBid = async (event) => {
    event.preventDefault();
    if (bidding) return;
    if (await dispatch(placeBid(id, { amount }))) setAmount("");
  };
  useEffect(() => {
    dispatch(getAuctionDetail(id));
    const timer = setInterval(
      () => dispatch(getAuctionDetail(id, { silent: true })),
      10000,
    );
    return () => clearInterval(timer);
  }, [dispatch, id]);
  if (detailError && !auctionDetail._id)
    return (
      <section className="px-5 pt-24 lg:pl-[320px]">
        <p role="alert">{detailError}</p>
        <Link to="/auctions" className="text-[#d6482b] underline">
          Back to auctions
        </Link>
      </section>
    );
  return (
    <>
      <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col">
        <div className="text-[16px] flex flex-wrap gap-2 items-center">
          <Link
            to="/"
            className="font-semibold transition-all duration-300 hover:text-[#D6482B]"
          >
            Home
          </Link>
          <FaGreaterThan className="text-stone-400" />
          <Link
            to={"/auctions"}
            className="font-semibold transition-all duration-300 hover:text-[#D6482B]"
          >
            Auctions
          </Link>
          <FaGreaterThan className="text-stone-400" />
          <p className="text-stone-600">{auctionDetail.title}</p>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex gap-4 flex-col lg:flex-row">
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-4 flex-col lg:flex-row">
                <div className="bg-white w-[100%] lg:w-40 lg:h-40 flex justify-center items-center p-5">
                  <img
                    onError={(event) => {
                      if (
                        !event.currentTarget.src.endsWith(
                          "/item-placeholder.svg",
                        )
                      )
                        event.currentTarget.src = "/item-placeholder.svg";
                    }}
                    src={auctionDetail.image?.url}
                    alt={auctionDetail.title}
                  />
                </div>
                <div className="flex flex-col justify-around pb-4">
                  <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
                    {auctionDetail.title}
                  </h3>
                  <p className="text-xl font-semibold">
                    Condition:{" "}
                    <span className="text-[#D6482B]">
                      {auctionDetail.condition}
                    </span>
                  </p>
                  <p className="text-xl font-semibold">
                    Minimum Bid:{" "}
                    <span className="text-[#D6482B]">
                      {new Intl.NumberFormat("en-US").format(
                        auctionDetail.startingBid,
                      )}{" "}
                      Birr
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-lg font-semibold">
                Current bid:{" "}
                <span className="text-[#d6482b]">
                  {Number(auctionDetail.currentBid || 0).toLocaleString()} Birr
                </span>
              </p>
              {detailError && (
                <p role="alert" className="text-sm text-[#b8381e]">
                  {detailError}
                </p>
              )}
              <p className="text-xl w-fit font-bold">
                Auction Item Description
              </p>
              <hr className="my-2 border-t-[1px] border-t-stone-700" />
              {auctionDetail.description &&
                auctionDetail.description.split(". ").map((element, index) => {
                  return (
                    <li key={index} className="text-[18px] my-2">
                      {element}
                    </li>
                  );
                })}
              {isAuthenticated && <BidHelp key={id} auctionId={id} />}
            </div>
            <div className="flex-1">
              <header className="bg-stone-200 py-4 text-[24px] font-semibold px-4">
                BIDS
              </header>
              <div className="bg-white px-4 min-h-fit lg:min-h-[650px]">
                {auctionBidders &&
                new Date(auctionDetail.startTime) < now &&
                new Date(auctionDetail.endTime) > now ? (
                  auctionBidders.length > 0 ? (
                    auctionBidders.map((element, index) => {
                      return (
                        <div
                          key={index}
                          className="py-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              onError={(event) => {
                                if (
                                  !event.currentTarget.src.endsWith(
                                    "/imageHolder.jpg",
                                  )
                                )
                                  event.currentTarget.src = "/imageHolder.jpg";
                              }}
                              src={element.profileImage}
                              alt={element.userName}
                              className="w-12 h-12 rounded-full my-2 hidden md:block"
                            />
                            <p className="text-[18px] font-semibold">
                              {element.userName}
                            </p>
                            <p className="flex-1 text-center">
                              {new Intl.NumberFormat("en-US").format(
                                element.amount,
                              )}
                            </p>
                          </div>
                          {index === 0 ? (
                            <p className="text-[20px] font-semibold text-green-600">
                              1st
                            </p>
                          ) : index === 1 ? (
                            <p className="text-[20px] font-semibold text-blue-600">
                              2nd
                            </p>
                          ) : index === 2 ? (
                            <p className="text-[20px] font-semibold text-yellow-600">
                              3rd
                            </p>
                          ) : (
                            <p className="text-[20px] font-semibold text-gray-600">
                              {index + 1}th
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No bids for this auction
                    </p>
                  )
                ) : now < new Date(auctionDetail.startTime) ? (
                  <img
                    onError={(event) => {
                      if (!event.currentTarget.src.endsWith("/imageHolder.jpg"))
                        event.currentTarget.src = "/imageHolder.jpg";
                    }}
                    src="/notStarted.png"
                    alt="not-started"
                    className="w-full max-h-[650px]"
                  />
                ) : (
                  <img
                    onError={(event) => {
                      if (!event.currentTarget.src.endsWith("/imageHolder.jpg"))
                        event.currentTarget.src = "/imageHolder.jpg";
                    }}
                    src="/auctionEnded.png"
                    alt="ended"
                    className="w-full max-h-[650px]"
                  />
                )}
              </div>

              <div className="bg-[#D6482B] py-4 text-[16px] md:text-[20px] font-semibold px-4">
                {now >= new Date(auctionDetail.startTime) &&
                now < new Date(auctionDetail.endTime) ? (
                  !isAuthenticated ? (
                    <Link to="/login" className="text-white underline">
                      Log in to place a bid
                    </Link>
                  ) : user.role !== "Bidder" ? (
                    <p className="text-white">
                      Bidding is available to bidder accounts.
                    </p>
                  ) : (
                    <form
                      onSubmit={handleBid}
                      className="flex items-end justify-between gap-3"
                    >
                      <div className="flex flex-col gap-2">
                        <label htmlFor="bid-amount" className="text-white">
                          Your bid in Birr
                        </label>
                        <input
                          id="bid-amount"
                          aria-label="Your bid in Birr"
                          type="number"
                          step="0.01"
                          min={Math.max(
                            auctionDetail.startingBid || 0.01,
                            Math.round(
                              ((auctionDetail.currentBid || 0) + 0.01) * 100,
                            ) / 100,
                          )}
                          required
                          className="w-36 bg-white border border-stone-300 rounded-md text-stone-900 p-2"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        aria-label={bidding ? "Placing bid" : "Place bid"}
                        disabled={bidding}
                        className="p-4 text-white bg-black rounded-full hover:bg-[#222]"
                      >
                        <RiAuctionFill />
                      </button>
                    </form>
                  )
                ) : (
                  <p className="text-white">
                    {new Date(auctionDetail.startTime) > now
                      ? "Auction has not started yet."
                      : "Auction has ended."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default AuctionItem;
