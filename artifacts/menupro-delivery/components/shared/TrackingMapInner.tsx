"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TrackingDriver } from "@/types/api";

// Fix default leaflet icon paths
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = L.divIcon({
  html: `<div style="font-size:28px;line-height:1">🛵</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = L.divIcon({
  html: `<div style="font-size:28px;line-height:1">📍</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface Props {
  deliveryLat?: number;
  deliveryLng?: number;
  driver: TrackingDriver | null;
}

export default function TrackingMapInner({ deliveryLat, deliveryLng, driver }: Props) {
  const centerLat = driver?.latitude ?? deliveryLat ?? 5.3542;
  const centerLng = driver?.longitude ?? deliveryLng ?? -3.9827;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {driver && (
        <>
          <FlyTo lat={driver.latitude} lng={driver.longitude} />
          <Marker position={[driver.latitude, driver.longitude]} icon={driverIcon}>
            <Popup>{driver.name}</Popup>
          </Marker>
        </>
      )}

      {deliveryLat && deliveryLng && (
        <Marker position={[deliveryLat, deliveryLng]} icon={destinationIcon}>
          <Popup>Adresse de livraison</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
