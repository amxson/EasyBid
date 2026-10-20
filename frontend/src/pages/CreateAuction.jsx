import { createAuction } from "@/store/slices/auctionSlice";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { IMAGE_ACCEPT, IMAGE_HELP, auctionError } from "@/lib/forms";

const CreateAuction = () => {
  const photo = useImageUpload();
  const form = useFormSubmission();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const auctionCategories = [
    "Electronics",
    "Furniture",
    "Art & Antiques",
    "Jewelry & Watches",
    "Automobiles",
    "Real Estate",
    "Collectibles",
    "Fashion & Accessories",
    "Sports Memorabilia",
    "Books & Manuscripts",
  ];

  const dispatch = useDispatch();

  const handleCreateAuction = (e) => {
    e.preventDefault();
    if (form.submitting || photo.checking) return;
    const problem = auctionError({ title, description, category, condition, startingBid, startTime, endTime }, photo.file);
    if (problem) { form.setError(problem); return; }
    const formData = new FormData();
    formData.append("image", photo.file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("condition", condition);
    formData.append("startingBid", startingBid);
    formData.append("startTime", startTime.toISOString());
    formData.append("endTime", endTime.toISOString());
    form.submit(() => dispatch(createAuction(formData)));
  };

  const { isAuthenticated, user } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  useEffect(() => {
    if (!isAuthenticated || user.role !== "Auctioneer") {
      navigateTo("/");
    }
  }, [isAuthenticated, navigateTo, user.role]);

  return (
    <article className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col">
      <h1
        className={`text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
      >
        Create Auction
      </h1>
      <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
        <form
          className="flex flex-col gap-5 w-full"
          onSubmit={handleCreateAuction}
          onInvalid={() => form.setError("Complete the required auction fields with valid information.")}
          aria-busy={form.submitting}
        >
          <p className="font-semibold text-xl md:text-2xl">Auction Detail</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-title" className="text-[16px] text-stone-600">Title</label>
              <input
                id="auction-title" required maxLength={150}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              />
            </div>
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-category" className="text-[16px] text-stone-600">Category</label>
              <select
                id="auction-category" required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              >
                <option value="">Select Category</option>
                {auctionCategories.map((element) => {
                  return (
                    <option key={element} value={element}>
                      {element}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-condition" className="text-[16px] text-stone-600">Condition</label>
              <select
                id="auction-condition" required
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              >
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-price" className="text-[16px] text-stone-600">Starting Bid</label>
              <input
                id="auction-price" required min="0.01" step="0.01"
                type="number"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-description" className="text-[16px] text-stone-600">Description</label>
              <textarea
                id="auction-description" required maxLength={10000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-2 border-stone-500 focus:outline-hidden px-2 rounded-md"
                rows={10}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-start" className="text-[16px] text-stone-600">
                Auction Starting Time
              </label>
              <DatePicker
                id="auction-start" required minDate={new Date()}
                selected={startTime}
                onChange={(date) => setStartTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={"MMMM d, yyyy h:mm aa"}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="auction-end" className="text-[16px] text-stone-600">
                Auction End Time
              </label>
              <DatePicker
                id="auction-end" required minDate={startTime || new Date()}
                selected={endTime}
                onChange={(date) => setEndTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat={"MMMM d, yyyy h:mm aa"}
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-hidden w-full"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <label className="font-semibold text-xl md:text-2xl">
              Auction Item Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {photo.preview ? (
                    <img
                      src={photo.preview}
                      alt={title}
                      className="w-44 h-auto"
                    />
                  ) : (
                    <>
                      <svg
                        className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                    </>
                  )}

                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to choose an image</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {IMAGE_HELP}
                  </p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  accept={IMAGE_ACCEPT}
                  aria-label="Auction item image"
                  aria-required="true"
                  className="hidden"
                  onChange={photo.onChange}
                />
              </label>
            </div>
          </div>
          {photo.error && <p role="alert" className="text-[#b8381e]">{photo.error}</p>}
          {form.error && <p role="alert" className="text-[#b8381e]">{form.error}</p>}
          {form.message && <p role="status" className="text-stone-700">{form.message}</p>}
          <button type="submit" disabled={form.submitting || photo.checking} className="bg-[#D6482B] font-semibold hover:bg-[#b8381e] text-xl transition-all duration-300 py-2 px-4 rounded-md text-white w-full max-w-[640px] mx-auto my-4 disabled:opacity-60">
            {photo.checking ? "Checking image..." : form.submitting ? "Creating Auction..." : "Create Auction"}
          </button>
        </form>
      </div>
    </article>
  );
};

export default CreateAuction;
