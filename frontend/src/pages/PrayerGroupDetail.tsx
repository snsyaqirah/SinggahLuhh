import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Users, LogOut, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { groupsApi, type GroupDetail, type RecentVisit, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toTitleCase } from "@/lib/utils";

const VISIT_LABELS: Record<string, string> = {
  general: "Solat", jumaat: "Jumaat", terawih: "Terawih",
  iftar: "Iftar", kuliah: "Kuliah",
};

const PrayerGroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["group", id],
    queryFn: () => groupsApi.get(id!),
    enabled: !!id && !!user,
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupsApi.leave(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Anda keluar dari kumpulan" });
      navigate("/groups");
    },
    onError: (e) =>
      toast({ title: e instanceof ApiError ? e.message : "Gagal keluar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: "Kumpulan dipadam" });
      navigate("/groups");
    },
  });

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode).then(
      () => toast({ title: "Kod disalin! 📋" }),
    );
  };

  const shareWhatsApp = () => {
    if (!group) return;
    const text = encodeURIComponent(
      `Jom jejak masjid bersama dalam kumpulan "${group.name}" di SinggahLuhh! 🕌\n` +
      `Guna kod jemputan: *${group.inviteCode}*`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <Footer />
    </div>
  );

  if (isError || !group) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="font-semibold text-foreground">Kumpulan tidak dijumpai</p>
        <Button asChild className="mt-4 rounded-xl">
          <Link to="/groups">Kembali</Link>
        </Button>
      </div>
      <Footer />
    </div>
  );

  const g = group as GroupDetail;
  const isAdmin = g.createdBy === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Kumpulan Saya
        </Link>

        {/* Group header */}
        <div className="rounded-2xl border bg-card p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <span className="text-2xl">{g.type === "buddy" ? "👥" : "🕌"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl font-bold text-foreground leading-tight">{g.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {g.type === "buddy" ? "Buddy" : "Kumpulan"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {g.members.length} / {g.maxMembers} ahli
                </span>
              </div>
            </div>
          </div>

          {/* Invite code */}
          <div className="mt-5 rounded-xl bg-secondary/50 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Kod Jemputan — kongsikan dengan rakan
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-3xl font-bold text-primary tracking-[0.3em]">
                {g.inviteCode}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={copyCode}>
                  <Copy className="h-3.5 w-3.5" /> Salin
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={shareWhatsApp}>
                  📲 WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="rounded-2xl border bg-card p-6 mb-4">
          <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Ahli Kumpulan
          </h3>
          <div className="space-y-2">
            {g.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(m.fullName ?? "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium flex-1 min-w-0 truncate">
                  {m.fullName ?? "Pengguna"}
                  {m.userId === user?.id && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">(anda)</span>
                  )}
                </p>
                {m.role === "admin" && (
                  <Badge variant="outline" className="text-[10px] py-0 shrink-0">Admin</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {g.recentActivity && g.recentActivity.length > 0 && (
          <div className="rounded-2xl border bg-card p-6 mb-4">
            <h3 className="font-serif text-lg font-semibold mb-4">Aktiviti Terkini</h3>
            <div className="space-y-2">
              {(g.recentActivity as RecentVisit[]).map((v, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                  <span className="text-base shrink-0">🕌</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {v.fullName ?? "Ahli"} ·{" "}
                      <span className="text-muted-foreground font-normal">
                        {VISIT_LABELS[v.visitType] ?? v.visitType}
                      </span>
                    </p>
                    {v.masjidName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {toTitleCase(v.masjidName)}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(v.createdAt).toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave / Delete */}
        <div className="flex gap-3">
          {!isAdmin && (
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl text-muted-foreground"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {leaveMutation.isPending ? "Keluar..." : "Keluar Kumpulan"}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {deleteMutation.isPending ? "Memadam..." : "Padam Kumpulan"}
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrayerGroupDetail;
