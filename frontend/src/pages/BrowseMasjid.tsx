import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MasjidCard from "@/components/MasjidCard";
import { masjidsApi } from "@/lib/api";
import { QUICK_TAGS, TAG_FILTER_FN, type QuickTagKey } from "@/lib/constants";
import type { Masjid } from "@/types";
import { Link } from "react-router-dom";

const BrowseMasjid = () => {
  const [search, setSearch] = useState("");
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
      const f = m.facilities as unknown as Record<string, unknown> | null;
      if (!f) return false;
      return selectedTags.every((t) => TAG_FILTER_FN[t](f));
    })
    .sort((a, b) =>
      sortBy === "name"
        ? a.name.localeCompare(b.name)
        : (b.verification_count ?? 0) - (a.verification_count ?? 0)
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama masjid atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-11 py-6 text-base bg-card"
            />
          </div>
        </div>

        {/* Quick tag filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.key}
              onClick={() => toggleTag(tag.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTags.includes(tag.key)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tag.label}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="rounded-full px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              Kosongkan filter
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Susun:</span>
          <button
            onClick={() => setSortBy("verification")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sortBy === "verification" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Paling Disahkan
          </button>
          <button
            onClick={() => setSortBy("name")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sortBy === "name" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Nama A–Z
          </button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
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
