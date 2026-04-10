import { MapPin, CheckCircle, Users, Wind, Cat, Utensils, Moon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Masjid } from "@/types";
import { toTitleCase } from "@/lib/utils";

export type { Masjid as MasjidData };

const MasjidCard = ({ masjid }: { masjid: Masjid }) => {
  const f = masjid.facilities;
  const isVerified = masjid.status === "verified";

  const featureBadges: { label: string; icon: React.ReactNode }[] = [];
  if (f?.has_iftar) featureBadges.push({ label: "Iftar", icon: <Utensils className="h-3 w-3" /> });
  if (f?.terawih_rakaat) featureBadges.push({ label: `Terawih ${f.terawih_rakaat}`, icon: <Moon className="h-3 w-3" /> });
  if (f?.cooling_system?.includes("AC")) featureBadges.push({ label: "AC", icon: <Wind className="h-3 w-3" /> });
  if (f?.kucing_count && f.kucing_count !== "Takda" && f.kucing_count !== "Tidak Pasti") {
    featureBadges.push({ label: "Ada Kucing ���", icon: <Cat className="h-3 w-3" /> });
  }

  return (
    <Link
      to={`/masjid/${masjid.slug ?? masjid.id}`}
      className="group block overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Placeholder image area */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <div className="flex h-full items-center justify-center bg-secondary">
          <MapPin className="h-12 w-12 text-muted-foreground/30" />
        </div>

        {/* Verification Badge */}
        <div className="absolute top-3 right-3">
          {isVerified ? (
            <Badge className="bg-accent text-accent-foreground gap-1 font-sans text-xs font-semibold">
              <CheckCircle className="h-3 w-3" />
              Disahkan
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-sans text-xs">
              Belum disahkan
            </Badge>
          )}
        </div>

        {/* Feature Badges */}
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          {featureBadges.slice(0, 3).map((b) => (
            <Badge
              key={b.label}
              variant="secondary"
              className="bg-primary/90 text-primary-foreground font-sans text-xs backdrop-blur-sm flex items-center gap-1"
            >
              {b.icon}
              {b.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {toTitleCase(masjid.name)}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {masjid.address ?? "Alamat tidak dinyatakan"}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {masjid.verification_count} pengesahan
          </span>
          <span className="capitalize text-muted-foreground/70">{masjid.status}</span>
        </div>
      </div>
    </Link>
  );
};

export default MasjidCard;
