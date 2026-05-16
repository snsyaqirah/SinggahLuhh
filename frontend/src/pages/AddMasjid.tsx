import { useState, useRef } from "react";
import { MapPin, ArrowLeft, LocateFixed, Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { masjidsApi, facilitiesApi, ApiError } from "@/lib/api";
import { MALAYSIA_STATES } from "@/lib/constants";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

const AddMasjid = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<NominatimResult[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePlaceSearch = (query: string) => {
    setPlaceQuery(query);
    setShowDropdown(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) { setPlaceResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingPlace(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=my&addressdetails=1`,
          { headers: { "Accept-Language": "ms,en" } }
        );
        const data: NominatimResult[] = await res.json();
        setPlaceResults(data);
      } catch { /* silent */ } finally {
        setSearchingPlace(false);
      }
    }, 400);
  };

  const selectPlace = (place: NominatimResult) => {
    setForm((f) => ({
      ...f,
      latitude: parseFloat(place.lat).toFixed(6),
      longitude: parseFloat(place.lon).toFixed(6),
      address: f.address || place.display_name,
      name: f.name || (place.name ?? ""),
    }));
    setPlaceQuery(place.display_name);
    setPlaceResults([]);
    setShowDropdown(false);
  };
  const [placeType, setPlaceType] = useState<"masjid" | "surau" | "musolla">("masjid");

  const PLACE_TYPE_CONFIG = {
    masjid:  { label: "Masjid",  emoji: "🕌", desc: "Ada solat Jumaat" },
    surau:   { label: "Surau",   emoji: "🏘️", desc: "Surau kawasan / taman" },
    musolla: { label: "Musolla", emoji: "🏠", desc: "Ruang solat kecil" },
  } as const;

  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    latitude: "",
    longitude: "",
    // Solat & Ibadah
    hasTerawih: false,
    terawihRakaat: "",
    has_tahfiz: false,
    // Iftar
    hasIftar: false,
    iftar_type: "",
    iftarInfo: "",
    // Keselesaan
    cooling_system: "Kipas Biasa",
    karpet_vibe: "",
    // Ciri Malaysia
    hasCoway: false,
    kucing_count: "Tidak Pasti",
    talam_gang: false,
    // Parkir
    parking_level: "",
    hasOKUAccess: false,
    has_parking_moto: true,
    // Kemudahan Wanita
    has_clean_telekung: false,
    telekung_rating: "",
    // Tandas & Wudhu
    wudhu_seating: false,
    toilet_cleanliness: "",
    toilet_floor_condition: "",
    // Keluarga & Lain-lain
    hasKidsArea: false,
    is_tourist_friendly: false,
    has_library: false,
    // Pengangkutan Awam
    near_bas: false,
    near_lrt: false,
    near_mrt: false,
  });

  if (!user) return <Navigate to="/auth" replace />;

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS tidak disokong", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        toast({ title: "Lokasi dikesan!", description: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
      },
      () => {
        toast({ title: "Gagal kesan GPS", description: "Sila benarkan akses GPS atau isi koordinat manual.", variant: "destructive" });
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast({ title: "Koordinat diperlukan", description: "Gunakan butang GPS atau isi koordinat.", variant: "destructive" });
      return;
    }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Koordinat tidak sah", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Check for nearby duplicates first
      const nearby = await masjidsApi.checkNearby(lat, lng, 100) as Array<{ id: string; name: string }>;
      if (nearby.length > 0) {
        toast({
          title: `${PLACE_TYPE_CONFIG[placeType].label} mungkin sudah wujud`,
          description: `"${nearby[0].name}" ditemui dalam radius 100m. Sila semak dahulu.`,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const result = await masjidsApi.create({
        name: form.name,
        address: form.address,
        description: form.description || undefined,
        latitude: lat,
        longitude: lng,
        type: placeType,
      }) as { id: string };

      // Save facilities data if any checkboxes were selected
      const hasFacilityData = form.hasTerawih || form.hasIftar || form.hasOKUAccess ||
        form.hasKidsArea || form.hasCoway || form.cooling_system !== "Kipas Biasa" ||
        !!form.karpet_vibe || !!form.parking_level || form.has_clean_telekung ||
        form.wudhu_seating || !!form.toilet_cleanliness || form.has_tahfiz || form.has_library;
      if (hasFacilityData) {
        try {
          const facilitiesPayload: Record<string, unknown> = {
            has_iftar: form.hasIftar,
            has_parking_oku: form.hasOKUAccess,
            has_parking_moto: form.has_parking_moto,
            has_kids_area: form.hasKidsArea,
            has_coway: form.hasCoway,
            is_family_friendly: true,
            cooling_system: form.cooling_system || "Kipas Biasa",
            kucing_count: form.kucing_count || "Tidak Pasti",
            talam_gang: form.talam_gang,
            has_clean_telekung: form.has_clean_telekung,
            wudhu_seating: form.wudhu_seating,
            is_tourist_friendly: form.is_tourist_friendly,
            has_tahfiz: form.has_tahfiz,
            has_library: form.has_library,
            near_bas: form.near_bas,
            near_lrt: form.near_lrt,
            near_mrt: form.near_mrt,
          };
          if (form.hasTerawih && form.terawihRakaat) {
            facilitiesPayload.terawih_rakaat = parseInt(form.terawihRakaat);
          }
          if (form.hasIftar && form.iftarInfo) {
            facilitiesPayload.iftar_menu = form.iftarInfo;
          }
          if (form.hasIftar && form.iftar_type) {
            facilitiesPayload.iftar_type = form.iftar_type;
          }
          if (form.karpet_vibe) facilitiesPayload.karpet_vibe = form.karpet_vibe;
          if (form.parking_level) facilitiesPayload.parking_level = form.parking_level;
          if (form.has_clean_telekung && form.telekung_rating) {
            facilitiesPayload.telekung_rating = form.telekung_rating;
          }
          if (form.toilet_cleanliness) facilitiesPayload.toilet_cleanliness = form.toilet_cleanliness;
          if (form.toilet_floor_condition) facilitiesPayload.toilet_floor_condition = form.toilet_floor_condition;
          await facilitiesApi.create(result.id, facilitiesPayload);
        } catch {
          // Non-critical: masjid is already saved, facilities can be added later
        }
      }

      toast({
        title: `${PLACE_TYPE_CONFIG[placeType].label} berjaya ditambah! ${PLACE_TYPE_CONFIG[placeType].emoji}`,
        description: `${form.name} kini boleh dilihat oleh komuniti. 3 pengesahan diperlukan.`,
      });
      navigate(`/masjid/${(result as { id: string; slug?: string }).slug ?? (result as { id: string }).id}`);
    } catch (err) {
      toast({
        title: `Gagal tambah ${PLACE_TYPE_CONFIG[placeType].label.toLowerCase()}`,
        description: err instanceof ApiError ? err.message : "Sila cuba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Tambah Tempat Solat
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kongsi info tempat solat ni dengan komuniti. Ia akan muncul terus dengan tag "Belum disahkan".
          </p>
        </div>

        {/* Place Type Selector */}
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">Jenis tempat solat</p>
          <div className="grid grid-cols-3 gap-3">
            {(["masjid", "surau", "musolla"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPlaceType(t)}
                className={`rounded-2xl border p-4 text-center transition-all ${
                  placeType === t
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-1">{PLACE_TYPE_CONFIG[t].emoji}</div>
                <div className="text-sm font-semibold">{PLACE_TYPE_CONFIG[t].label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{PLACE_TYPE_CONFIG[t].desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <h3 className="font-serif text-base font-semibold">Maklumat Asas</h3>
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">Nama {PLACE_TYPE_CONFIG[placeType].label} *</Label>
              <Input id="name" placeholder={`cth: ${PLACE_TYPE_CONFIG[placeType].label} Al-Ikhlas`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl bg-background" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-medium">Alamat Penuh *</Label>
              <Input id="address" placeholder="cth: No 1, Jalan Masjid, Taman Sri Muda, 40150 Shah Alam, Selangor" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl bg-background" required />
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Lokasi Masjid</Label>

              {/* Place search */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Cari nama masjid di sini..."
                    value={placeQuery}
                    onChange={(e) => handlePlaceSearch(e.target.value)}
                    onFocus={() => placeResults.length > 0 && setShowDropdown(true)}
                    className="rounded-xl bg-background pl-9 pr-9"
                    autoComplete="off"
                  />
                  {placeQuery && (
                    <button type="button" onClick={() => { setPlaceQuery(""); setPlaceResults([]); setShowDropdown(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showDropdown && (searchingPlace || placeResults.length > 0) && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border bg-card shadow-lg overflow-hidden">
                    {searchingPlace && (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Mencari...
                      </div>
                    )}
                    {!searchingPlace && placeResults.map((place) => (
                      <button key={place.place_id} type="button"
                        onClick={() => selectPlace(place)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors border-b last:border-0">
                        <p className="font-medium text-foreground line-clamp-1">{place.name || place.display_name.split(",")[0]}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{place.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">atau</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" className="w-full rounded-xl gap-2" onClick={detectLocation} disabled={locating}>
                <LocateFixed className="h-4 w-4" />
                {locating ? "Mengesan lokasi..." : "Gunakan GPS Semasa"}
              </Button>

              {(form.latitude || form.longitude) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lat" className="text-xs text-muted-foreground">Latitud</Label>
                    <Input id="lat" placeholder="3.139003" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="rounded-xl bg-background" />
                  </div>
                  <div>
                    <Label htmlFor="lng" className="text-xs text-muted-foreground">Longitud</Label>
                    <Input id="lng" placeholder="101.686855" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="rounded-xl bg-background" />
                  </div>
                </div>
              )}
              {form.latitude && form.longitude ? (
                <p className="text-xs text-emerald-600 font-medium">✓ Koordinat diisi: {form.latitude}, {form.longitude}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Koordinat diperlukan untuk ciri berdekatan & check-in</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium">Maklumat Tambahan</Label>
              <Textarea id="description" placeholder="cth: Masjid berhampiran pasar malam. Ada parkir luas..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-background min-h-[80px]" />
            </div>
          </div>

          {/* Facilities */}
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <h3 className="font-serif text-base font-semibold">Kemudahan (Opsyen)</h3>

            {/* Solat & Ibadah */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solat & Ibadah</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "hasTerawih", label: "Ada Terawih" },
                  { key: "has_tahfiz", label: "Ada Tahfiz" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors">
                    <Checkbox checked={form[item.key as keyof typeof form] as boolean} onCheckedChange={(c) => setForm({ ...form, [item.key]: !!c })} />
                    {item.label}
                  </label>
                ))}
              </div>
              {form.hasTerawih && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Terawih berapa rakaat?</Label>
                  <div className="flex flex-wrap gap-2">
                    {["8", "11", "20", "23"].map((r) => (
                      <button key={r} type="button" onClick={() => setForm({ ...form, terawihRakaat: form.terawihRakaat === r ? "" : r })}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${form.terawihRakaat === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        {r} rakaat
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Iftar */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Iftar</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors w-fit">
                <Checkbox checked={form.hasIftar} onCheckedChange={(c) => setForm({ ...form, hasIftar: !!c })} />
                Ada Program Iftar
              </label>
              {form.hasIftar && (
                <div className="space-y-3 pl-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Jenis Iftar</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Nasi Kotak", "Talam", "Buffet", "Bawa Sendiri", "Tidak Pasti"].map((t) => (
                        <button key={t} type="button" onClick={() => setForm({ ...form, iftar_type: form.iftar_type === t ? "" : t })}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.iftar_type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Info Menu Iftar (Opsyen)</Label>
                    <Input placeholder="cth: Nasi Beriyani + Air Sirap" value={form.iftarInfo} onChange={(e) => setForm({ ...form, iftarInfo: e.target.value })} className="rounded-xl bg-background" />
                  </div>
                </div>
              )}
            </div>

            {/* Keselesaan */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keselesaan</p>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sistem Pendingin</Label>
                <div className="flex flex-wrap gap-2">
                  {["Full AC / Sejuk Gila", "AC Sebahagian", "Kipas Gergasi (HVLS)", "Kipas Biasa", "Panas"].map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, cooling_system: c })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.cooling_system === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vibe Karpet</Label>
                <div className="flex flex-wrap gap-2">
                  {["Tebal / Selesa", "Standard", "Nipis", "Sajadah Sendiri"].map((k) => (
                    <button key={k} type="button" onClick={() => setForm({ ...form, karpet_vibe: form.karpet_vibe === k ? "" : k })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.karpet_vibe === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ciri-ciri Malaysia */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ciri-ciri Malaysia 🇲🇾</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "hasCoway", label: "Ada Coway 💧" },
                  { key: "talam_gang", label: "Talam Gang 🍛" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors">
                    <Checkbox checked={form[item.key as keyof typeof form] as boolean} onCheckedChange={(c) => setForm({ ...form, [item.key]: !!c })} />
                    {item.label}
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status Kucing 🐈</Label>
                <div className="flex flex-wrap gap-2">
                  {["Banyak / Kucing Friendly", "Ada Seekor Oren", "Ada Sikit", "Takda", "Tidak Pasti"].map((k) => (
                    <button key={k} type="button" onClick={() => setForm({ ...form, kucing_count: k })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.kucing_count === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Parkir */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parkir</p>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Susah Nak Parking?</Label>
                <div className="flex flex-wrap gap-2">
                  {["Senang", "Sederhana", "Susah / Double Park"].map((p) => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, parking_level: form.parking_level === p ? "" : p })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.parking_level === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "hasOKUAccess", label: "Parking OKU" },
                  { key: "has_parking_moto", label: "Parking Motor" },
                  { key: "near_bas", label: "Berhampiran Bas 🚌" },
                  { key: "near_lrt", label: "Berhampiran LRT 🚇" },
                  { key: "near_mrt", label: "Berhampiran MRT 🚊" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors">
                    <Checkbox checked={form[item.key as keyof typeof form] as boolean} onCheckedChange={(c) => setForm({ ...form, [item.key]: !!c })} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Kemudahan Wanita */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kemudahan Wanita</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors w-fit">
                <Checkbox checked={form.has_clean_telekung} onCheckedChange={(c) => setForm({ ...form, has_clean_telekung: !!c })} />
                Ada Telekung Bersih
              </label>
              {form.has_clean_telekung && (
                <div className="flex flex-wrap gap-2">
                  {["Banyak & Bersih", "Ada Tapi Sikit", "Bawa Sendiri"].map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, telekung_rating: form.telekung_rating === t ? "" : t })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.telekung_rating === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tandas & Wudhu */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tandas & Wudhu</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors w-fit">
                <Checkbox checked={form.wudhu_seating} onCheckedChange={(c) => setForm({ ...form, wudhu_seating: !!c })} />
                Tempat Duduk Wudhu
              </label>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kebersihan Tandas</Label>
                <div className="flex flex-wrap gap-2">
                  {["Bersih", "Sederhana", "Kurang Bersih"].map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, toilet_cleanliness: form.toilet_cleanliness === t ? "" : t })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.toilet_cleanliness === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lantai Tandas</Label>
                <div className="flex flex-wrap gap-2">
                  {["Kering", "Licin", "Basah"].map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, toilet_floor_condition: form.toilet_floor_condition === t ? "" : t })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.toilet_floor_condition === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Keluarga & Lain-lain */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keluarga & Lain-lain</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "hasKidsArea", label: "Ruang Kanak-kanak" },
                  { key: "is_tourist_friendly", label: "Mesra Pelancong" },
                  { key: "has_library", label: "Ada Perpustakaan" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors">
                    <Checkbox checked={form[item.key as keyof typeof form] as boolean} onCheckedChange={(c) => setForm({ ...form, [item.key]: !!c })} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6 text-base">
            <MapPin className="mr-2 h-5 w-5" />
            {submitting ? "Menyimpan..." : "Kongsi Masjid Ini"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Masjid akan dipaparkan dengan status "Belum disahkan" sehingga 3 pengguna lain mengesahkannya.
          </p>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default AddMasjid;
