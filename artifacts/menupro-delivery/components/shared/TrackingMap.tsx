"use client";

import dynamic from "next/dynamic";
import type { TrackingDriver } from "@/types/api";

const MapInner = dynamic(() => import("./TrackingMapInner"), { ssr: false });

interface Props {
  deliveryLat?: number;
  deliveryLng?: number;
  driver: TrackingDriver | null;
}

export function TrackingMap(props: Props) {
  return (
    <div className="w-full h-full">
      <MapInner {...props} />
    </div>
  );
}
