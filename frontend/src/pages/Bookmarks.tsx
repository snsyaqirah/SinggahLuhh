import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bookmark, Heart, MapPin, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookmarksApi, type BookmarkItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toTitleCase } from "@/lib/utils";

const PLACE_EMOJI: Record<string, string> = { masjid: "🕌", surau: "🏘️", musolla: "🏠" };

const Bookmarks = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"saved" | "wishlist">("saved");

  const { data: saved, isLoading: loadingSaved } = useQuery({
    queryKey: ["bookmarks", false],
    queryFn: () => bookmarksApi.list(false),
    enabled: !!user,
  });

  const { data: wishlist, isLoading: loadingWishlist } = useQuery({
    queryKey: ["bookmarks", true],
    queryFn: () => bookmarksApi.list(true),
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (masjidId: string) => bookmarksApi.remove(masjidId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast({ title: "Bookmark dipadam" });
    },
  });

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const items = tab === "saved" ? (saved ?? []) : (wishlist ?? []);
  const isLoading = tab === "saved" ? loadingSaved : loadingWishlist;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Senarai Saya</h1>
          <p className="mt-2 text-muted-foreground">Tempat solat yang anda simpan & nak pergi</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("saved")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === "saved" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
          >
            <Bookmark className="h-4 w-4" />
            Disimpan
            {(saved?.length ?? 0) > 0 && <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{saved!.length}</span>}
          </button>
          <button
            onClick={() => setTab("wishlist")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === "wishlist" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
          >
            <Heart className="h-4 w-4" />
            Nak Pergi
            {(wishlist?.length ?? 0) > 0 && <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{wishlist!.length}</span>}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            {tab === "saved" ? <Bookmark className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" /> : <Heart className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />}
            <p className="font-semibold text-foreground">
              {tab === "saved" ? "Belum ada tempat solat disimpan" : "Belum ada dalam senarai nak pergi"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "saved" ? "Pergi ke halaman masjid dan tekan 'Simpan'" : "Tekan '♡ Nak Pergi' pada mana-mana masjid"}
            </p>
            <Button asChild className="mt-4 rounded-xl" size="sm">
              <Link to="/browse">Cari Tempat Solat</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: BookmarkItem) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
                <span className="text-2xl">{PLACE_EMOJI[item.masjidType ?? "masjid"] ?? "🕌"}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/masjid/${item.masjidId}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors text-sm leading-tight block"
                  >
                    {toTitleCase(item.masjidName ?? "Tempat Solat")}
                  </Link>
                  {item.masjidAddress && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {item.masjidAddress}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {item.masjidStatus === "verified" && (
                      <Badge variant="outline" className="text-[10px] py-0 border-accent text-accent">✅ Disahkan</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeMutation.mutate(item.masjidId)}
                  disabled={removeMutation.isPending}
                  className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Bookmarks;
