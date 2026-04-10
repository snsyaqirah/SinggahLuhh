import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { User, Edit2, Save, X, Trophy, Calendar, MapPin, TrendingUp, Loader2, Flag, CheckCircle2, XCircle, Clock, Search, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, authApi, verificationsApi, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Report, ReportStatus } from "@/types";

type ProfileData = {
  id: string;
  full_name: string;
  phone_number: string | null;
  gender: string | null;
  reputation_points: number;
  streak_count: number;
  longest_streak: number;
  last_checkin_at: string | null;
  created_at: string | null;
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  does_not_exist: "Tidak wujud",
  wrong_location: "Lokasi salah",
  duplicate: "Duplikat",
  wrong_info: "Info tidak tepat",
  inappropriate_content: "Kandungan tidak sesuai",
  other: "Lain-lain",
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending:   { label: "Menunggu",       variant: "secondary",   icon: <Clock className="h-3 w-3" /> },
  reviewing: { label: "Sedang Disemak", variant: "default",     icon: <Search className="h-3 w-3" /> },
  resolved:  { label: "Selesai",        variant: "outline",     icon: <CheckCircle2 className="h-3 w-3" /> },
  dismissed: { label: "Ditolak",        variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

const Profile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone_number: "", gender: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.get(),
  });

  const { data: myReports, isLoading: loadingReports } = useQuery<Report[]>({
    queryKey: ["reports", "mine"],
    queryFn: () => verificationsApi.getMyReports(),
  });

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone_number: profile.phone_number ?? "",
        gender: profile.gender ?? "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        full_name: form.full_name || undefined,
        phone_number: form.phone_number || undefined,
        gender: (form.gender as "Lelaki" | "Perempuan" | undefined) || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      setEditing(false);
      toast({ title: "Profil dikemaskini!", description: "Maklumat anda telah disimpan." });
    },
    onError: (err) => {
      toast({
        title: "Gagal kemaskini",
        description: err instanceof ApiError ? err.message : "Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: async () => {
      toast({ title: "Akaun dipadam", description: "Akaun anda telah dipadam sepenuhnya." });
      await logout();
    },
    onError: (err) => {
      toast({
        title: "Gagal padam akaun",
        description: err instanceof ApiError ? err.message : "Sila cuba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = () => {
    setForm({
      full_name: profile?.full_name ?? "",
      phone_number: profile?.phone_number ?? "",
      gender: profile?.gender ?? "",
    });
    setEditing(true);
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("ms-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Profil Saya</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar + name card */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {(profile?.full_name ?? user.fullName).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">
                      {profile?.full_name ?? user.fullName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ahli sejak {formatDate(profile?.created_at)}
                    </p>
                  </div>
                </div>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartEdit}
                    className="rounded-lg gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Edit form */}
              {editing && (
                <div className="mt-6 space-y-4 border-t pt-5">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Penuh</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                      className="rounded-xl bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">No. Telefon (Opsyen)</Label>
                    <Input
                      id="phone_number"
                      placeholder="cth: 0123456789"
                      value={form.phone_number}
                      onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                      className="rounded-xl bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jantina</Label>
                    <RadioGroup
                      value={form.gender}
                      onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
                      className="flex gap-6 pt-1"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="Lelaki" id="gender-l" />
                        <Label htmlFor="gender-l" className="cursor-pointer font-normal">Lelaki</Label>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="Perempuan" id="gender-p" />
                        <Label htmlFor="gender-p" className="cursor-pointer font-normal">Perempuan</Label>
                      </label>
                    </RadioGroup>
                  </div>                  <div className="flex gap-3">
                    <Button
                      onClick={() => mutation.mutate()}
                      disabled={mutation.isPending}
                      className="rounded-xl gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {mutation.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="rounded-xl gap-2"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Trophy,
                  label: "Mata Reputasi",
                  value: profile?.reputation_points ?? 0,
                  color: "text-accent",
                },
                {
                  icon: TrendingUp,
                  label: "Streak Semasa",
                  value: profile?.streak_count ?? 0,
                  color: "text-primary",
                },
                {
                  icon: Calendar,
                  label: "Streak Terpanjang",
                  value: profile?.longest_streak ?? 0,
                  color: "text-primary",
                },
                {
                  icon: MapPin,
                  label: "Check-in Terakhir",
                  value: formatDate(profile?.last_checkin_at),
                  color: "text-accent",
                  isText: true,
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border bg-card p-5">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  {stat.isText ? (
                    <p className="font-semibold text-foreground text-sm">{stat.value}</p>
                  ) : (
                    <p className="font-serif text-2xl font-bold text-foreground">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Phone number display */}
            {profile?.phone_number && !editing && (
              <div className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-medium text-muted-foreground mb-1">No. Telefon</p>
                <p className="text-sm font-medium text-foreground">{profile.phone_number}</p>
              </div>
            )}

            {/* My Reports */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Laporan Saya</h3>
                {(myReports?.length ?? 0) > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">{myReports!.length} laporan</span>
                )}
              </div>

              {loadingReports ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : !myReports?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tiada laporan lagi</p>
              ) : (
                <div className="space-y-3">
                  {myReports.map((r) => {
                    const cfg = STATUS_CONFIG[r.status];
                    return (
                      <div key={r.id} className="rounded-xl border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/masjid/${r.masjid_id}`}
                              className="text-sm font-medium hover:underline truncate block"
                            >
                              {r.masjids?.name ?? r.masjid_id}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}
                              {" · "}
                              {(() => { const d = new Date(r.created_at); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" }); })()}
                            </p>
                            {r.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                            )}
                          </div>
                          <Badge variant={cfg.variant} className="flex items-center gap-1 shrink-0 text-xs">
                            {cfg.icon} {cfg.label}
                          </Badge>
                        </div>
                        {r.resolution_notes && (
                          <div className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Nota admin: </span>
                            {r.resolution_notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Danger Zone */}
            <div className="rounded-2xl border border-destructive/30 bg-card p-5">
              <h3 className="font-semibold text-sm text-destructive mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Zon Berbahaya
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Pemadaman akaun adalah kekal dan tidak boleh dipulihkan. Rekod sumbangan masjid anda yang bersifat awam mungkin dikekalkan sebagai rekod komuniti.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Padam Akaun Saya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Padam Akaun?
            </DialogTitle>
            <DialogDescription className="space-y-1 pt-1">
              <span className="block">Tindakan ini <strong>kekal dan tidak boleh dibatalkan</strong>. Semua data peribadi anda akan dipadam.</span>
              <span className="block text-xs mt-1">Rekod awam (sumbangan masjid, check-in) mungkin dikekalkan sebagai rekod komuniti.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={deleteAccountMutation.isPending}
              onClick={() => { setDeleteOpen(false); deleteAccountMutation.mutate(); }}
            >
              {deleteAccountMutation.isPending ? "Memadamkan..." : "Ya, Padam Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Profile;
