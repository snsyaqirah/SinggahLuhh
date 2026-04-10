import { useState } from "react";
<<<<<<< HEAD
import { Search, MapPin, Star, Loader2 } from "lucide-react";
=======
import { Search, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MasjidCard from "@/components/MasjidCard";
<<<<<<< HEAD
=======
import { masjidsApi } from "@/lib/api";
import { QUICK_TAGS, TAG_FILTER_FN, type QuickTagKey } from "@/lib/constants";
import type { Masjid } from "@/types";
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { masjidsApi } from "@/lib/api";
import type { PaginatedResponse, MasjidSummary } from "@/types";

const BrowseMasjid = () => {
  const [search, setSearch] = useState("");
<<<<<<< HEAD
  const [sortBy, setSortBy] = useState<"visits" | "rating">("visits");

  const { data, isLoading, isError } = useQuery<PaginatedResponse<MasjidSummary>>({
    queryKey: ["masjids"],
    queryFn: () => masjidsApi.list({ pageSize: 100 }) as Promise<PaginatedResponse<MasjidSummary>>,
  });

  const masjids = data?.items ?? [];

  // Client-side filtering & sort
  const filtered = masjids
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      sortBy === "rating"
        ? (b.averageRating ?? 0) - (a.averageRating ?? 0)
        : b.visitCount - a.visitCount
=======
  const [selectedTags, setSelectedTags] = useState<QuickTagKey[]>([]);
  const [sortBy, setSortBy] = useState<"verification" | "name">("verification");

  const { data, isLoading } = useQuery({
    queryKey: ["masjids", "list", search],
    queryFn: () => masjidsApi.list({ search: search || undefined, page_size: 50 }),
  });

  const allMasjids: Masjid[] = (data?.items ?? []) as Masjid[];

  const toggleTag = (key: QuickTagKey) => {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const filtered = allMasjids
    .filter((m) => {
      if (selectedTags.length === 0) return true;
      const f = m.facilities as Record<string, unknown> | null;
      if (!f) return false;
      return selectedTags.every((t) => TAG_FILTER_FN[t](f));
    })
    .sort((a, b) =>
      sortBy === "name"
        ? a.name.localeCompare(b.name)
        : (b.verification_count ?? 0) - (a.verification_count ?? 0)
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Cari Masjid
          </h1>
          <p className="mt-2 text-muted-foreground">
            Temui masjid berdekatan — filter ikut kemudahan yang anda perlukan
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama masjid, lokasi, atau negeri..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-11 py-6 text-base bg-card"
            />
          </div>
        </div>

<<<<<<< HEAD
        {/* Sort */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Susun:</span>
          <button
            onClick={() => setSortBy("visits")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sortBy === "visits" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Paling Dikunjungi
          </button>
          <button
            onClick={() => setSortBy("rating")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              sortBy === "rating" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Star className="h-3 w-3" /> Rating Tertinggi
          </button>
=======
        {/* Filter + Sort bar */}
        <div className="mb-6 space-y-2">
          {/* Filter tags — horizontally scrollable on mobile, wraps on desktop */}
          <div className="flex items-start gap-2">
            <span className="shrink-0 pt-1.5 text-xs font-medium text-muted-foreground">Filter:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap md:flex-wrap scrollbar-none -mr-4 pr-4">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag.key}
                  onClick={() => toggleTag(tag.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag.key)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Susun:</span>
            <button
              onClick={() => setSortBy("verification")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "verification" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Paling Disahkan
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                sortBy === "name" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Star className="h-3 w-3" /> Nama A-Z
            </button>
          </div>
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
        </div>

        {/* Results */}
        {isLoading ? (
<<<<<<< HEAD
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Gagal memuatkan data. Sila cuba lagi.</p>
          </div>
=======
          <div className="py-20 text-center text-muted-foreground">Memuatkan masjid...</div>
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((masjid) => (
              <MasjidCard key={masjid.id} masjid={masjid} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Tiada masjid dijumpai
            </h3>
            <p className="mt-2 text-muted-foreground">
              Cuba carian lain atau tambah masjid baru!
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link to="/add">Tambah Masjid</Link>
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BrowseMasjid;
