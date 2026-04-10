import { useState } from "react";
import { MapPin, ArrowLeft, Loader2 } from "lucide-react";
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
import { useMutation } from "@tanstack/react-query";
import { masjidsApi } from "@/lib/api";
import type { MasjidCreateForm, MasjidSummary } from "@/types";

const STATES = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Melaka", "Negeri Sembilan",
  "Pahang", "Penang", "Perak", "Perlis", "Putrajaya", "Sabah", "Sarawak",
  "Selangor", "Terengganu",
];

const AddMasjid = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    latitude: "",
    longitude: "",
    description: "",
    // Facilities
    aircond: false,
    wifi: false,
    wheelchair: false,
    sisterhood: false,
    parking: false,
    ablution: false,
  });

  if (!user) return <Navigate to="/auth" replace />;

  const createMutation = useMutation({
    mutationFn: (body: MasjidCreateForm) =>
      masjidsApi.create(body) as Promise<MasjidSummary>,
    onSuccess: (created) => {
      toast({
        title: "Masjid berjaya ditambah!",
        description: `${form.name} kini boleh dilihat oleh komuniti. Ia akan disahkan selepas 3 pengesahan.`,
      });
      navigate(`/masjid/${(created as any).slug ?? ""}`);
    },
    onError: () => {
      toast({
        title: "Gagal menambah masjid",
        description: "Sila semak semua maklumat dan cuba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Koordinat tidak sah", description: "Masukkan latitude dan longitude yang betul.", variant: "destructive" });
      return;
    }

    const facilities: Record<string, boolean> = {};
    if (form.aircond) facilities.aircond = true;
    if (form.wifi) facilities.wifi = true;
    if (form.wheelchair) facilities.wheelchair = true;
    if (form.sisterhood) facilities.sisterhood = true;
    if (form.parking) facilities.parking = true;
    if (form.ablution) facilities.ablution = true;

    createMutation.mutate({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      postcode: form.postcode || undefined,
      country: "Malaysia",
      latitude: lat,
      longitude: lng,
      description: form.description || undefined,
      facilities: Object.keys(facilities).length > 0 ? facilities : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />Kembali
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Tambah Masjid Baru</h1>
          <p className="mt-2 text-muted-foreground">
            Kongsi info masjid ni dengan komuniti. Masjid akan muncul terus dengan tag "Belum disahkan".
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <h3 className="font-serif text-base font-semibold">Maklumat Asas</h3>

            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">Nama Masjid *</Label>
              <Input id="name" placeholder="cth: Masjid Al-Ikhlas" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl bg-background" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-medium">Alamat Penuh *</Label>
              <Input id="address" placeholder="cth: No 1, Jalan Masjid, Taman Sri Muda" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-xl bg-background" required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="font-medium">Bandar / Kawasan *</Label>
                <Input id="city" placeholder="cth: Shah Alam" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-xl bg-background" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="font-medium">Negeri *</Label>
                <select id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm" required>
                  <option value="">Pilih negeri</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode" className="font-medium">Poskod</Label>
              <Input id="postcode" placeholder="cth: 40150" value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                className="rounded-xl bg-background" maxLength={10} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="font-medium">Latitude *</Label>
                <Input id="latitude" type="number" step="any" placeholder="cth: 3.1390" value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="rounded-xl bg-background" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="font-medium">Longitude *</Label>
                <Input id="longitude" type="number" step="any" placeholder="cth: 101.6869" value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="rounded-xl bg-background" required />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Buka Google Maps, klik pada masjid, dan salin koordinat dari URL atau popup.
            </p>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium">Maklumat Tambahan</Label>
              <Textarea id="description" placeholder="cth: Masjid berhampiran pasar malam. Ada parkir luas..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl bg-background min-h-[80px]" />
            </div>
          </div>

          {/* Facilities */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h3 className="font-serif text-base font-semibold">Kemudahan</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "wheelchair", label: "Mesra OKU (lift/wheelchair)" },
                { key: "sisterhood", label: "Ruang Solat Wanita" },
                { key: "aircond", label: "Aircon" },
                { key: "wifi", label: "WiFi" },
                { key: "parking", label: "Tempat Letak Kereta" },
                { key: "ablution", label: "Tempat Wudhu" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 transition-colors">
                  <Checkbox
                    checked={form[item.key as keyof typeof form] as boolean}
                    onCheckedChange={(c) => setForm({ ...form, [item.key]: !!c })}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg"
            className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6 text-base"
            disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Menghantar...</>
            ) : (
              <><MapPin className="mr-2 h-5 w-5" />Kongsi Masjid Ini</>
            )}
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
