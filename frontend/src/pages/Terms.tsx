import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Terma Perkhidmatan</h1>
              <p className="text-sm text-muted-foreground mt-1">Berkuat kuasa: 13 Mac 2026 · Dikemaskini: Mac 2026</p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

            <section>
              <p>
                Selamat datang ke <strong className="text-foreground">JejakMasjid</strong>. Dengan menggunakan platform ini, anda bersetuju untuk mematuhi Terma Perkhidmatan ini. Sila baca dengan teliti sebelum menggunakan perkhidmatan kami.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">1. Penerimaan Terma</h2>
              <p>
                JejakMasjid adalah platform komuniti berasaskan data crowdsource untuk membantu umat Islam mencari dan berkongsi maklumat masjid di seluruh Malaysia. Dengan mendaftar atau menggunakan platform ini, anda bersetuju dengan terma-terma ini sepenuhnya.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">2. Akaun Pengguna</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>Anda mesti berumur sekurang-kurangnya 13 tahun untuk mendaftar akaun</li>
                <li>Anda bertanggungjawab menjaga kerahsiaan kata laluan dan akaun anda</li>
                <li>Satu orang hanya boleh mempunyai satu akaun aktif</li>
                <li>Maklumat yang diberikan semasa pendaftaran mestilah benar dan tepat</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">3. Kandungan Sumbangan Pengguna</h2>
              <p>Apabila anda menyumbangkan maklumat masjid, foto, atau kandungan lain ke JejakMasjid:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Anda mengesahkan bahawa maklumat tersebut adalah <strong className="text-foreground">tepat dan benar</strong> mengikut pengetahuan terbaik anda</li>
                <li>Anda memberikan JejakMasjid lesen tidak eksklusif untuk memaparkan dan menggunakan kandungan tersebut dalam platform</li>
                <li>Anda bersetuju untuk <strong className="text-foreground">tidak</strong> muat naik kandungan yang tidak benar, mengelirukan, menyinggung perasaan, atau melanggar hak cipta</li>
                <li>Kandungan yang melanggar garis panduan komuniti boleh dipadam tanpa notis</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">4. Kod QR Derma (Wakaf / Infak)</h2>
              <p className="text-amber-600 dark:text-amber-400 font-medium">⚠️ Amaran Penting:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Semua kod QR yang dimuat naik <strong className="text-foreground">wajib disemak oleh pentadbir</strong> sebelum dipaparkan kepada orang awam</li>
                <li>JejakMasjid <strong className="text-foreground">tidak bertanggungjawab</strong> atas sebarang transaksi kewangan yang dilakukan melalui kod QR dalam platform ini</li>
                <li>Sila <strong className="text-foreground">sahkan identiti penerima</strong> sebelum membuat sebarang pembayaran</li>
                <li>Sebarang kod QR yang disyaki penipuan boleh dilaporkan menggunakan fungsi "Laporkan" dalam platform</li>
                <li>Penyalahgunaan fungsi QR boleh menyebabkan akaun digantung secara kekal dan tindakan undang-undang</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">5. Ketepatan Maklumat</h2>
              <p>
                JejakMasjid adalah platform <strong className="text-foreground">dikuasakan oleh komuniti (crowdsourced)</strong>. Walaupun kami berusaha memastikan ketepatan maklumat, kami tidak dapat menjamin bahawa semua maklumat adalah tepat pada setiap masa. Pengguna digalakkan untuk:
              </p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Mengesahkan waktu solat dengan badan berautoriti seperti JAKIM</li>
                <li>Menghubungi masjid terbabit secara langsung untuk maklumat terkini</li>
                <li>Melaporkan maklumat yang tidak tepat melalui fungsi laporan dalam platform</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">6. Tingkah Laku Pengguna</h2>
              <p>Anda bersetuju untuk tidak:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Menggunakan platform untuk tujuan penipuan atau aktiviti haram</li>
                <li>Menganggu operasi atau keselamatan platform</li>
                <li>Muat naik perisian hasad, spam, atau kandungan berbahaya</li>
                <li>Membuat akaun palsu atau menyamar sebagai orang lain</li>
                <li>Menggunakan automasi (bot) untuk mengumpul data atau membuat check-in palsu</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">7. Sistem Reputasi dan Gamifikasi</h2>
              <p>
                Sistem mata reputasi dan lencana adalah untuk menggalakkan sumbangan yang berkualiti. JejakMasjid berhak mengubah, menetapkan semula, atau menarik balik mata/lencana jika terdapat pelanggaran terma atau manipulasi sistem.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">8. Penggantungan dan Penamatan Akaun</h2>
              <p>Kami berhak untuk menggantung atau menamatkan akaun anda tanpa notis jika:</p>
              <ul className="list-disc ml-5 space-y-1 mt-2">
                <li>Anda melanggar mana-mana terma dalam dokumen ini</li>
                <li>Terdapat aktiviti penipuan atau penyalahgunaan yang disyaki</li>
                <li>Atas permintaan pihak berkuasa undang-undang</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">9. Had Liabiliti</h2>
              <p>
                JejakMasjid disediakan "sebagaimana adanya" (as-is) tanpa sebarang jaminan. Kami tidak bertanggungjawab atas sebarang kerugian atau kerosakan yang timbul daripada penggunaan platform ini, termasuk tetapi tidak terhad kepada keputusan berdasarkan maklumat dalam platform.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">10. Undang-undang yang Terpakai</h2>
              <p>
                Terma ini ditadbir oleh undang-undang <strong className="text-foreground">Malaysia</strong>. Sebarang pertikaian akan diselesaikan di mahkamah yang berkompetensi di Malaysia.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-semibold text-foreground mb-3">11. Hubungi Kami</h2>
              <p>Sebarang pertanyaan mengenai Terma Perkhidmatan ini:</p>
              <div className="mt-3 rounded-xl border bg-card p-4 text-foreground text-sm">
                <p className="font-semibold">JejakMasjid</p>
                <p className="mt-1">Emel: <a href="mailto:meraqi@gmail.com" className="text-primary hover:underline">meraqi@gmail.com</a></p>
                <p>Laman web: <a href="https://jejakmasjid.vercel.app" className="text-primary hover:underline">jejakmasjid.vercel.app</a></p>
              </div>
            </section>

          </div>

          <div className="mt-10 flex gap-4 text-sm">
            <Link to="/privacy" className="text-primary hover:underline">Dasar Privasi →</Link>
            <Link to="/" className="text-muted-foreground hover:underline">← Kembali ke Laman Utama</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
