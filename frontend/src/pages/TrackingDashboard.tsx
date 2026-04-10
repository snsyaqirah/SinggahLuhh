import { useState } from "react";
import { Moon, Calendar, MapPin, TrendingUp, Trophy, Loader2, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { dashboardApi, checkinsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { VISIT_TYPE_LABELS, MALAYSIA_STATES } from "@/lib/constants";
import { Link, Navigate } from "react-router-dom";
import type { UserStats, VisitHistory, Visit } from "@/types";

const PRAYER_LABELS: Record<PrayerType, string> = {
  subuh: "Subuh", zohor: "Zohor", asar: "Asar",
  maghrib: "Maghrib", isyak: "Isyak", jumaat: "Jumaat",
  terawih: "Terawih", iftar: "Iftar", tahajjud: "Tahajjud", others: "Lain-lain",
};

const TrackingDashboard = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;

  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.stats(),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["checkins", "history"],
    queryFn: () => checkinsApi.history(),
  });

  const s = stats as UserStats | undefined;
  const h = history as VisitHistory | undefined;

  const visitDates = new Set((h?.visits ?? []).map((v: Visit) => v.visit_date?.split("T")[0]));

  // Longest streak (computed client-side from visit dates)
  const longestStreak = (() => {
    const sorted = [...visitDates].filter(Boolean).sort() as string[];
    let best = 0, cur = 0, prev: string | null = null;
    for (const d of sorted) {
      if (prev) {
        const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86_400_000;
        cur = diff === 1 ? cur + 1 : 1;
      } else {
        cur = 1;
      }
      if (cur > best) best = cur;
      prev = d;
    }
    return best;
  })();

  // Visit type breakdown
  const visitTypeCounts = (h?.visits ?? []).reduce((acc: Record<string, number>, v: Visit) => {
    acc[v.visit_type] = (acc[v.visit_type] ?? 0) + 1;
    return acc;
  }, {});
  const totalVisits = Object.values(visitTypeCounts).reduce((a, b) => a + b, 0);

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const MONTH_NAMES_MY = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];
  const DAY_NAMES_MY   = ["Ahd","Isn","Sel","Rab","Kha","Jum","Sab"];

  const prevMonth = () => setCalendarDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calYear, calMonth + 1, 1));
  const isCurrentMonth = calYear === new Date().getFullYear() && calMonth === new Date().getMonth();

  const isLoading = loadingStats || loadingHistory;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Jejak Saya</h1>
            <p className="mt-2 text-muted-foreground">
              Semua masjid yang anda dah kunjungi — passport masjid peribadi anda
            </p>
          </div>
          <Button asChild className="rounded-xl gap-2 hidden sm:flex">
            <Link to="/add">
              <PlusCircle className="h-4 w-4" />
              Tambah Masjid
            </Link>
          </Button>
        </div>
        {/* Mobile Tambah button */}
        <div className="mb-6 sm:hidden">
          <Button asChild className="w-full rounded-xl gap-2">
            <Link to="/add">
              <PlusCircle className="h-4 w-4" />
              Tambah Masjid
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-8">
              {[
                { label: "Jumlah Kunjungan",  value: s?.total_visits ?? 0,     icon: TrendingUp, color: "text-primary" },
                { label: "Masjid Dikunjungi",  value: h?.unique_masjids ?? 0,  icon: MapPin,     color: "text-accent" },
                { label: "Streak Sekarang",    value: h?.current_streak ?? 0,  icon: Calendar,   color: "text-primary" },
                { label: "Streak Terpanjang",  value: longestStreak,           icon: Trophy,     color: "text-accent" },
                { label: "Mata Reputasi",      value: s?.reputation_points ?? 0, icon: Trophy,   color: "text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border bg-card p-5">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  <p className="font-serif text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Badges / Passport */}
            {s?.badges && s.badges.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-accent" />
                  <h3 className="font-serif text-lg font-semibold">Pasport Masjid</h3>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {s.badges_earned}/{s.total_badges} badges
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {s.badges.map((ub) => (
                    <div key={ub.id} className="rounded-xl border bg-accent/10 border-accent/30 p-4 text-center">
                      <span className="text-xl">{ub.badge.icon}</span>
                      <p className="mt-1 text-sm font-semibold text-foreground">{ub.badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ub.badge.description}</p>
                      <Badge className="mt-2 bg-accent text-accent-foreground text-xs">Unlocked!</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar + Visit Type Breakdown — 2 col on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Activity Calendar */}
              <div className="rounded-2xl border bg-card p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-base font-semibold">Kalendar Aktiviti</h3>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={prevMonth} className="rounded-md p-1 hover:bg-secondary transition-colors" aria-label="Bulan sebelum">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[110px] text-center text-xs font-medium tabular-nums">
                    {MONTH_NAMES_MY[calMonth]} {calYear}
                  </span>
                  <button onClick={nextMonth} disabled={isCurrentMonth} className="rounded-md p-1 hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Bulan berikut">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Day name headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES_MY.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Leading empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasVisit = visitDates.has(dateStr);
                  const isToday = dateStr === new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={day}
                      title={hasVisit ? `${dateStr} — Ada check-in` : dateStr}
                      className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium transition-colors
                        ${hasVisit ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"}
                        ${isToday && !hasVisit ? "ring-1 ring-primary/50" : ""}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-primary inline-block" /> Ada check-in</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded ring-1 ring-primary/50 inline-block" /> Hari ini</span>
              </div>
            </div>

              {/* Visit Type Breakdown */}
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-serif text-base font-semibold">Pecahan Jenis Kunjungan</h3>
                </div>
                {totalVisits === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                    <MapPin className="h-8 w-8 opacity-20 mb-2" />
                    Belum ada kunjungan
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(visitTypeCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const pct = Math.round((count / totalVisits) * 100);
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-foreground">{VISIT_TYPE_LABELS[type] ?? type}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">{count}x · {pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    <p className="text-xs text-muted-foreground pt-1">Jumlah: {totalVisits} kunjungan</p>
                  </div>
                )}
              </div>
            </div>

            {/* Favourite Masjid */}
            {h?.favorite_masjid && (
              <div className="rounded-2xl border bg-card p-5 mb-8 flex items-center gap-3">
                <Moon className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Masjid Kegemaran</p>
                  <p className="font-semibold text-foreground">{h.favorite_masjid}</p>
                </div>
              </div>
            )}

            {/* Visit Log */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Rekod Kunjungan</h3>
              {(h?.visits ?? []).length === 0 ? (
                <div className="py-10 text-center">
                  <MapPin className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Belum ada check-in. <Link to="/browse" className="text-primary underline">Cari masjid</Link> untuk mula!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(h?.visits ?? []).map((visit: Visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between rounded-xl border bg-background p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {visit.visit_type.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{visit.masjid_name ?? "Masjid"}</p>
                          <p className="text-xs text-muted-foreground">{visit.visit_date?.split("T")[0]}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-sans text-xs">
                        {VISIT_TYPE_LABELS[visit.visit_type] ?? visit.visit_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default TrackingDashboard;
