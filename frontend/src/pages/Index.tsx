import { Link } from "react-router-dom";
import { MapPin, Moon, Star, ArrowRight, Users, Compass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MasjidCard from "@/components/MasjidCard";
import { masjidsApi, statsApi, trendingApi, type TrendingMasjid } from "@/lib/api";
import type { Masjid } from "@/types";
import heroImage from "@/assets/hero-mosque.jpg";

const Index = () => {
  const { data } = useQuery({
    queryKey: ["masjids", "featured"],
    queryFn: () => masjidsApi.list({ status: "verified", page_size: 3 }),
  });
  const featuredMasjids: Masjid[] = (data?.items ?? []) as Masjid[];

  const { data: publicStats } = useQuery({
    queryKey: ["stats", "public"],
    queryFn: () => statsApi.public(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trending } = useQuery({
    queryKey: ["trending"],
    queryFn: () => trendingApi.list(8),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Masjid yang indah"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
        </div>

        <div className="relative container mx-auto px-4 py-14 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Compass className="h-4 w-4" />
              <span>Jejak. Kongsi. Temui.</span>
            </div>

            <h1 className="font-serif text-4xl font-bold leading-tight text-primary-foreground md:text-6xl animate-fade-in-up">
              Jejaki setiap
              <br />
              <span className="text-accent">masjid</span> yang
              <br />
              anda kunjungi
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-foreground/80 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              Rekod masjid, surau & musolla yang anda singgah, kongsi review dengan komuniti,
              dan temui tempat solat terbaik berdekatan anda.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Button asChild size="lg" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8">
                <Link to="/browse">
                  <MapPin className="mr-2 h-5 w-5" />
                  Cari Tempat Solat
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 font-semibold text-base px-8">
                <Link to="/tracking">
                  Jejak Saya
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card islamic-pattern">
        <div className="container mx-auto grid grid-cols-3 gap-4 px-4 py-5 text-center">
          <div>
            <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
              {publicStats?.total_masjids ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Tempat Solat Didaftarkan</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
              {publicStats ? (publicStats.total_visits > 0 ? `${publicStats.total_visits}+` : publicStats.total_visits) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Kunjungan Direkodkan</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
              {publicStats?.verified_masjids ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Tempat Solat Disahkan</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-10 md:py-16">
          <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Macam mana ia berfungsi?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Tiga langkah mudah untuk mula menjejaki tempat solat anda
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Cari atau Tambah",
              description: "Cari masjid, surau, atau musolla berdekatan, atau tambah tempat solat baru yang anda kunjungi. Lengkapkan info fasiliti untuk bantu orang lain.",
              step: "01",
            },
            {
              icon: Star,
              title: "Review & Rekod",
              description: "Bagi rating, tulis review ringkas, dan tag vibe masjid tu. Bantu orang lain pilih masjid terbaik.",
              step: "02",
            },
            {
              icon: Users,
              title: "Sahkan & Kongsi",
              description: "Sahkan info masjid yang orang lain tambah. 3 pengesahan = Disahkan oleh komuniti!",
              step: "03",
            },
          ].map((item) => (
            <div key={item.step} className="group rounded-2xl border bg-card p-6 text-center transition-all hover:shadow-md hover:-translate-y-1">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs font-bold text-accent">{item.step}</span>
              <h3 className="mt-2 font-serif text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Masjids */}
      <section className="bg-secondary/50 islamic-pattern">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                Tempat Solat Popular
              </h2>
              <p className="mt-2 text-muted-foreground">
                Paling banyak dikunjungi dan highest rated oleh komuniti
              </p>
            </div>
            <Button asChild variant="ghost" className="text-primary font-semibold">
              <Link to="/browse">
                Lihat semua
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredMasjids.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredMasjids.map((masjid) => (
                <MasjidCard key={masjid.id} masjid={masjid} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card py-16 text-center">
              <Moon className="mb-4 h-12 w-12 text-primary/30" />
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Belum ada tempat solat popular lagi
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Jadilah yang pertama! Tambah tempat solat yang anda kunjungi dan bantu komuniti.
              </p>
              <Button asChild className="mt-6 rounded-xl font-semibold" size="sm">
                <Link to="/add">
                  <MapPin className="mr-2 h-4 w-4" />
                  Tambah Tempat Solat
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Trending */}
      {trending && trending.length > 0 && (
        <section className="container mx-auto px-4 py-10 md:py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
                🔥 Trending Minggu Ini
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Aktif paling banyak berdasarkan kunjungan & kemaskini
              </p>
            </div>
            <Button asChild variant="ghost" className="text-primary font-semibold text-sm">
              <Link to="/browse">Lihat semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
            {(trending as TrendingMasjid[]).map((t, i) => {
              const emoji = t.masjidType === "surau" ? "🏘️" : t.masjidType === "musolla" ? "🏠" : "🕌";
              const href = `/masjid/${t.masjidSlug ?? t.masjidId}`;
              return (
                <Link
                  key={t.masjidId}
                  to={href}
                  className="flex-shrink-0 w-52 rounded-2xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                    {t.masjidName ?? "Tempat Solat"}
                  </p>
                  {t.masjidState && (
                    <p className="text-xs text-muted-foreground mt-1">{t.masjidState}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {t.score} mata minggu ini
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container mx-auto px-4 py-10 md:py-16 text-center">
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 md:p-12">
          <Compass className="mx-auto h-10 w-10 text-accent mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            Tempat solat mana anda dah singgah?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Mula rekod kunjungan masjid, surau & musolla anda dan kongsi pengalaman dengan komuniti.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
            <Link to="/browse">
              Mula Sekarang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
