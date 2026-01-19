import React, { useEffect, useState } from "react";
import "./Banner.css";

import { fetchBanners } from "../../api/catalog";

const AdBannerSection = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchBanners({ position: "home_ad_grid" });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setItems([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container banner-section">
      <div className="banner-container">
        {items.map((item) => (
          <div className="banner-card" key={item.id}>
            <img src={item.imageUrl} alt={`banner-${item.id}`} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdBannerSection;
