import { Link } from "react-router-dom";
import { MapPin, Star, ArrowRight, Users, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MasjidCard from "@/components/MasjidCard";
import { useQuery } from "@tanstack/react-query";
import { masjidsApi } from "@/lib/api";
import type { PaginatedResponse, MasjidSummary } from "@/types";
import heroImage from "@/assets/hero-mosque.jpg";

const Index = () => {
  const { data, isLoading } = useQuery<PaginatedResponse<MasjidSummary>>({
    queryKey: ["masjids", "featured"],
    queryFn: () =>
      masjidsApi.list({ status: "verified", pageSize: 3 }) as Promise<
        PaginatedResponse<MasjidSummary>
      >,
  });

  const featuredMasjids = data?.items ?? [];
  const totalMasjids = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Masjid yang indah" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <Compass className="h-4 w-4" />
              <span>Jejak. Kongsi. Temui.</span>
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight text-primary-foreground md:text-6xl animate-fade-in-up">
              Jejaki setiap<br />
              <span className="text-accent">masjid</span> yang<br />
              anda kunjungi
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-foreground/80 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              Rekod masjid yang anda singgah, kongsi review dengan komuniti,
              dan temui masjid terbaik berdekatan anda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Button asChild size="lg" className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8">
                <Link to="/browse"><MapPin className="mr-2 h-5 w-5" />Cari Masjid</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 font-semibold text-base px-8">
                <Link to="/tracking">Jejak Saya<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card islamic-pattern">
        <div className="container mx-auto grid grid-cols-3 gap-4 px-4 py-8 text-center">
          <div>
            <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
              {isLoading ? "..." : totalMasjids}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Masjid Didaftarkan</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
              {isLoading ? "..." : featuredMasjids.reduce((s, m) => s + m.visitCount, 0) + "+"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Kunjungan Direkodkan</p>
          </div>
          <div>
            <p className="font-serif text-2xl font-bold text-primary md:text-3xl">
              {isLoading ? "..." : featuredMasjids.filter(m => m.status === "verified").length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Masjid Disahkan</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Macam mana ia berfungsi?</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">Tiga langkah mudah untuk mula menjejaki masjid anda</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Cari atau Tambah", description: "Cari masjid berdekatan atau tambah masjid baru yang anda kunjungi. Lengkapkan info fasiliti untuk bantu orang lain.", step: "01" },
            { icon: Star, title: "Review & Rekod", description: "Bagi rating, tulis review ringkas, dan rekod kunjungan anda. Bantu orang lain pilih masjid terbaik.", step: "02" },
            { icon: Users, title: "Sahkan & Kongsi", description: "Sahkan info masjid yang orang lain tambah. 3 pengesahan = Disahkan oleh komuniti!", step: "03" },
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

      <section className="bg-secondary/50 islamic-pattern">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Masjid Popular</h2>
              <p className="mt-2 text-muted-foreground">Paling banyak dikunjungi dan highest rated oleh komuniti</p>
            </div>
            <Button asChild variant="ghost" className="text-primary font-semibold">
              <Link to="/browse">Lihat semua<ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : featuredMasjids.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredMasjids.map((masjid) => <MasjidCard key={masjid.id} masjid={masjid} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada masjid disahkan. <Link to="/add" className="text-primary font-semibold hover:underline">Tambah yang pertama!</Link>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 md:p-12">
          <Compass className="mx-auto h-10 w-10 text-accent mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Masjid mana anda dah singgah?</h2>
          <p className="mt-3 text-muted-foreground">Mula rekod kunjungan masjid anda dan kongsi pengalaman dengan komuniti.</p>
          <Button asChild size="lg" className="mt-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
            <Link to="/browse">Mula Sekarang<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
