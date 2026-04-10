// Quick filter tags
export const QUICK_TAGS = [
  { key: "mesra-oku", label: "Mesra OKU" },
  { key: "ruang-wanita", label: "Ruang Wanita" },
  { key: "parking-luas", label: "Parking Luas" },
  { key: "public-transport", label: "Dekat Transit" },
  { key: "wifi", label: "WiFi" },
  { key: "ac", label: "Aircon" },
  { key: "iftar", label: "Iftar" },
  { key: "terawih", label: "Terawih" },
  { key: "kuliah", label: "Kuliah/Ceramah" },
  { key: "tandas-bersih", label: "Tandas Bersih" },
] as const;

// Vibe tags for reviews
export const VIBE_TAGS = [
  "Imam bacaan sedap",
  "Imam bacaan laju",
  "Selesa dan tenang",
  "Kipas kuat",
  "Carpet baru",
  "Suasana kampung",
  "Moden dan bersih",
  "Komuniti mesra",
  "Ceramah berkualiti",
  "Makanan best",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];
