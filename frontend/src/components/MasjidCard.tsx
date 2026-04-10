import { MapPin, CheckCircle, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { MasjidSummary } from "@/types";

const MasjidCard = ({ masjid }: { masjid: MasjidSummary }) => {
  const isVerified = masjid.status === "verified";

  return (
    <Link
      to={`/masjid/${masjid.slug}`}
      className="group block overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {masjid.coverImageUrl ? (
          <img
            src={masjid.coverImageUrl}
            alt={masjid.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary">
            <MapPin className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

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
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {masjid.name}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {masjid.city}, {masjid.state}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {masjid.visitCount} kunjungan
            </span>
          </div>
          {masjid.averageRating != null && (
            <div className="flex items-center gap-1 text-xs font-semibold text-accent">
              <Star className="h-3.5 w-3.5 fill-current" />
              {masjid.averageRating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MasjidCard;
