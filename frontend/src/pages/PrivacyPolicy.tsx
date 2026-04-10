import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Dasar Privasi</h1>
              <p className="text-sm text-muted-foreground mt-1">Berkuat kuasa: 13 Mac 2026 · Dikemaskini: Mac 2026</p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

            <section>
              <p>
                JejakMasjid ("kami", "platform") menghormati privasi anda dan komited untuk melindungi maklumat peribadi anda selaras dengan <strong className="text-foreground">Akta Perlindungan Data Peribadi 2010 (PDPA)</strong> Malaysia.
              </p>
              <p className="mt-2">
                Dasar Privasi ini menerangkan bagaimana kami mengumpul, menggunakan, menyimpan dan melindungi data anda apabila anda menggunakan laman web dan aplikasi JejakMasjid.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">1. Maklumat Yang Kami Kumpul</h2>
              <h3 className="font-medium text-foreground mb-1">a) Maklumat yang anda berikan secara langsung</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Nama penuh dan alamat emel semasa pendaftaran</li>
                <li>Jantina (digunakan untuk memaparkan kemudahan relevan seperti surau wanita)</li>
                <li>Maklumat check-in masjid yang anda daftarkan sendiri</li>
                <li>Data masjid yang anda sumbangkan (nama, lokasi, kemudahan, foto)</li>
                <li>Laporan yang anda hantar mengenai ketidaktepatan maklumat</li>
              </ul>

              <h3 className="font-medium text-foreground mt-4 mb-1">b) Maklumat dikumpul secara automatik</h3>
              <ul className="list-disc ml-5 space-y-1">
                <li>Data lokasi GPS (hanya dengan kebenaran anda, untuk carian masjid berhampiran)</li>
                <li>Maklumat peranti dan pelayar (untuk debugging dan keselamatan)</li>
                <li>Log aktiviti dalam aplikasi (untuk meningkatkan perkhidmatan)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">2. Bagaimana Kami Menggunakan Maklumat Anda</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>Untuk mengesahkan dan menguruskan akaun anda</li>
                <li>Untuk memaparkan rekod kunjungan dan statistik peribadi anda ("Jejak Saya")</li>
                <li>Untuk mengira mata reputasi dan pencapaian gamifikasi</li>
                <li>Untuk menyemak dan meluluskan kandungan yang dikemukakan pengguna</li>
                <li>Untuk menghantar emel pemberitahuan berkaitan akaun (pengesahan, tetapan semula kata laluan)</li>
                <li>Untuk mengesan dan mencegah aktiviti penipuan atau penyalahgunaan</li>
              </ul>
              <p className="mt-3">Kami <strong className="text-foreground">tidak</strong> menggunakan data anda untuk tujuan pengiklanan atau menjualnya kepada pihak ketiga.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">3. Perkongsian Data</h2>
              <p>Kami hanya berkongsi data anda dengan:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li><strong className="text-foreground">Supabase</strong> — pembekal pangkalan data dan pengesahan kami (pelayan berlokasi di Amerika Syarikat; Supabase mematuhi piawaian SOC 2)</li>
                <li><strong className="text-foreground">Vercel</strong> — pembekal hos frontend kami</li>
                <li><strong className="text-foreground">Google Cloud Run</strong> — pembekal hos backend kami</li>
              </ul>
              <p className="mt-2">Semua pembekal di atas tertakluk kepada perjanjian perlindungan data yang ketat. Data check-in dan sumbangan masjid anda yang bersifat awam akan dipaparkan kepada semua pengguna lain secara tanpa nama atau dengan nama paparan anda.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">4. Penyimpanan Data</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>Data akaun disimpan selagi akaun anda aktif</li>
                <li>Data check-in dan sumbangan disimpan secara kekal sebagai rekod komuniti</li>
                <li>Log sistem disimpan selama 90 hari untuk tujuan keselamatan</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">5. Hak Anda di Bawah PDPA 2010</h2>
              <p>Sebagai subjek data, anda mempunyai hak untuk:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li><strong className="text-foreground">Akses</strong> — meminta salinan data yang kami simpan tentang anda</li>
                <li><strong className="text-foreground">Pembetulan</strong> — meminta pembetulan data yang tidak tepat</li>
                <li><strong className="text-foreground">Pemadaman</strong> — meminta pemadaman akaun dan data peribadi anda</li>
                <li><strong className="text-foreground">Bantahan</strong> — membantah pemprosesan data anda untuk tujuan tertentu</li>
              </ul>
              <p className="mt-3">Untuk menggunakan hak-hak ini, hubungi kami di <strong className="text-foreground">meraqi@gmail.com</strong> atau melalui borang di halaman profil anda.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">6. Keselamatan Data</h2>
              <p>Kami melaksanakan langkah-langkah keselamatan teknikal dan organisasi termasuk:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Penyulitan HTTPS untuk semua penghantaran data</li>
                <li>Kata laluan disimpan dalam bentuk cincang (hashed) melalui Supabase Auth</li>
                <li>Row Level Security (RLS) di peringkat pangkalan data</li>
                <li>Token JWT dengan tempoh luput untuk pengesahan sesi</li>
                <li>Had kadar (rate limiting) untuk mencegah serangan brute force</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">7. Kuki (Cookies)</h2>
              <p>JejakMasjid menggunakan kuki minimum yang diperlukan untuk:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Mengekalkan sesi log masuk anda (token disimpan dalam localStorage)</li>
                <li>Keutamaan antara muka pengguna</li>
              </ul>
              <p className="mt-2">Kami tidak menggunakan kuki penjejakan pihak ketiga atau kuki pengiklanan.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">8. Pautan ke Laman Lain</h2>
              <p>Platform kami mungkin mengandungi pautan ke laman web luar (contoh: Google Maps untuk arah). Kami tidak bertanggungjawab atas amalan privasi laman-laman tersebut.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">9. Perubahan kepada Dasar Ini</h2>
              <p>Kami boleh mengemas kini Dasar Privasi ini dari semasa ke semasa. Perubahan material akan dimaklumkan melalui notis dalam aplikasi atau emel. Penggunaan berterusan anda selepas perubahan tersebut bermakna anda menerima dasar yang dikemas kini.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">10. Hubungi Kami</h2>
              <p>Sebarang pertanyaan, aduan atau permintaan berkaitan privasi, sila hubungi:</p>
              <div className="mt-3 rounded-xl border bg-card p-4 text-foreground text-sm">
                <p className="font-semibold">JejakMasjid — Pegawai Perlindungan Data</p>
                <p className="mt-1">Emel: <a href="mailto:meraqi@gmail.com" className="text-primary hover:underline">meraqi@gmail.com</a></p>
                <p>Laman web: <a href="https://jejakmasjid.vercel.app" className="text-primary hover:underline">jejakmasjid.vercel.app</a></p>
              </div>
            </section>

          </div>

          <div className="mt-10 flex gap-4 text-sm">
            <Link to="/terms" className="text-primary hover:underline">Terma Perkhidmatan →</Link>
            <Link to="/" className="text-muted-foreground hover:underline">← Kembali ke Laman Utama</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
