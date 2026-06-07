"use client";

import { useState } from "react";

type Product = {
  product_id?: string;
  name?: string;
  price?: string;
  image?: string;
};

export default function Page() {
  const [query, setQuery] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const searchProducts = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "search",
          payload: { query },
        }),
      });

      const data = await res.json();

      // MCP might return different shapes → safe fallback
      const items =
        data?.products ||
        data?.results ||
        data?.data ||
        [];

      setProducts(items);
    } catch (err) {
      console.error("Search failed:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 text-black">
      {/* HEADER */}
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">
          🛍️ AI Shopping Agent
        </h1>
        <p className="text-black mt-1">
          Search Kapruka products using MCP
        </p>

        {/* SEARCH BOX */}
        <div className="flex gap-2 mt-5">
          <input
            className="border rounded px-3 py-2 w-full text-black placeholder-gray-400"
            placeholder="Search for gifts, electronics, flowers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button
            onClick={searchProducts}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* QUICK SUGGESTIONS (IMPORTANT FOR UX) */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {["gift", "cake", "watch", "flowers", "chocolate"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setQuery(item);
              }}
              className="text-sm border px-3 py-1 rounded-full hover:bg-gray-100 text-black"
            >
              {item}
            </button>
          ))}
        </div>

        {/* RESULTS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {products.map((p, i) => (
            <div
              key={i}
              className="border rounded-lg p-3 hover:shadow-md transition"
            >
              {/* IMAGE */}
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name || "Product"}
                  className="h-32 w-full object-cover rounded"
                />
              ) : (
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-black">
                  No Image
                </div>
              )}

              {/* NAME */}
              <h3 className="font-semibold mt-2 text-sm text-black">
                {p.name || "Unnamed Product"}
              </h3>

              {/* PRICE */}
              {p.price && (
                <p className="text-black text-sm mt-1 font-semibold">
                  {p.price}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {!loading && products.length === 0 && (
          <div className="text-center text-black mt-10">
            Search something to see products
          </div>
        )}
      </div>
    </div>
  );
}