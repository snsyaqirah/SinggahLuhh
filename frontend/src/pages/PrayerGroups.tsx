import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Users, Plus, LogIn, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { groupsApi, type GroupItem, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PrayerGroups = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("group");
  const [joinCode, setJoinCode] = useState("");

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => groupsApi.create({ name: newName.trim(), type: newType }),
    onSuccess: (g) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: `Kumpulan "${g.name}" dibuat! Kod: ${g.inviteCode}` });
      setShowCreateForm(false);
      setNewName(""); setNewType("group");
    },
    onError: () => toast({ title: "Gagal buat kumpulan", variant: "destructive" }),
  });

  const joinMutation = useMutation({
    mutationFn: () => groupsApi.join(joinCode.trim().toUpperCase()),
    onSuccess: (g) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: `Berjaya join "${g.name}"! 🎉` });
      setShowJoinForm(false);
      setJoinCode("");
    },
    onError: (e) =>
      toast({ title: e instanceof ApiError ? e.message : "Kod tidak sah", variant: "destructive" }),
  });

  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Kumpulan Doa</h1>
          <p className="mt-2 text-muted-foreground">Jejak kunjungan bersama rakan & keluarga</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            className="flex-1 rounded-xl gap-2"
            onClick={() => { setShowCreateForm((v) => !v); setShowJoinForm(false); }}
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? "Tutup" : "Buat Kumpulan"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl gap-2"
            onClick={() => { setShowJoinForm((v) => !v); setShowCreateForm(false); }}
          >
            <LogIn className="h-4 w-4" />
            {showJoinForm ? "Tutup" : "Join dengan Kod"}
          </Button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-6 rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Buat Kumpulan Baru</h3>
            <div>
              <Label className="text-xs">Nama Kumpulan *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Kumpulan Masjid Ayah"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs">Jenis</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Kumpulan (ramai ahli)</SelectItem>
                  <SelectItem value="buddy">Buddy (2 orang)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Mencipta..." : "Buat Kumpulan"}
            </Button>
          </div>
        )}

        {/* Join form */}
        {showJoinForm && (
          <div className="mb-6 rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Join dengan Kod Jemputan</h3>
            <div>
              <Label className="text-xs">Kod Jemputan (8 aksara)</Label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Contoh: ABCD1234"
                maxLength={8}
                className="mt-1 rounded-xl font-mono uppercase tracking-[0.3em] text-center text-lg"
              />
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={joinCode.length !== 8 || joinMutation.isPending}
              onClick={() => joinMutation.mutate()}
            >
              {joinMutation.isPending ? "Menyertai..." : "Join Kumpulan"}
            </Button>
          </div>
        )}

        {/* Groups list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !(groups as GroupItem[] | undefined)?.length ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="font-semibold text-foreground">Belum ada kumpulan</p>
            <p className="text-sm text-muted-foreground mt-1">
              Buat kumpulan atau join guna kod jemputan rakan
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(groups as GroupItem[]).map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <span className="text-2xl">{g.type === "buddy" ? "👥" : "🕌"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.memberCount} / {g.maxMembers} ahli · {g.type === "buddy" ? "Buddy" : "Kumpulan"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-mono font-bold text-primary bg-primary/10 rounded-lg px-2 py-1 tracking-widest">
                    {g.inviteCode}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PrayerGroups;
