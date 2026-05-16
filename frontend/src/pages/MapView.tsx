import { useState, useEffect, useRef } from "react";
import { Loader2, MapPin, LocateFixed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { masjidsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";
import type { Masjid } from "@/types";

const PLACE_EMOJI: Record<string, string> = {
  masjid: "🕌",
  surau: "🏘️",
  musolla: "🏠",
};

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import("leaflet").Map | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<Masjid | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "masjid" | "surau" | "musolla">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["masjids", "map", typeFilter],
    queryFn: () => masjidsApi.list({
      page_size: 200,
      type: typeFilter === "all" ? undefined : typeFilter,
    }),
  });

  const masjids: Masjid[] = (data?.items ?? []) as Masjid[];

  // Initialise Leaflet map once
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    let L: typeof import("leaflet");

    import("leaflet").then((mod) => {
      L = mod.default;

      // Fix default icon path (Vite build strips asset path)
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [3.147, 101.693], // KL as default
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // Add/update markers when masjids or filter changes
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    import("leaflet").then((mod) => {
      const L = mod.default;

      // Remove existing layers (markers only)
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      masjids.forEach((m) => {
        const raw = m as unknown as { latitude?: number; longitude?: number };
        if (!raw.latitude || !raw.longitude) return;

        const emoji = PLACE_EMOJI[m.type ?? "masjid"] ?? "🕌";
        const icon = L.divIcon({
          html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: "",
        });

        const marker = L.marker([raw.latitude, raw.longitude], { icon });
        marker.on("click", () => setSelected(m));
        marker.addTo(map);
      });
    });
  }, [masjids]);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        leafletMap.current?.setView([lat, lng], 15);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const TYPE_CHIPS = [
    { key: "all" as const, label: "Semua", emoji: "🗺️" },
    { key: "masjid" as const, label: "Masjid", emoji: "🕌" },
    { key: "surau" as const, label: "Surau", emoji: "🏘️" },
    { key: "musolla" as const, label: "Musolla", emoji: "🏠" },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col">
        {/* Controls bar */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold">Peta Tempat Solat</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? "Memuatkan..." : `${masjids.length} tempat ditunjukkan`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setTypeFilter(c.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                    typeFilter === c.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={locateMe}
                disabled={locating}
                className="rounded-xl gap-1.5 text-xs"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                Lokasi Saya
              </Button>
            </div>
          </div>
        </div>

        {/* Map container */}
        <div className="relative flex-1 min-h-[60vh]">
          {/* Leaflet CSS */}
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

          <div ref={mapRef} className="absolute inset-0 z-0" />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Selected masjid popup */}
          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-sm">
              <div className="rounded-2xl border bg-card shadow-xl p-4">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-3 text-muted-foreground hover:text-foreground text-lg"
                >
                  ×
                </button>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{PLACE_EMOJI[selected.type ?? "masjid"]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm leading-tight">{toTitleCase(selected.name)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{selected.address ?? "Alamat tidak dinyatakan"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selected.verification_count} pengesahan
                      {selected.status === "verified" && " · ✅ Disahkan"}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/masjid/${selected.slug ?? selected.id}`}
                  className="mt-3 block w-full rounded-xl bg-primary text-primary-foreground text-center text-sm font-semibold py-2.5 hover:bg-primary/90 transition-colors"
                >
                  Lihat Profil Penuh
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MapView;
