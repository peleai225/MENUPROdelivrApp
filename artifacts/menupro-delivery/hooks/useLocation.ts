"use client";

import { useState, useEffect } from "react";

const ABIDJAN = { lat: 5.3542, lng: -3.9827 };

export function useLocation() {
  const [coords, setCoords] = useState(ABIDJAN);
  const [hasGps, setHasGps] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setHasGps(true);
      },
      () => {
        // Silent fallback to Abidjan
      }
    );
  }, []);

  return { coords, hasGps };
}
