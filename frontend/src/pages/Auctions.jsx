import Card from "@/custom-components/Card";
import Spinner from "@/custom-components/Spinner";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { filterAuctions } from "@/lib/auctions";
import { useNow } from "@/hooks/useNow";

export default function Auctions() {
  const { allAuctions, loading } = useSelector((state) => state.auction);
  const [params, setParams] = useSearchParams();
  const now = useNow();
  const filters = {
    query: params.get("q") || "",
    status: params.get("status") || "all",
    category: params.get("category") || "all",
    sort: params.get("sort") || "ending",
  };
  const items = filterAuctions(allAuctions, filters, now);
  const categories = [
    ...new Set(allAuctions.map((item) => item.category).filter(Boolean)),
  ].sort();
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <article className="w-full px-5 pt-20 lg:pl-[320px] flex flex-col">
      <section className="my-8">
        <h1 className="text-[#d6482b] text-4xl md:text-6xl font-bold mb-6">
          Auctions
        </h1>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5 bg-white border border-stone-200 rounded-md p-4">
          <label className="text-sm text-stone-600">
            Search
            <input
              type="search"
              value={filters.query}
              onChange={(e) => update("q", e.target.value)}
              placeholder="Find an item"
              className="block mt-1 w-full border border-stone-300 rounded-md p-2"
            />
          </label>
          <label className="text-sm text-stone-600">
            Status
            <select
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
              className="block mt-1 w-full border border-stone-300 rounded-md p-2"
            >
              <option value="all">All auctions</option>
              <option value="live">Live now</option>
              <option value="upcoming">Upcoming</option>
              <option value="ended">Ended</option>
            </select>
          </label>
          <label className="text-sm text-stone-600">
            Category
            <select
              value={filters.category}
              onChange={(e) => update("category", e.target.value)}
              className="block mt-1 w-full border border-stone-300 rounded-md p-2"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-stone-600">
            Sort
            <select
              value={filters.sort}
              onChange={(e) => update("sort", e.target.value)}
              className="block mt-1 w-full border border-stone-300 rounded-md p-2"
            >
              <option value="ending">Ending soon</option>
              <option value="price">Lowest price</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-stone-500 mb-4" role="status">
          {items.length} {items.length === 1 ? "auction" : "auctions"}
        </p>
        {loading ? (
          <Spinner />
        ) : items.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card
                title={item.title}
                startTime={item.startTime}
                endTime={item.endTime}
                imgSrc={item.image?.url}
                startingBid={item.startingBid}
                id={item._id}
                key={item._id}
              />
            ))}
          </div>
        ) : (
          <div className="border border-stone-200 bg-white rounded-md p-8 text-center">
            <p className="text-stone-600">No auctions match these filters.</p>
            <button
              className="mt-3 text-[#d6482b] underline"
              onClick={() => setParams({})}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </article>
  );
}
