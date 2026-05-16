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

// Leaflet loaded from CDN — no npm package needed, works in Docker without rebuild
const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_ICON_BASE = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images`;

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

const PLACE_EMOJI: Record<string, string> = {
  masjid:  "🕌",
  surau:   "🏘️",
  musolla: "🏠",
};

function loadLeaflet(): Promise<typeof import("leaflet")> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }

    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // JS
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const TYPE_CHIPS = [
  { key: "all" as const,     label: "Semua",   emoji: "🗺️" },
  { key: "masjid" as const,  label: "Masjid",  emoji: "🕌" },
  { key: "surau" as const,   label: "Surau",   emoji: "🏘️" },
  { key: "musolla" as const, label: "Musolla", emoji: "🏠" },
] as const;

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import("leaflet").Map | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
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

  // Load Leaflet from CDN once
  useEffect(() => {
    loadLeaflet().then(() => setLeafletReady(true)).catch(console.error);
  }, []);

  // Initialise map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMap.current) return;
    const L = window.L;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: `${LEAFLET_ICON_BASE}/marker-icon-2x.png`,
      iconUrl:       `${LEAFLET_ICON_BASE}/marker-icon.png`,
      shadowUrl:     `${LEAFLET_ICON_BASE}/marker-shadow.png`,
    });

    const map = L.map(mapRef.current, {
      center: [3.147, 101.693], // KL default
      zoom: 12,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, [leafletReady]);

  // Add/update markers when masjids change
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !leafletReady) return;
    const L = window.L;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    masjids.forEach((m) => {
      if (!m.latitude || !m.longitude) return;

      const emoji = PLACE_EMOJI[m.type ?? "masjid"] ?? "🕌";
      const icon = L.divIcon({
        html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))">${emoji}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        className: "",
      });

      const marker = L.marker([m.latitude, m.longitude], { icon });
      marker.on("click", () => setSelected(m));
      marker.addTo(map);
    });
  }, [masjids, leafletReady]);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setLocating(false);
        leafletMap.current?.setView([lat, lng], 15);

        if (leafletReady) {
          const L = window.L;
          L.circleMarker([lat, lng], { radius: 8, color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.8 })
            .addTo(leafletMap.current!)
            .bindPopup("Lokasi anda")
            .openPopup();
        }
      },
      () => setLocating(false)
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col">
        {/* Controls */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold">Peta Tempat Solat</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? "Memuatkan..." : `${masjids.length} tempat solat ditunjukkan`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setTypeFilter(c.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                    typeFilter === c.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
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
                {locating
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <LocateFixed className="h-3.5 w-3.5" />}
                Lokasi Saya
              </Button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[65vh]">
          <div ref={mapRef} className="absolute inset-0 z-0" />

          {(!leafletReady || isLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Selected popup */}
          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-sm">
              <div className="rounded-2xl border bg-card shadow-xl p-4">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-3 text-xl text-muted-foreground hover:text-foreground leading-none"
                >
                  ×
                </button>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{PLACE_EMOJI[selected.type ?? "masjid"]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm leading-tight">
                      {toTitleCase(selected.name)}
                    </p>
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
