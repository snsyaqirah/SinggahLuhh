import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BookOpen, Star, Plus, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  khatamApi, specialPrayersApi,
  type KhatamEntry, type SpecialPrayerEntry,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PRAYER_TYPE_OPTIONS = [
  { value: "tahajjud", label: "Tahajjud" },
  { value: "hajat", label: "Hajat" },
  { value: "dhuha", label: "Dhuha" },
  { value: "witir", label: "Witir" },
  { value: "istikharah", label: "Istikharah" },
  { value: "taubat", label: "Taubat" },
  { value: "syukur", label: "Syukur" },
  { value: "others", label: "Lain-lain" },
];

const IbadahSaya = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"khatam" | "solat">("khatam");

  const [kJuz, setKJuz] = useState("");
  const [kSurahFrom, setKSurahFrom] = useState("");
  const [kAyahFrom, setKAyahFrom] = useState("");
  const [kSurahTo, setKSurahTo] = useState("");
  const [kAyahTo, setKAyahTo] = useState("");
  const [kNotes, setKNotes] = useState("");
  const [showKForm, setShowKForm] = useState(false);

  const [sPrayerType, setSPrayerType] = useState("tahajjud");
  const [sRakaat, setSRakaat] = useState("");
  const [sNotes, setSNotes] = useState("");
  const [showSForm, setShowSForm] = useState(false);

  const { data: khatamEntries, isLoading: kLoading } = useQuery({
    queryKey: ["khatam"],
    queryFn: () => khatamApi.list(),
    enabled: !!user,
  });

  const { data: prayerEntries, isLoading: sLoading } = useQuery({
    queryKey: ["special-prayers"],
    queryFn: () => specialPrayersApi.list(),
    enabled: !!user,
  });

  const khatamMutation = useMutation({
    mutationFn: () =>
      khatamApi.log({
        surahFrom: parseInt(kSurahFrom) || 1,
        ayahFrom: parseInt(kAyahFrom) || 1,
        surahTo: parseInt(kSurahTo) || parseInt(kSurahFrom) || 1,
        ayahTo: parseInt(kAyahTo) || parseInt(kAyahFrom) || 1,
        juz: kJuz ? parseInt(kJuz) : undefined,
        notes: kNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["khatam"] });
      toast({ title: "Rekod khatam ditambah! 📖" });
      setKJuz(""); setKSurahFrom(""); setKAyahFrom("");
      setKSurahTo(""); setKAyahTo(""); setKNotes("");
      setShowKForm(false);
    },
    onError: () => toast({ title: "Gagal simpan rekod", variant: "destructive" }),
  });

  const khatamDeleteMutation = useMutation({
    mutationFn: (id: string) => khatamApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["khatam"] });
      toast({ title: "Rekod dipadam" });
    },
  });

  const prayerMutation = useMutation({
    mutationFn: () =>
      specialPrayersApi.log({
        prayerType: sPrayerType,
        rakaat: sRakaat ? parseInt(sRakaat) : undefined,
        notes: sNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-prayers"] });
      toast({ title: "Rekod solat ditambah! ✨" });
      setSPrayerType("tahajjud"); setSRakaat(""); setSNotes("");
      setShowSForm(false);
    },
    onError: () => toast({ title: "Gagal simpan rekod", variant: "destructive" }),
  });

  const prayerDeleteMutation = useMutation({
    mutationFn: (id: string) => specialPrayersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-prayers"] });
      toast({ title: "Rekod dipadam" });
    },
  });

  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;

  const isLoading = tab === "khatam" ? kLoading : sLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Ibadah Saya</h1>
          <p className="mt-2 text-muted-foreground">Log peribadi khatam Al-Quran & solat sunat</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("khatam")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === "khatam"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Khatam Al-Quran
            {(khatamEntries?.length ?? 0) > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{khatamEntries!.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("solat")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === "solat"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <Star className="h-4 w-4" />
            Solat Sunat
            {(prayerEntries?.length ?? 0) > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{prayerEntries!.length}</span>
            )}
          </button>
        </div>

        {/* ── Khatam Tab ── */}
        {tab === "khatam" && (
          <div className="space-y-4">
            <Button
              className="w-full rounded-xl gap-2"
              variant={showKForm ? "outline" : "default"}
              onClick={() => setShowKForm((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              {showKForm ? "Tutup Form" : "Tambah Rekod Khatam"}
            </Button>

            {showKForm && (
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-sm">Rekod Bacaan Al-Quran</h3>
                <div>
                  <Label className="text-xs">Juzuk (1–30)</Label>
                  <Input
                    value={kJuz}
                    onChange={(e) => setKJuz(e.target.value)}
                    type="number" min="1" max="30"
                    placeholder="Contoh: 1"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Surah Mula (No.)</Label>
                    <Input value={kSurahFrom} onChange={(e) => setKSurahFrom(e.target.value)} type="number" min="1" max="114" placeholder="1" className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Ayat Mula</Label>
                    <Input value={kAyahFrom} onChange={(e) => setKAyahFrom(e.target.value)} type="number" min="1" placeholder="1" className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Surah Akhir (No.)</Label>
                    <Input value={kSurahTo} onChange={(e) => setKSurahTo(e.target.value)} type="number" min="1" max="114" placeholder="1" className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs">Ayat Akhir</Label>
                    <Input value={kAyahTo} onChange={(e) => setKAyahTo(e.target.value)} type="number" min="1" placeholder="1" className="mt-1 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Nota (pilihan)</Label>
                  <Textarea
                    value={kNotes}
                    onChange={(e) => setKNotes(e.target.value)}
                    placeholder="Contoh: Tamat juzuk pertama selepas Subuh..."
                    className="mt-1 rounded-xl min-h-[60px] text-sm"
                  />
                </div>
                <Button
                  className="w-full rounded-xl"
                  disabled={(!kJuz && !kSurahFrom) || khatamMutation.isPending}
                  onClick={() => khatamMutation.mutate()}
                >
                  {khatamMutation.isPending ? "Menyimpan..." : "Simpan Rekod"}
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !khatamEntries?.length ? (
              <div className="py-16 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="font-semibold text-foreground">Belum ada rekod khatam</p>
                <p className="text-sm text-muted-foreground mt-1">Mulakan rekod bacaan Al-Quran anda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(khatamEntries as KhatamEntry[]).map((k) => (
                  <div key={k.id} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <span className="text-lg font-bold text-primary">{k.juz ?? "📖"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {k.juz ? `Juzuk ${k.juz}` : `Surah ${k.surahFrom}:${k.ayahFrom} — ${k.surahTo}:${k.ayahTo}`}
                      </p>
                      {k.juz && k.surahFrom > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Surah {k.surahFrom}:{k.ayahFrom} — {k.surahTo}:{k.ayahTo}
                        </p>
                      )}
                      {k.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{k.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(k.createdAt).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => khatamDeleteMutation.mutate(k.id)}
                      disabled={khatamDeleteMutation.isPending}
                      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Solat Sunat Tab ── */}
        {tab === "solat" && (
          <div className="space-y-4">
            <Button
              className="w-full rounded-xl gap-2"
              variant={showSForm ? "outline" : "default"}
              onClick={() => setShowSForm((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              {showSForm ? "Tutup Form" : "Tambah Rekod Solat Sunat"}
            </Button>

            {showSForm && (
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-sm">Rekod Solat Sunat</h3>
                <div>
                  <Label className="text-xs">Jenis Solat</Label>
                  <Select value={sPrayerType} onValueChange={setSPrayerType}>
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRAYER_TYPE_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Bilangan Rakaat</Label>
                  <Input
                    value={sRakaat}
                    onChange={(e) => setSRakaat(e.target.value)}
                    type="number" min="1"
                    placeholder="Contoh: 2"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nota (pilihan)</Label>
                  <Textarea
                    value={sNotes}
                    onChange={(e) => setSNotes(e.target.value)}
                    placeholder="Doa atau tujuan solat ini..."
                    className="mt-1 rounded-xl min-h-[60px] text-sm"
                  />
                </div>
                <Button
                  className="w-full rounded-xl"
                  disabled={prayerMutation.isPending}
                  onClick={() => prayerMutation.mutate()}
                >
                  {prayerMutation.isPending ? "Menyimpan..." : "Simpan Rekod"}
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !prayerEntries?.length ? (
              <div className="py-16 text-center">
                <Star className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="font-semibold text-foreground">Belum ada rekod solat sunat</p>
                <p className="text-sm text-muted-foreground mt-1">Log solat sunat harian anda di sini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(prayerEntries as SpecialPrayerEntry[]).map((p) => (
                  <div key={p.id} className="flex items-start gap-3 rounded-2xl border bg-card p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {PRAYER_TYPE_OPTIONS.find((o) => o.value === p.prayerType)?.label ?? p.prayerType}
                      </p>
                      {p.rakaat && <p className="text-xs text-muted-foreground">{p.rakaat} rakaat</p>}
                      {p.masjidName && <p className="text-xs text-muted-foreground">@ {p.masjidName}</p>}
                      {p.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{p.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(p.createdAt).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => prayerDeleteMutation.mutate(p.id)}
                      disabled={prayerDeleteMutation.isPending}
                      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default IbadahSaya;
