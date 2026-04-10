import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HelpCircle, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    section: "Privasi & Keselamatan",
    items: [
      {
        q: "Adakah data saya selamat semasa daftar akaun?",
        a: "Ya. Kami menggunakan Supabase untuk pengesahan, yang menggunakan penyulitan AES-256 untuk data yang disimpan dan TLS 1.3 untuk data dalam penghantaran. Kata laluan anda tidak pernah disimpan dalam bentuk teks biasa — ia di-hash menggunakan bcrypt. Kami juga mematuhi Akta Perlindungan Data Peribadi 2010 (PDPA) Malaysia.",
      },
      {
        q: "Apa yang berlaku kepada emel dan nama saya?",
        a: "Emel anda digunakan untuk pengesahan akaun dan pemberitahuan berkaitan akaun sahaja. Nama anda dipaparkan di profil awam anda jika anda memilih untuk berkongsinya. Kami tidak menjual atau berkongsi data peribadi anda dengan pengiklan.",
      },
      {
        q: "Adakah lokasi GPS saya disimpan?",
        a: "Data GPS hanya digunakan semasa anda melakukan check-in atau mencari masjid berhampiran. Koordinat check-in disimpan untuk mengira rekod kunjungan anda, tetapi tidak dikongsi secara awam dengan pengguna lain.",
      },
      {
        q: "Bolehkah saya padam akaun saya?",
        a: "Boleh. Pergi ke halaman Profil Saya → bahagian 'Zon Berbahaya' → klik Padam Akaun Saya. Jika ada masalah, emel kami di meraqi@gmail.com (mungkin ambil masa sikit untuk kami proses). Pemadaman adalah kekal — data peribadi anda dipadam sepenuhnya, tetapi rekod awam sumbangan masjid mungkin dikekalkan sebagai rekod komuniti.",
      },
    ],
  },
  {
    section: "Akaun & Pendaftaran",
    items: [
      {
        q: "Kenapa saya perlukan akaun?",
        a: "Akaun diperlukan untuk check-in ke masjid, menambah kemudahan, memuat naik gambar, dan menyumbang ke komuniti. Anda boleh melayari dan mencari masjid tanpa akaun.",
      },
      {
        q: "Saya tak terima emel pengesahan. Apa perlu buat?",
        a: "Semak folder spam atau junk anda. Jika masih tiada, tunggu beberapa minit dan cuba daftar semula. Pastikan alamat emel yang dimasukkan adalah betul. Kod OTP tamat dalam 1 jam.",
      },
      {
        q: "Bolehkah saya tukar emel atau kata laluan?",
        a: "Kata laluan boleh ditukar melalui fungsi 'Lupa Kata Laluan' di halaman log masuk. Penukaran emel belum disokong buat masa ini — hubungi kami jika perlu.",
      },
    ],
  },
  {
    section: "Masjid & Data",
    items: [
      {
        q: "Siapa yang boleh tambah masjid?",
        a: "Mana-mana pengguna yang telah log masuk boleh menambah masjid. Masjid baru akan berstatus 'Belum Disahkan' sehingga mendapat 3 pengesahan daripada pengguna lain yang telah mengunjungi masjid tersebut.",
      },
      {
        q: "Kenapa nama masjid saya automatik tukar format?",
        a: "Sistem kami secara automatik menukar nama masjid kepada format Title Case (contoh: 'masjid al-falah' → 'Masjid Al-Falah') untuk memastikan konsistensi paparan di seluruh platform.",
      },
      {
        q: "Bolehkah saya edit atau padam masjid yang saya tambah?",
        a: "Ya. Dalam halaman butiran masjid, pemilik rekod dan admin boleh mengemaskini atau memadam masjid tersebut. Jika ada maklumat yang salah tapi anda bukan pemilik, gunakan butang 'Laporkan Masalah' dalam halaman butiran masjid untuk maklumkan admin.",
      },
      {
        q: "Kenapa ada masjid yang berstatus 'Belum Disahkan'?",
        a: "Semua masjid yang baru ditambah bermula dengan status 'Belum Disahkan'. Setelah 3 pengguna yang berbeza mengundi 'Betul', status akan bertukar kepada 'Disahkan'. Ini untuk memastikan ketepatan maklumat.",
      },
      {
        q: "Apakah yang berlaku jika saya laporkan maklumat salah?",
        a: "Laporan anda akan dikaji oleh admin. Jika laporan disahkan, masjid tersebut mungkin dikemaskini atau statusnya diubah. Pengguna yang kerap menghantar laporan tidak benar atau menyalahgunakan platform boleh disekat (is_banned) oleh admin — akaun yang disekat tidak boleh menambah masjid baru.",
      },
    ],
  },
  {
    section: "Check-in & Gamifikasi",
    items: [
      {
        q: "Kenapa check-in saya gagal walaupun saya berada di masjid?",
        a: "Check-in memerlukan anda berada dalam jarak 200m dari lokasi masjid yang berdaftar. Pastikan GPS anda aktif dan kebenaran lokasi diberikan kepada pelayar. Jika lokasi masjid tidak tepat, laporkan untuk pembetulan.",
      },
      {
        q: "Apa itu 'Streak' dan bagaimana ia dikira?",
        a: "Streak adalah bilangan hari berturut-turut anda melakukan check-in ke mana-mana masjid. Streak terputus jika anda tidak check-in dalam tempoh 48 jam. Streak terpanjang anda direkod dalam profil.",
      },
      {
        q: "Bagaimana mata reputasi berfungsi?",
        a: "Anda mendapat mata untuk setiap sumbangan: +50 untuk tambah masjid baru, +10 untuk tambah kemudahan masjid (+5 untuk kemaskini), +5 untuk muat naik gambar, dan +8 hingga +15 untuk check-in harian (mengikut jenis solat — Subuh, Jumaat, Terawih dapat lebih). Mata reputasi menentukan tahap kepercayaan akaun anda dan membuka ciri seperti upload QR.",
      },
    ],
  },
  {
    section: "QR Derma & Wakaf",
    items: [
      {
        q: "Adakah QR kod derma di JejakMasjid selamat?",
        a: "QR kod yang dihantar pengguna perlu melalui semakan admin sebelum dipaparkan. Walau bagaimanapun, sentiasa semak penerima bayaran sebelum membuat sebarang transaksi. JejakMasjid tidak bertanggungjawab atas sebarang urus niaga kewangan.",
      },
      {
        q: "Siapa yang boleh upload QR kod?",
        a: "Hanya pengguna dengan sekurang-kurangnya 30 mata reputasi boleh menghantar QR kod. Ini untuk mengurangkan risiko penipuan. Semua QR yang dihantar akan disemak oleh admin terlebih dahulu sebelum dipaparkan kepada pengguna lain.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <HelpCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Soalan Lazim (FAQ)</h1>
              <p className="text-sm text-muted-foreground mt-1">Jawapan kepada soalan-soalan yang sering ditanya</p>
            </div>
          </div>

          <div className="space-y-8">
            {faqs.map((section) => (
              <section key={section.section}>
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3 border-b pb-2">
                  {section.section}
                </h2>
                <Accordion type="multiple" className="space-y-1">
                  {section.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`${section.section}-${i}`}
                      className="border rounded-xl px-4 data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4 gap-3">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Masih ada soalan? Gunakan butang{" "}
              <span className="font-medium text-foreground">Maklum Balas</span> di bawah skrin atau hubungi kami.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
