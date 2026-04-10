import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin, CheckCircle, ArrowLeft, Users, Star, Car, Train,
  Accessibility, Wind, Wifi, ChevronDown, ChevronUp, Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masjidsApi, visitsApi } from "@/lib/api";
import type { MasjidDetail as MasjidDetailType, Review, PaginatedResponse, PrayerType } from "@/types";

const StarRating = ({
  rating,
  onRate,
  interactive = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
}) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-5 w-5 transition-colors ${
          i <= rating ? "text-accent fill-accent" : "text-muted-foreground/30"
        } ${interactive ? "cursor-pointer hover:text-accent" : ""}`}
        onClick={() => interactive && onRate?.(i)}
      />
    ))}
  </div>
);

const PRAYER_LABELS: Record<PrayerType, string> = {
  subuh: "Subuh", zohor: "Zohor", asar: "Asar",
  maghrib: "Maghrib", isyak: "Isyak", jumaat: "Jumaat",
  terawih: "Terawih", iftar: "Iftar", tahajjud: "Tahajjud", others: "Lain-lain",
};

const MasjidDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: masjid, isLoading, isError } = useQuery<MasjidDetailType>({
    queryKey: ["masjid", slug],
    queryFn: () => masjidsApi.get(slug!) as Promise<MasjidDetailType>,
    enabled: !!slug,
  });

  const { data: reviewsData } = useQuery<PaginatedResponse<Review>>({
    queryKey: ["masjid-reviews", masjid?.id],
    queryFn: () => masjidsApi.reviews(String(masjid!.id)) as Promise<PaginatedResponse<Review>>,
    enabled: !!masjid?.id,
  });

  const reviews = reviewsData?.items ?? [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const checkInMutation = useMutation({
    mutationFn: (prayerType: PrayerType) =>
      visitsApi.checkIn({
        masjidId: String(masjid!.id),
        prayerType,
        visitedAt: new Date().toISOString(),
        isRamadan: false,
      }),
    onSuccess: (_, prayerType) => {
      toast({ title: `${PRAYER_LABELS[prayerType]} direkodkan!`, description: `Kunjungan anda ke ${masjid?.name} telah disimpan.` });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
    onError: () => toast({ title: "Gagal merekod", description: "Sila cuba lagi.", variant: "destructive" }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => masjidsApi.verify(String(masjid!.id), "upvote"),
    onSuccess: () => {
      toast({ title: "Terima kasih!", description: "Pengesahan anda telah direkodkan." });
      queryClient.invalidateQueries({ queryKey: ["masjid", slug] });
    },
    onError: () => toast({ title: "Gagal mengesahkan", description: "Sila cuba lagi.", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      masjidsApi.addReview(String(masjid!.id), {
        rating: reviewForm.rating,
        comment: reviewForm.comment || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Review dihantar!", description: "Terima kasih atas sumbangan anda." });
      setReviewForm({ rating: 0, comment: "" });
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: ["masjid-reviews", masjid?.id] });
    },
    onError: () => toast({ title: "Gagal menghantar review", description: "Sila cuba lagi.", variant: "destructive" }),
  });

  const requireLogin = (action: string): boolean => {
    if (!user) {
      toast({ title: "Log masuk diperlukan", description: `Sila log masuk untuk ${action}.`, variant: "destructive" });
      navigate("/auth");
      return true;
    }
    return false;
  };

  const handleTrack = (type: PrayerType) => {
    if (requireLogin(`merekod ${PRAYER_LABELS[type]}`)) return;
    checkInMutation.mutate(type);
  };

  const handleVerify = () => {
    if (requireLogin("mengesahkan masjid")) return;
    verifyMutation.mutate();
  };

  const handleReviewSubmit = () => {
    if (requireLogin("menulis review")) return;
    if (reviewForm.rating === 0) {
      toast({ title: "Rating diperlukan", description: "Sila bagi rating bintang.", variant: "destructive" });
      return;
    }
    reviewMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        <Footer />
      </div>
    );
  }

  if (isError || !masjid) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-serif text-2xl font-bold">Masjid tidak dijumpai</h2>
          <Button asChild className="mt-4 rounded-xl"><Link to="/browse">Kembali ke senarai</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isVerified = masjid.status === "verified";
  const facilities = (masjid.facilities ?? {}) as Record<string, boolean>;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />Kembali ke senarai
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="h-64 md:h-80 rounded-2xl overflow-hidden bg-secondary flex items-center justify-center">
              {masjid.coverImageUrl ? (
                <img src={masjid.coverImageUrl} alt={masjid.name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <MapPin className="mx-auto h-16 w-16 text-muted-foreground/20" />
                  <p className="mt-2 text-sm text-muted-foreground">Belum ada gambar</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="font-serif text-3xl font-bold text-foreground">{masjid.name}</h1>
                {isVerified ? (
                  <Badge className="bg-accent text-accent-foreground gap-1 font-sans mt-1">
                    <CheckCircle className="h-3 w-3" /> Disahkan
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-sans mt-1">
                    Belum disahkan ({masjid.verificationCount}/3)
                  </Badge>
                )}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {masjid.address}, {masjid.city}, {masjid.state}
              </p>
              {masjid.averageRating != null && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={Math.round(masjid.averageRating)} />
                  <span className="text-sm font-semibold text-foreground">{masjid.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({masjid.reviewCount} review)</span>
                </div>
              )}
              {masjid.description && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{masjid.description}</p>
              )}
              {masjid.googleMapsUrl && (
                <a href={masjid.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Buka di Google Maps
                </a>
              )}
            </div>

            {/* Facilities Grid */}
            {Object.values(facilities).some(Boolean) && (
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Kemudahan & Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {facilities.aircond && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Wind className="h-4 w-4 text-primary" /><p className="font-medium text-foreground">Aircon</p>
                    </div>
                  )}
                  {facilities.wifi && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Wifi className="h-4 w-4 text-primary" /><p className="font-medium text-foreground">WiFi</p>
                    </div>
                  )}
                  {facilities.wheelchair && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Accessibility className="h-4 w-4 text-primary" />
                      <div><p className="font-medium text-foreground">Mesra OKU</p><p className="text-xs text-muted-foreground">Lift / kerusi roda</p></div>
                    </div>
                  )}
                  {facilities.sisterhood && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Users className="h-4 w-4 text-primary" /><p className="font-medium text-foreground">Ruang Wanita</p>
                    </div>
                  )}
                  {facilities.parking && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Car className="h-4 w-4 text-primary" /><p className="font-medium text-foreground">Ada Parking</p>
                    </div>
                  )}
                  {facilities.ablution && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <CheckCircle className="h-4 w-4 text-primary" /><p className="font-medium text-foreground">Tempat Wudhu</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold">Review Komuniti ({masjid.reviewCount})</h3>
                {user && (
                  <Button variant="outline" size="sm" className="rounded-lg text-xs"
                    onClick={() => setShowReviewForm(!showReviewForm)}>
                    Tulis Review
                  </Button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-6 rounded-xl border bg-background p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Rating anda</p>
                    <StarRating rating={reviewForm.rating}
                      onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} interactive />
                  </div>
                  <Textarea
                    placeholder="Kongsi pengalaman anda di masjid ni..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="rounded-xl bg-card min-h-[80px]"
                    maxLength={500}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleReviewSubmit} size="sm" className="rounded-lg"
                      disabled={reviewMutation.isPending}>
                      {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hantar Review"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)} className="rounded-lg">Batal</Button>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            U
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("ms-MY")}</p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <button onClick={() => setShowAllReviews(!showAllReviews)}
                      className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                      {showAllReviews
                        ? <><ChevronUp className="h-4 w-4" /> Tutup</>
                        : <><ChevronDown className="h-4 w-4" /> Lihat semua {reviews.length} review</>}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada review. Jadilah yang pertama!</p>
              )}

              {!user && (
                <p className="mt-4 text-xs text-muted-foreground">
                  <Link to="/auth" className="text-primary font-semibold hover:underline">Log masuk</Link>{" "}
                  untuk tulis review
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Statistik</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{masjid.visitCount}</p>
                    <p className="text-xs text-muted-foreground">Jumlah kunjungan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <CheckCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{masjid.verificationCount}/3</p>
                    <p className="text-xs text-muted-foreground">Pengesahan diterima</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Rekod Kunjungan</p>
              {(["zohor", "asar", "maghrib", "isyak", "jumaat", "terawih", "iftar"] as PrayerType[]).map((type, i) => (
                <Button key={type} onClick={() => handleTrack(type)}
                  variant={i === 0 ? "default" : "outline"}
                  className="w-full rounded-xl font-semibold py-5 text-sm"
                  disabled={checkInMutation.isPending}>
                  {PRAYER_LABELS[type]}
                </Button>
              ))}
            </div>

            {!isVerified && (
              <Button onClick={handleVerify} variant="outline"
                className="w-full rounded-xl text-accent border-accent/30 hover:bg-accent/10 font-semibold py-6"
                disabled={verifyMutation.isPending}>
                {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sahkan masjid ini betul"}
              </Button>
            )}

            {!user && (
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/auth" className="text-primary font-semibold hover:underline">Log masuk</Link>{" "}
                untuk merekod kunjungan
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MasjidDetail;
