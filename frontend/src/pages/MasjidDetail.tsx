import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
<<<<<<< HEAD
  MapPin, CheckCircle, ArrowLeft, Users, Star, Car, Train,
  Accessibility, Wind, Wifi, ChevronDown, ChevronUp, Loader2,
  ExternalLink,
} from "lucide-react";
=======
  MapPin, CheckCircle, ArrowLeft, Users, Wind, Cat,
  Utensils, ThumbsUp, ThumbsDown, Loader2, Moon, Camera,
  Flag, X, Plus, Trash2, Car, Droplets, BookOpen, AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
<<<<<<< HEAD
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
=======
import {
  masjidsApi, verificationsApi, checkinsApi, liveUpdatesApi,
  facilitiesApi, mediaApi, profileApi, ApiError,
} from "@/lib/api";
import type { MediaType } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Masjid, Facilities, LiveStatus, VerificationStatus } from "@/types";
import { toTitleCase } from "@/lib/utils";

const VISIT_TYPES = [
  { key: "general", label: "Solat" },
  { key: "jumaat", label: "Jumaat" },
  { key: "terawih", label: "Terawih" },
  { key: "iftar", label: "Iftar" },
  { key: "kuliah", label: "Kuliah" },
] as const;

const MEDIA_LABELS: Record<MediaType, string> = {
  main_photo: "Gambar Utama",
  interior_photo: "Dalaman",
  toilet_photo: "Tandas",
  qr_tng: "QR TNG",
  qr_duitnow: "QR DuitNow",
  masjid_board: "Papan Info",
};

const REPORT_TYPES = [
  { value: "does_not_exist", label: "Masjid ini tidak wujud" },
  { value: "wrong_location", label: "Lokasi salah" },
  { value: "duplicate", label: "Duplikat (sudah ada)" },
  { value: "wrong_info", label: "Maklumat tidak tepat" },
  { value: "inappropriate_content", label: "Kandungan tidak sesuai" },
  { value: "other", label: "Lain-lain" },
];

const defaultFacForm = {
  terawih_rakaat: "" as "" | "8" | "11" | "20" | "23",
  has_iftar: false,
  iftar_type: "" as string,
  cooling_system: "Kipas Biasa" as string,
  has_coway: false,
  kucing_count: "Tidak Pasti" as string,
  karpet_vibe: "" as string,
  parking_level: "" as string,
  has_parking_oku: false,
  has_parking_moto: true,
  has_kids_area: false,
  is_family_friendly: true,
  has_clean_telekung: false,
  telekung_rating: "" as string,
  wudhu_seating: false,
  toilet_cleanliness: "" as string,
  toilet_floor_condition: "" as string,
  is_tourist_friendly: false,
  has_tahfiz: false,
  has_library: false,
  near_bas: false,
  near_lrt: false,
  near_mrt: false,
};
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f

const PRAYER_LABELS: Record<PrayerType, string> = {
  subuh: "Subuh", zohor: "Zohor", asar: "Asar",
  maghrib: "Maghrib", isyak: "Isyak", jumaat: "Jumaat",
  terawih: "Terawih", iftar: "Iftar", tahajjud: "Tahajjud", others: "Lain-lain",
};

const MasjidDetail = () => {
<<<<<<< HEAD
  const { slug } = useParams<{ slug: string }>();
=======
  const { id: slug } = useParams<{ id: string }>();
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

<<<<<<< HEAD
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
=======
  const [checkingIn, setCheckingIn] = useState(false);
  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  // Downvote reason dialog
  const [downvoteOpen, setDownvoteOpen] = useState(false);
  const [downvoteReason, setDownvoteReason] = useState("");
  // Media dialog
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("main_photo");
  const [qrConfirmed, setQrConfirmed] = useState(false);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Facilities sheet
  const [facOpen, setFacOpen] = useState(false);
  const [facForm, setFacForm] = useState(defaultFacForm);
  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ── queries ───────────────────────────────────────────────────
  const { data: masjid, isLoading, isError } = useQuery({
    queryKey: ["masjid", slug],
    queryFn: () => masjidsApi.get(slug!),
    enabled: !!slug,
  });

  const { data: liveStatus } = useQuery({
    queryKey: ["liveStatus", slug],
    queryFn: () => liveUpdatesApi.getStatus(masjid?.id ?? slug!),
    enabled: !!masjid?.id,
  });

  const { data: verifyStatus, refetch: refetchVerify } = useQuery({
    queryKey: ["verifyStatus", slug],
    queryFn: () => verificationsApi.getStatus(masjid?.id ?? slug!),
    enabled: !!masjid?.id,
  });

  const { data: facilitiesData, refetch: refetchFacilities } = useQuery({
    queryKey: ["facilities", slug],
    queryFn: () => facilitiesApi.get(masjid!.id),
    enabled: !!masjid?.id,
  });

  const { data: mediaItems, refetch: refetchMedia } = useQuery({
    queryKey: ["media", slug],
    queryFn: () => mediaApi.get(masjid!.id),
    enabled: !!masjid?.id,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.get(),
    enabled: !!user,
  });

  // ── mutations ─────────────────────────────────────────────────
  const voteMutation = useMutation({
    mutationFn: (payload: { voteType: "upvote" | "downvote"; reason?: string }) =>
      verificationsApi.vote({ masjidId: masjid!.id, voteType: payload.voteType, reason: payload.reason }),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["verifyStatus", slug] });
      const previous = queryClient.getQueryData(["verifyStatus", slug]);

      queryClient.setQueryData(["verifyStatus", slug], (old: VerificationStatus | undefined) => {
        if (!old) return old;
        const wasThisVote = old.user_vote_type === payload.voteType;
        const hadVote = old.user_has_voted;
        const wasUpvote = old.user_vote_type === "upvote";
        const isUpvote = payload.voteType === "upvote";

        // Toggle off (same vote tapped again)
        if (wasThisVote) {
          return {
            ...old,
            user_has_voted: false,
            user_vote_type: null,
            verification_count: isUpvote ? Math.max(0, old.verification_count - 1) : old.verification_count,
          };
        }
        // Switching vote type
        if (hadVote) {
          return {
            ...old,
            user_vote_type: payload.voteType,
            verification_count: wasUpvote
              ? Math.max(0, old.verification_count - 1)  // was upvote → now downvote
              : old.verification_count + 1,              // was downvote → now upvote
          };
        }
        // New vote
        return {
          ...old,
          user_has_voted: true,
          user_vote_type: payload.voteType,
          verification_count: isUpvote ? old.verification_count + 1 : old.verification_count,
        };
      });

      return { previous };
    },

    onSuccess: (data, variables) => {
      // Use the server's authoritative count to patch the cache — no refetch needed
      const res = data as { newVerificationCount: number; newStatus: string } | undefined;
      if (res?.newVerificationCount !== undefined) {
        queryClient.setQueryData(["verifyStatus", slug], (old: VerificationStatus | undefined) =>
          old ? { ...old, verification_count: res.newVerificationCount, status: res.newStatus ?? old.status } : old
        );
      }
      // Still refresh the masjid card (status badge etc.)
      queryClient.invalidateQueries({ queryKey: ["masjid", slug] });

      if (variables.voteType === "downvote") {
        setReportType("wrong_info");
        setReportDesc(variables.reason ?? "");
        setReportOpen(true);
      } else {
        toast({ title: "Terima kasih!", description: "Pengesahan anda direkodkan." });
      }
    },

    onError: (e, _, ctx) => {
      // Roll back the optimistic update
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(["verifyStatus", slug], ctx.previous);
      }
      toast({ title: "Gagal", description: e instanceof ApiError ? e.message : "Cuba lagi.", variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      verificationsApi.report({ masjidId: masjid!.id, reportType, description: reportDesc }),
    onSuccess: () => {
      toast({ title: "Laporan dihantar", description: "Terima kasih. Kami akan semak." });
      setReportOpen(false);
      setReportType(""); setReportDesc("");
    },
    onError: (e) => {
      toast({ title: "Gagal hantar laporan", description: e instanceof ApiError ? e.message : "Cuba lagi.", variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    // Reset so the same file can be re-selected if needed
    e.target.value = "";
  };

  const mediaMutation = useMutation({
    mutationFn: () => {
      if (!mediaFile) throw new Error("Sila pilih gambar terlebih dahulu");
      return mediaApi.upload(masjid!.id, mediaFile, mediaType);
    },
    onSuccess: () => {
      toast({ title: "Gambar ditambah! 📸" });
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
      setMediaOpen(false); setMediaFile(null); setMediaPreview(""); setMediaType("main_photo"); setQrConfirmed(false);
      refetchMedia();
    },
    onError: (e) => {
      toast({ title: "Gagal tambah gambar", description: e instanceof ApiError ? e.message : "Cuba lagi.", variant: "destructive" });
    },
  });

  const mediaDeleteMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.remove(masjid!.id, mediaId),
    onSuccess: () => { refetchMedia(); toast({ title: "Gambar dipadam" }); },
  });

  const facMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        has_iftar: facForm.has_iftar,
        has_coway: facForm.has_coway,
        has_kids_area: facForm.has_kids_area,
        is_family_friendly: facForm.is_family_friendly,
        has_parking_oku: facForm.has_parking_oku,
        has_parking_moto: facForm.has_parking_moto,
        has_clean_telekung: facForm.has_clean_telekung,
        wudhu_seating: facForm.wudhu_seating,
        is_tourist_friendly: facForm.is_tourist_friendly,
        has_tahfiz: facForm.has_tahfiz,
        has_library: facForm.has_library,
        near_bas: facForm.near_bas,
        near_lrt: facForm.near_lrt,
        near_mrt: facForm.near_mrt,
      };
      if (facForm.terawih_rakaat) payload.terawih_rakaat = parseInt(facForm.terawih_rakaat);
      if (facForm.has_iftar && facForm.iftar_type) payload.iftar_type = facForm.iftar_type;
      if (facForm.cooling_system) payload.cooling_system = facForm.cooling_system;
      if (facForm.kucing_count) payload.kucing_count = facForm.kucing_count;
      if (facForm.karpet_vibe) payload.karpet_vibe = facForm.karpet_vibe;
      if (facForm.parking_level) payload.parking_level = facForm.parking_level;
      if (facForm.has_clean_telekung && facForm.telekung_rating) payload.telekung_rating = facForm.telekung_rating;
      if (facForm.toilet_cleanliness) payload.toilet_cleanliness = facForm.toilet_cleanliness;
      if (facForm.toilet_floor_condition) payload.toilet_floor_condition = facForm.toilet_floor_condition;

      const hasExisting = !!(facilitiesData);
      return hasExisting
        ? facilitiesApi.update(masjid!.id, payload)
        : facilitiesApi.create(masjid!.id, payload);
    },
    onSuccess: () => {
      toast({ title: "Kemudahan disimpan! ✨", description: "+10 mata reputasi." });
      setFacOpen(false);
      queryClient.invalidateQueries({ queryKey: ["masjid", slug] });
      refetchFacilities();
    },
    onError: (e) => {
      toast({ title: "Gagal simpan kemudahan", description: e instanceof ApiError ? e.message : "Cuba lagi.", variant: "destructive" });
    },
  });

  const deleteMasjidMutation = useMutation({
    mutationFn: () => masjidsApi.remove(masjid!.id),
    onSuccess: () => {
      toast({ title: "Masjid dipadam", description: "Rekod masjid ini telah dipadam." });
      navigate("/browse");
    },
    onError: (e) => {
      toast({ title: "Gagal padam", description: e instanceof ApiError ? e.message : "Cuba lagi.", variant: "destructive" });
    },
  });

  // ── check in ──────────────────────────────────────────────────
  const handleCheckIn = async (visitType: string) => {
    if (!user) { toast({ title: "Log masuk diperlukan", variant: "destructive" }); navigate("/auth"); return; }
    if (!navigator.geolocation) {
      toast({ title: "GPS tidak disokong", variant: "destructive" }); return;
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
    }
    setCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await checkinsApi.checkIn({
            masjidId: masjid!.id, visitType,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }) as { streak_count?: number; points_earned?: number };
          toast({
            title: `Check-in berjaya! 🎉`,
            description: `+${result.points_earned ?? 0} mata. Streak: ${result.streak_count ?? 0} hari.`,
          });
          queryClient.invalidateQueries({ queryKey: ["checkins"] });
        } catch (e) {
          const msg = e instanceof ApiError ? e.message : "Gagal check-in. Pastikan anda berada dalam 200m dari masjid.";
          toast({ title: "Gagal check-in", description: msg, variant: "destructive" });
        } finally { setCheckingIn(false); }
      },
      () => { toast({ title: "GPS diperlukan", description: "Sila benarkan akses GPS.", variant: "destructive" }); setCheckingIn(false); }
    );
  };

<<<<<<< HEAD
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
=======
  const handleVote = (type: "upvote" | "downvote") => {
    if (!user) { toast({ title: "Log masuk diperlukan", variant: "destructive" }); navigate("/auth"); return; }
    if (type === "downvote") {
      setDownvoteReason("");
      setDownvoteOpen(true);
      return;
    }
    voteMutation.mutate({ voteType: type });
  };

  const openFacSheet = () => {
    const f = (facilitiesData as Facilities | null) ?? null;
    if (f) {
      setFacForm({
        terawih_rakaat: f.terawih_rakaat ? String(f.terawih_rakaat) as "8" | "11" | "20" | "23" : "",
        has_iftar: f.has_iftar ?? false,
        iftar_type: f.iftar_type ?? "",
        cooling_system: f.cooling_system ?? "Kipas Biasa",
        has_coway: f.has_coway ?? false,
        kucing_count: f.kucing_count ?? "Tidak Pasti",
        karpet_vibe: f.karpet_vibe ?? "",
        parking_level: f.parking_level ?? "",
        has_parking_oku: f.has_parking_oku ?? false,
        has_parking_moto: f.has_parking_moto ?? true,
        has_kids_area: f.has_kids_area ?? false,
        is_family_friendly: f.is_family_friendly ?? true,
        has_clean_telekung: f.has_clean_telekung ?? false,
        telekung_rating: f.telekung_rating ?? "",
        wudhu_seating: f.wudhu_seating ?? false,
        toilet_cleanliness: f.toilet_cleanliness ?? "",
        toilet_floor_condition: f.toilet_floor_condition ?? "",
        is_tourist_friendly: f.is_tourist_friendly ?? false,
        has_tahfiz: f.has_tahfiz ?? false,
        has_library: f.has_library ?? false,
        near_bas: f.near_bas ?? false,
        near_lrt: f.near_lrt ?? false,
        near_mrt: f.near_mrt ?? false,
      });
    } else {
      setFacForm(defaultFacForm);
    }
    setFacOpen(true);
  };

  // ── loading / error states ────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    <Footer /></div>
  );

  if (isError || !masjid) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold">Masjid tidak dijumpai</h2>
        <Button asChild className="mt-4 rounded-xl"><Link to="/browse">Kembali ke senarai</Link></Button>
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
      </div>
    <Footer /></div>
  );

<<<<<<< HEAD
  const isVerified = masjid.status === "verified";
  const facilities = (masjid.facilities ?? {}) as Record<string, boolean>;
=======
  const m = masjid as unknown as Masjid;
  const f = (facilitiesData as Facilities | null) ?? null;
  const isVerified = m.status === "verified";
  const canDelete = !!user && (user.id === m.created_by || !!(myProfile as { is_admin?: boolean } | null)?.is_admin);
  const live = liveStatus as LiveStatus | undefined;
  const photos = (mediaItems ?? []).filter((i) => ["main_photo", "interior_photo", "toilet_photo"].includes(i.mediaType));
  const allQrItems = (mediaItems ?? []).filter((i) => ["qr_tng", "qr_duitnow", "masjid_board"].includes(i.mediaType));
  // Only show verified QRs to public; uploader can see their own pending ones
  const qrItems = allQrItems.filter((i) => i.isVerified || i.createdBy === user?.id);
  const pendingQrCount = allQrItems.filter((i) => !i.isVerified && i.createdBy === user?.id).length;
  const mainPhoto = photos.find((i) => i.mediaType === "main_photo");
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
<<<<<<< HEAD
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />Kembali ke senarai
=======
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Kembali ke senarai
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6">
<<<<<<< HEAD
            {/* Image */}
            <div className="h-64 md:h-80 rounded-2xl overflow-hidden bg-secondary flex items-center justify-center">
              {masjid.coverImageUrl ? (
                <img src={masjid.coverImageUrl} alt={masjid.name} className="h-full w-full object-cover" />
=======
            {/* Photo / hero */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-secondary">
              {mainPhoto ? (
                <img src={mainPhoto.url} alt={m.name} className="h-full w-full object-cover" />
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <Moon className="h-16 w-16 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Belum ada gambar</p>
                </div>
              )}
              {user && (
                <button
                  onClick={() => setMediaOpen(true)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" /> Tambah Gambar
                </button>
              )}
            </div>

            {/* Extra photos */}
            {photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {photos.map((p) => (
                  <div key={p.id} className="relative flex-shrink-0 group">
                    <img src={p.url} alt={MEDIA_LABELS[p.mediaType as MediaType]} className="h-20 w-32 rounded-xl object-cover border" />
                    {p.createdBy === user?.id && (
                      <button
                        onClick={() => mediaDeleteMutation.mutate(p.id)}
                        className="absolute top-1 right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-1">{MEDIA_LABELS[p.mediaType as MediaType]}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <div>
              <div className="flex items-start gap-3 flex-wrap">
<<<<<<< HEAD
                <h1 className="font-serif text-3xl font-bold text-foreground">{masjid.name}</h1>
=======
                <h1 className="font-serif text-3xl font-bold text-foreground">{toTitleCase(m.name)}</h1>
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
                {isVerified ? (
                  <Badge className="bg-accent text-accent-foreground gap-1 font-sans mt-1">
                    <CheckCircle className="h-3 w-3" /> Disahkan
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-sans mt-1">
<<<<<<< HEAD
                    Belum disahkan ({masjid.verificationCount}/3)
=======
                    Belum disahkan ({(verifyStatus as VerificationStatus | undefined)?.verification_count ?? m.verification_count}/3)
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
                  </Badge>
                )}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
<<<<<<< HEAD
                <MapPin className="h-4 w-4" /> {masjid.address}, {masjid.city}, {masjid.state}
              </p>
              {masjid.averageRating != null && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={Math.round(masjid.averageRating)} />
                  <span className="text-sm font-semibold text-foreground">{masjid.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({masjid.reviewCount} review)</span>
                </div>
=======
                <MapPin className="h-4 w-4" /> {m.address}
              </p>
              {m.description && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.description}</p>
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
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

<<<<<<< HEAD
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
=======
            {/* Live Status */}
            {live && (live.crowd_level || live.saf_status || live.parking_status || live.iftar_menu) && (
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-serif text-lg font-semibold mb-3">Status Terkini</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {live.crowd_level && <div className="rounded-xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Kepadatan</p><p className="font-medium">{live.crowd_level}</p></div>}
                  {live.saf_status && <div className="rounded-xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Status Saf</p><p className="font-medium">{live.saf_status}</p></div>}
                  {live.parking_status && <div className="rounded-xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Parking</p><p className="font-medium">{live.parking_status}</p></div>}
                  {live.iftar_menu && <div className="rounded-xl bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Menu Iftar</p><p className="font-medium">{live.iftar_menu}</p></div>}
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
                </div>
              </div>
            )}

            {/* Facilities */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
<<<<<<< HEAD
                <h3 className="font-serif text-lg font-semibold">Review Komuniti ({masjid.reviewCount})</h3>
                {user && (
                  <Button variant="outline" size="sm" className="rounded-lg text-xs"
                    onClick={() => setShowReviewForm(!showReviewForm)}>
                    Tulis Review
=======
                <h3 className="font-serif text-lg font-semibold">Kemudahan & Info</h3>
                {user && (
                  <Button variant="outline" size="sm" onClick={openFacSheet} className="rounded-lg gap-2 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    {f ? "Kemaskini" : "Tambah Kemudahan"}
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
                  </Button>
                )}
              </div>

<<<<<<< HEAD
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
=======
              {!f ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">Belum ada maklumat kemudahan.</p>
                  {user ? (
                    <Button variant="ghost" size="sm" onClick={openFacSheet} className="mt-3 text-primary gap-1">
                      <Plus className="h-4 w-4" /> Jadi yang pertama tambah!
                    </Button>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Link to="/auth" className="text-primary underline">Log masuk</Link> untuk tambah kemudahan
                    </p>
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {f.has_iftar && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Utensils className="h-4 w-4 text-primary flex-shrink-0" />
                      <div><p className="font-medium">Iftar</p>{f.iftar_type && <p className="text-xs text-muted-foreground">{f.iftar_type}</p>}</div>
                    </div>
                  )}
                  {f.terawih_rakaat && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Moon className="h-4 w-4 text-primary flex-shrink-0" />
                      <div><p className="font-medium">Terawih</p><p className="text-xs text-muted-foreground">{f.terawih_rakaat} rakaat</p></div>
                    </div>
                  )}
                  {f.cooling_system && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Wind className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium">{f.cooling_system}</p>
                    </div>
                  )}
                  {f.kucing_count && f.kucing_count !== "Takda" && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Cat className="h-4 w-4 text-primary flex-shrink-0" />
                      <div><p className="font-medium">Kucing</p><p className="text-xs text-muted-foreground">{f.kucing_count}</p></div>
                    </div>
                  )}
                  {f.karpet_vibe && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🕌</span>
                      <div><p className="font-medium">Karpet</p><p className="text-xs text-muted-foreground">{f.karpet_vibe}</p></div>
                    </div>
                  )}
                  {f.parking_level && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Car className="h-4 w-4 text-primary flex-shrink-0" />
                      <div><p className="font-medium">Parking</p><p className="text-xs text-muted-foreground">{f.parking_level}</p></div>
                    </div>
                  )}
                  {f.toilet_cleanliness && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Droplets className="h-4 w-4 text-primary flex-shrink-0" />
                      <div><p className="font-medium">Tandas</p><p className="text-xs text-muted-foreground">{f.toilet_cleanliness}</p></div>
                    </div>
                  )}
                  {f.has_clean_telekung && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🧕</span>
                      <div>
                        <p className="font-medium">Telekung</p>
                        {f.telekung_rating && <p className="text-xs text-muted-foreground">{f.telekung_rating}</p>}
                      </div>
                    </div>
                  )}
                  {f.is_family_friendly && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Users className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium">Mesra Keluarga</p>
                    </div>
                  )}
                  {f.has_kids_area && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <Users className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium">Ruang Kanak-kanak</p>
                    </div>
                  )}
                  {f.has_coway && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">💧</span>
                      <p className="font-medium">Ada Coway</p>
                    </div>
                  )}
                  {f.wudhu_seating && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🪑</span>
                      <p className="font-medium">Wudhu Duduk</p>
                    </div>
                  )}
                  {f.has_tahfiz && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium">Ada Tahfiz</p>
                    </div>
                  )}
                  {f.has_library && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium">Ada Perpustakaan</p>
                    </div>
                  )}
                  {f.is_tourist_friendly && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🌍</span>
                      <p className="font-medium">Mesra Pelancong</p>
                    </div>
                  )}
                  {f.has_parking_moto && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🏍️</span>
                      <p className="font-medium">Parking Moto</p>
                    </div>
                  )}
                  {f.has_parking_oku && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">♿</span>
                      <p className="font-medium">Parking OKU</p>
                    </div>
                  )}
                  {f.near_bas && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🚌</span>
                      <p className="font-medium">Berhampiran Bas</p>
                    </div>
                  )}
                  {f.near_lrt && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🚇</span>
                      <p className="font-medium">Berhampiran LRT</p>
                    </div>
                  )}
                  {f.near_mrt && (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
                      <span className="text-base">🚊</span>
                      <p className="font-medium">Berhampiran MRT</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QR / Documents */}
            {qrItems.length > 0 && (
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="font-serif text-lg font-semibold mb-1">QR & Papan Info</h3>
                <p className="text-xs text-muted-foreground mb-4">Sila semak QR dengan teliti sebelum scan. JejakMasjid tidak bertanggungjawab atas sebarang transaksi.</p>
                <div className="flex gap-3 flex-wrap">
                  {qrItems.map((q) => (
                    <div key={q.id} className="text-center relative">
                      {!q.isVerified ? (
                        <div className="h-24 w-24 rounded-xl border border-dashed border-amber-400 bg-amber-50 flex flex-col items-center justify-center gap-1">
                          <span className="text-lg">🕐</span>
                          <p className="text-xs text-amber-700 font-medium">Menunggu<br/>semakan</p>
                        </div>
                      ) : (
                        <img src={q.url} alt={MEDIA_LABELS[q.mediaType as MediaType]} className="h-24 w-24 rounded-xl object-contain border" />
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{MEDIA_LABELS[q.mediaType as MediaType]}</p>
                    </div>
                  ))}
                </div>
                {pendingQrCount > 0 && (
                  <p className="text-xs text-amber-600 mt-3">⏳ {pendingQrCount} QR anda sedang menunggu semakan admin.</p>
                )}
              </div>
            )}

            {/* Upvote / Downvote */}
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-serif text-lg font-semibold mb-2">Ada kat sini? Sahkan!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pernah pergi masjid ni? Bantu komuniti dengan sahkan info ini betul.
                3 pengesahan = Disahkan!
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-accent/40 text-accent hover:bg-accent/10"
                  onClick={() => handleVote("upvote")}
                  disabled={voteMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4" /> Betul ({(verifyStatus as VerificationStatus | undefined)?.verification_count ?? m.verification_count})
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 gap-2 ${
                    (verifyStatus as VerificationStatus | undefined)?.user_vote_type === "downvote"
                      ? "border-destructive text-destructive"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => handleVote("downvote")}
                  disabled={voteMutation.isPending}
                >
                  <ThumbsDown className="h-4 w-4" /> Info salah
                </Button>
              </div>
              {!user && (
                <p className="mt-3 text-xs text-muted-foreground text-center">
                  <Link to="/auth" className="text-primary font-semibold hover:underline">Log masuk</Link>{" "}untuk mengesahkan
                </p>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Statistik</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
<<<<<<< HEAD
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{masjid.visitCount}</p>
                    <p className="text-xs text-muted-foreground">Jumlah kunjungan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
=======
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <CheckCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{(verifyStatus as VerificationStatus | undefined)?.verification_count ?? m.verification_count}/3</p>
                    <p className="text-xs text-muted-foreground">Pengesahan diterima</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in */}
            <div className="rounded-2xl border bg-card p-4 space-y-2">
<<<<<<< HEAD
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
=======
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Check-in (GPS diperlukan)
              </p>
              {checkingIn ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                VISIT_TYPES.map((v) => (
                  <Button
                    key={v.key}
                    onClick={() => handleCheckIn(v.key)}
                    variant={v.key === "general" ? "default" : "outline"}
                    className="w-full rounded-xl font-semibold py-5 text-sm"
                  >
                    {v.label}
                  </Button>
                ))
              )}
              {!user && (
                <p className="text-center text-xs text-muted-foreground pt-1">
                  <Link to="/auth" className="text-primary font-semibold hover:underline">Log masuk</Link>{" "}untuk check-in
                </p>
              )}
            </div>

            {/* Report */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportOpen(true)}
                className="w-full gap-2 text-muted-foreground hover:text-destructive justify-start px-4"
              >
                <Flag className="h-4 w-4" /> Laporkan Masjid Ini
>>>>>>> 35a3747b3cf3c50ade4e5d6783d1170fc0589f8f
              </Button>
            )}

            {/* Delete (owner / admin only) */}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="w-full gap-2 text-destructive/70 hover:text-destructive justify-start px-4"
              >
                <Trash2 className="h-4 w-4" /> Padam Masjid Ini
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Downvote Reason Dialog ── */}
      <Dialog open={downvoteOpen} onOpenChange={setDownvoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kenapa info ini salah?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Sebab</Label>
            <Textarea
              value={downvoteReason}
              onChange={(e) => setDownvoteReason(e.target.value)}
              placeholder="Contoh: Alamat tidak tepat, masjid dah tutup, nama salah..."
              className="mt-1.5 rounded-xl min-h-[100px]"
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">Minimum 10 aksara</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownvoteOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={downvoteReason.trim().length < 10 || voteMutation.isPending}
              onClick={() => {
                voteMutation.mutate({ voteType: "downvote", reason: downvoteReason.trim() });
                setDownvoteOpen(false);
              }}
            >
              {voteMutation.isPending ? "Menghantar..." : "Hantar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Report Dialog ── */}
      <Dialog open={reportOpen} onOpenChange={(open) => { setReportOpen(open); if (!open) { setReportType(""); setReportDesc(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Laporkan Masalah</DialogTitle>
            {reportType === "wrong_info" && reportDesc && (
              <p className="text-sm text-muted-foreground pt-1">
                Undi anda direkod. Semak butiran laporan di bawah dan hantar untuk makluman admin.
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Jenis Masalah</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue placeholder="Pilih jenis masalah..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Penerangan</Label>
              <Textarea
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Terangkan masalah dengan lebih lanjut... (min 10 aksara)"
                className="mt-1.5 rounded-xl min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => reportMutation.mutate()}
              disabled={!reportType || reportDesc.length < 10 || reportMutation.isPending}
            >
              {reportMutation.isPending ? "Menghantar..." : "Hantar Laporan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Media Dialog ── */}
      <Dialog open={mediaOpen} onOpenChange={(o) => {
        setMediaOpen(o);
        if (!o) {
          if (mediaPreview) URL.revokeObjectURL(mediaPreview);
          setMediaFile(null); setMediaPreview(""); setMediaType("main_photo"); setQrConfirmed(false); setPhotoConfirmed(false);
        }
      }}>
        <DialogContent className="max-w-md flex flex-col gap-0 p-0 max-h-[90dvh]">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Tambah Gambar / QR</DialogTitle>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            <div>
              <Label>Jenis</Label>
              <Select value={mediaType} onValueChange={(v) => { setMediaType(v as MediaType); setQrConfirmed(false); setPhotoConfirmed(false); }}>
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDIA_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* QR-specific warning */}
            {(mediaType === "qr_tng" || mediaType === "qr_duitnow") && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-destructive">Amaran Keselamatan — QR Code</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      QR palsu boleh menyebabkan orang tertipu. Semua QR yang dihantar akan disemak oleh admin sebelum dipaparkan. Akaun yang menghantar QR tidak sah akan diblok.
                    </p>
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox
                    checked={qrConfirmed}
                    onCheckedChange={(c) => setQrConfirmed(!!c)}
                    className="mt-0.5"
                  />
                  <span className="text-xs font-medium">
                    Saya sahkan ini adalah QR rasmi masjid ini dan bukan QR peribadi atau pihak lain.
                  </span>
                </label>
              </div>
            )}

            {/* File picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-secondary/30 p-6 flex flex-col items-center gap-3"
            >
              {mediaPreview ? (
                <img src={mediaPreview} alt="preview" className="max-h-56 rounded-xl object-contain" />
              ) : (
                <>
                  <Camera className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium">Pilih dari Galeri / Ambil Gambar</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP • Maks 5MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            {mediaFile && (
              <p className="text-xs text-muted-foreground text-center truncate">{mediaFile.name}</p>
            )}

            {/* Photo declaration for non-QR types */}
            {mediaType !== "qr_tng" && mediaType !== "qr_duitnow" && (
              <label className="flex items-start gap-2 cursor-pointer rounded-xl border bg-secondary/30 p-3">
                <Checkbox
                  checked={photoConfirmed}
                  onCheckedChange={(c) => setPhotoConfirmed(!!c)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-xs">
                  Saya sahkan gambar ini adalah gambar <strong>bahagian masjid</strong> yang berkenaan, bukan gambar peribadi, makanan, atau kandungan lain.
                </span>
              </label>
            )}

            {(mediaType === "qr_tng" || mediaType === "qr_duitnow") && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                🕐 QR akan disemak admin dahulu sebelum dipaparkan kepada pengguna lain.
              </p>
            )}
          </div>

          {/* Sticky footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={() => setMediaOpen(false)}>Batal</Button>
            <Button
              onClick={() => mediaMutation.mutate()}
              disabled={
                !mediaFile ||
                mediaMutation.isPending ||
                ((mediaType === "qr_tng" || mediaType === "qr_duitnow") ? !qrConfirmed : !photoConfirmed)
              }
            >
              {mediaMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memuat naik...</> : "Hantar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Facilities Sheet ── */}
      <Sheet open={facOpen} onOpenChange={setFacOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif">{f ? "Kemaskini Kemudahan" : "Tambah Kemudahan"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            {/* Terawih */}
            <div>
              <Label className="font-semibold">Terawih (berapa rakaat?)</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(["", "8", "11", "20", "23"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFacForm((f) => ({ ...f, terawih_rakaat: r }))}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-colors border ${facForm.terawih_rakaat === r ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-transparent"}`}
                  >
                    {r === "" ? "Tiada" : `${r} rakaat`}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooling */}
            <div>
              <Label className="font-semibold">Sistem Penyejukan</Label>
              <Select value={facForm.cooling_system} onValueChange={(v) => setFacForm((f) => ({ ...f, cooling_system: v }))}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Full AC / Sejuk Gila", "AC Sebahagian", "Kipas Gergasi (HVLS)", "Kipas Biasa", "Panas"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kucing */}
            <div>
              <Label className="font-semibold">Kucing 🐱</Label>
              <Select value={facForm.kucing_count} onValueChange={(v) => setFacForm((f) => ({ ...f, kucing_count: v }))}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Banyak / Kucing Friendly", "Ada Seekor Oren", "Ada Sikit", "Takda", "Tidak Pasti"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Karpet */}
            <div>
              <Label className="font-semibold">Karpet Vibe</Label>
              <Select value={facForm.karpet_vibe} onValueChange={(v) => setFacForm((f) => ({ ...f, karpet_vibe: v }))}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {["Tebal / Selesa", "Standard", "Nipis", "Sajadah Sendiri"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parking */}
            <div>
              <Label className="font-semibold">Tahap Parking</Label>
              <Select value={facForm.parking_level} onValueChange={(v) => setFacForm((f) => ({ ...f, parking_level: v }))}>
                <SelectTrigger className="mt-2 rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {["Senang", "Sederhana", "Susah / Double Park"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toilet */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold text-sm">Kebersihan Tandas</Label>
                <Select value={facForm.toilet_cleanliness} onValueChange={(v) => setFacForm((f) => ({ ...f, toilet_cleanliness: v }))}>
                  <SelectTrigger className="mt-2 rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {["Bersih", "Sederhana", "Kurang Bersih"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-semibold text-sm">Lantai Tandas</Label>
                <Select value={facForm.toilet_floor_condition} onValueChange={(v) => setFacForm((f) => ({ ...f, toilet_floor_condition: v }))}>
                  <SelectTrigger className="mt-2 rounded-xl"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {["Kering", "Licin", "Basah"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Iftar */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={facForm.has_iftar}
                  onCheckedChange={(c) => setFacForm((f) => ({ ...f, has_iftar: !!c }))}
                />
                <span className="font-semibold text-sm">Ada Iftar</span>
              </label>
              {facForm.has_iftar && (
                <Select value={facForm.iftar_type} onValueChange={(v) => setFacForm((f) => ({ ...f, iftar_type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Jenis iftar..." /></SelectTrigger>
                  <SelectContent>
                    {["Nasi Kotak", "Talam", "Buffet", "Bawa Sendiri", "Tidak Pasti"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Telekung */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={facForm.has_clean_telekung}
                  onCheckedChange={(c) => setFacForm((f) => ({ ...f, has_clean_telekung: !!c }))}
                />
                <span className="font-semibold text-sm">Ada Telekung Bersih 🧕</span>
              </label>
              {facForm.has_clean_telekung && (
                <Select value={facForm.telekung_rating} onValueChange={(v) => setFacForm((f) => ({ ...f, telekung_rating: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kualiti telekung..." /></SelectTrigger>
                  <SelectContent>
                    {["Banyak & Bersih", "Ada Tapi Sikit", "Bawa Sendiri"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Boolean checkboxes */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "has_coway", label: "Ada Coway 💧" },
                { key: "wudhu_seating", label: "Wudhu Boleh Duduk 🪑" },
                { key: "has_kids_area", label: "Ruang Kanak-kanak" },
                { key: "has_parking_moto", label: "Parking Moto 🏍️" },
                { key: "has_parking_oku", label: "Parking OKU ♿" },
                { key: "near_bas", label: "Berhampiran Bas 🚌" },
                { key: "near_lrt", label: "Berhampiran LRT 🚇" },
                { key: "near_mrt", label: "Berhampiran MRT 🚊" },
                { key: "is_family_friendly", label: "Mesra Keluarga 👨‍👩‍👦" },
                { key: "is_tourist_friendly", label: "Mesra Pelancong 🌍" },
                { key: "has_tahfiz", label: "Ada Tahfiz 📖" },
                { key: "has_library", label: "Ada Perpustakaan 📚" },
              ] as { key: keyof typeof facForm; label: string }[]).map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer rounded-xl border p-3 hover:bg-secondary/50 text-sm">
                  <Checkbox
                    checked={!!facForm[item.key]}
                    onCheckedChange={(c) => setFacForm((f) => ({ ...f, [item.key]: !!c }))}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <Button
              className="w-full rounded-xl"
              onClick={() => facMutation.mutate()}
              disabled={facMutation.isPending}
            >
              {facMutation.isPending ? "Menyimpan..." : "Simpan Kemudahan"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Padam Masjid?
            </DialogTitle>
            <DialogDescription>
              Tindakan ini akan memadam rekod <strong>{toTitleCase(m.name)}</strong> secara kekal. Data yang dipadam tidak boleh dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => { setDeleteOpen(false); deleteMasjidMutation.mutate(); }}
              disabled={deleteMasjidMutation.isPending}
            >
              {deleteMasjidMutation.isPending ? "Memadamkan..." : "Ya, Padam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MasjidDetail;
