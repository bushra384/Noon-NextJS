"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://127.0.0.1:3001";
const mockData = [ /* keep your mockData array here as is */ ];

// (Keep extractProductKeywords function here as is)

export default function Home() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [allFoodItems, setAllFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [dataFullyLoaded, setDataFullyLoaded] = useState(false);

  const fetchAllFoodItems = async () => {
    setLoading(true);
    setError(null);
    setDataFullyLoaded(false);
    setAllFoodItems([]);
    try {
      const response = await fetch(`/api/search`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseText = await response.text();
      if (responseText.trim().startsWith("<!DOCTYPE html>")) {
        setAllFoodItems(mockData);
        setUsingMockData(true);
        setDataFullyLoaded(true);
        return;
      }
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid JSON response.");
      }
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === "object") {
        const dataArray = Object.values(data).find((val) => Array.isArray(val));
        if (dataArray) {
          items = dataArray;
        } else {
          items = [data];
        }
      }
      if (items && items.length > 0) {
        setAllFoodItems(items);
        setUsingMockData(false);
        setDataFullyLoaded(true);
      } else {
        throw new Error("No valid items found in API response");
      }
    } catch (err) {
      setAllFoodItems(mockData);
      setUsingMockData(true);
      setDataFullyLoaded(true);
      setError(`API server not available. Using demo data. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFoodItems();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allFoodItems;
    }
    const searchLower = searchTerm.toLowerCase();
    return allFoodItems.filter((item) => {
      const name = (item.name || item.origin || "").toLowerCase();
      const size = (item.size || "").toLowerCase();
      return name.includes(searchLower) || size.includes(searchLower);
    });
  }, [searchTerm, allFoodItems]);

  return (
    <div className="container">
      <header className="header">
        <h1>🍽️ Food Search</h1>
        <p>Search through all available food items!</p>
        {usingMockData && (
          <p style={{ fontSize: "0.9rem", opacity: 0.8, marginTop: "10px" }}>
            ⚠️ Demo mode: Using sample data. Start your API server to see real
            data.
          </p>
        )}
      </header>
      <div className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            disabled={!dataFullyLoaded}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      <div className="results-info">
        {error && !usingMockData ? (
          <p className="error-message">❌ {error}</p>
        ) : dataFullyLoaded ? (
          <p>
            Showing {filteredItems.length} of {allFoodItems.length} items
          </p>
        ) : (
          ""
        )}
      </div>
      <div className="food-grid">
        {loading || !dataFullyLoaded ? (
          <div className="main-loader">
            <div className="main-loader-spinner"></div>
            <p>Loading all food items...</p>
          </div>
        ) : error && !usingMockData ? (
          <div className="no-results">
            <p>😕 {error}</p>
            <p>Please check if your API server is running on localhost:5000</p>
            <p>Check the browser console (F12) for more details</p>
            <button onClick={fetchAllFoodItems} className="retry-btn">
              Retry
            </button>
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) =>
            item.product_id ? (
              <div
                key={item.product_id}
                className="food-card"
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/product/${item.product_id}`)}
              >
                <div className="food-image">
                  <img
                    src={item.image_url}
                    alt={item.name || item.origin || "Food Item"}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div className="food-emoji-fallback" style={{ display: "none" }}>
                    🍽️
                  </div>
                </div>
                <h3 className="food-name">{item.name || item.origin}</h3>
                <p className="food-size">{item.size}</p>
                <div className="price-section">
                  {item.original_price && (
                    <span className="original-price">${item.original_price}</span>
                  )}
                  <span className="current-price">${item.price}</span>
                </div>
                <button className="order-btn">Add to Cart</button>
              </div>
            ) : (
              <div key={Math.random()} className="food-card" style={{ opacity: 0.5 }}>
                <div className="food-emoji-fallback">⚠️</div>
                <h3 className="food-name">Missing product_id</h3>
                <p style={{ color: "red", fontSize: "0.9rem" }}>
                  This product cannot be viewed in detail.
                </p>
              </div>
            )
          )
        ) : searchTerm ? (
          <div className="no-results">
            <p>😕 No food items found matching "{searchTerm}".</p>
            <p>Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="no-results">
            <p>📦 No food items available.</p>
            <p>Please check your API connection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
