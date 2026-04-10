import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";

type ChangeType = "new" | "fix" | "improve" | "security";

interface Change {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  label?: "major" | "minor" | "patch";
  summary: string;
  changes: Change[];
}

const releases: Release[] = [
  {
    version: "1.2.0",
    date: "Mac 2026",
    label: "minor",
    summary: "Pengurusan masjid, kualiti data, dan kandungan baru.",
    changes: [
      { type: "new", text: "Butang padam masjid kini tersedia untuk pemilik rekod dan admin." },
      { type: "new", text: "Halaman FAQ dengan soalan lazim tentang privasi, akaun, dan penggunaan platform." },
      { type: "new", text: "Halaman Kemas Kini & Perubahan (anda sedang membacanya sekarang!)." },
      { type: "improve", text: "Nama masjid kini automatik ditukar ke format Title Case untuk konsistensi paparan." },
      { type: "improve", text: "Pautan FAQ dan Changelog ditambah di footer untuk akses mudah." },
    ],
  },
  {
    version: "1.1.0",
    date: "Mac 2026",
    label: "minor",
    summary: "Sistem media, gambar masjid, dan QR kod derma.",
    changes: [
      { type: "new", text: "Muat naik gambar masjid (gambar utama, dalaman, tandas, papan info)." },
      { type: "new", text: "Pengguna boleh hantar QR TNG dan DuitNow untuk derma/wakaf (perlu semakan admin)." },
      { type: "new", text: "Admin panel untuk semak dan luluskan QR kod sebelum dipaparkan." },
      { type: "security", text: "QR kod hanya dipaparkan selepas disahkan oleh admin. Minimum 30 mata reputasi diperlukan untuk hantar QR." },
      { type: "improve", text: "Semak terdapat notis amaran di bahagian QR untuk mengingatkan pengguna semak penerima sebelum bayar." },
    ],
  },
  {
    version: "1.0.0",
    date: "Mac 2026",
    label: "major",
    summary: "Pelancaran pertama JejakMasjid! 🎉",
    changes: [
      { type: "new", text: "Daftar akaun dengan pengesahan emel (OTP kod)." },
      { type: "new", text: "Tambah masjid baru dengan semakan radius 100m untuk elak duplikat." },
      { type: "new", text: "Check-in berasaskan GPS — perlu berada dalam 200m dari masjid." },
      { type: "new", text: "Sistem kemudahan masjid: Coway, kucing, karpet vibe, parkir, tandas, dan banyak lagi." },
      { type: "new", text: "Live updates: status saf, parking, menu iftar, kepadatan jemaah." },
      { type: "new", text: "Sistem pengesahan komuniti: 3 undi = status Disahkan." },
      { type: "new", text: "Gamifikasi: streak harian, mata reputasi, badge pencapaian." },
      { type: "new", text: "Papan pemimpin komuniti." },
      { type: "new", text: "Dasar Privasi dan Terma Perkhidmatan." },
      { type: "security", text: "Semua data dilindungi dengan penyulitan TLS dan PDPA-compliant." },
    ],
  },
];

const TYPE_CONFIG: Record<ChangeType, { label: string; className: string }> = {
  new: { label: "Baru", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  fix: { label: "Pembetulan", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  improve: { label: "Peningkatan", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  security: { label: "Keselamatan", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
};

const LABEL_CONFIG: Record<NonNullable<Release["label"]>, { label: string; className: string }> = {
  major: { label: "Major", className: "bg-primary text-primary-foreground" },
  minor: { label: "Minor", className: "bg-secondary text-secondary-foreground" },
  patch: { label: "Patch", className: "bg-muted text-muted-foreground" },
};

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Megaphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Kemas Kini & Perubahan</h1>
              <p className="text-sm text-muted-foreground mt-1">Sejarah versi dan perubahan platform JejakMasjid</p>
            </div>
          </div>

          <div className="space-y-8">
            {releases.map((release, idx) => (
              <div key={release.version} className="relative pl-6 border-l-2 border-border">
                {/* Timeline dot */}
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-background ${idx === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-serif text-xl font-bold text-foreground">v{release.version}</span>
                  {release.label && (
                    <Badge className={`text-xs font-medium ${LABEL_CONFIG[release.label].className}`}>
                      {LABEL_CONFIG[release.label].label}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">{release.date}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 italic">{release.summary}</p>

                <ul className="space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 inline-flex shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_CONFIG[change.type].className}`}>
                        {TYPE_CONFIG[change.type].label}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
            <p>
              Ada cadangan atau jumpa pepijat? Gunakan butang{" "}
              <span className="font-medium text-foreground">Maklum Balas</span> di kiri bawah skrin.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
