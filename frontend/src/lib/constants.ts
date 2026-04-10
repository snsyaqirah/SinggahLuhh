// Filter tag definitions for Browse page
export const QUICK_TAGS = [
  { key: "iftar",           label: "Iftar" },
  { key: "terawih",         label: "Terawih" },
  { key: "ac",              label: "Aircon" },
  { key: "coway",           label: "Coway" },
  { key: "kids",            label: "Ruang Kanak-kanak" },
  { key: "family",          label: "Mesra Keluarga" },
  { key: "oku",             label: "Mesra OKU" },
  { key: "telekung",        label: "Telekung Bersih" },
  { key: "tourist",         label: "Mesra Pelancong" },
  { key: "library",         label: "Perpustakaan" },
  { key: "tahfiz",          label: "Tahfiz" },
  { key: "parking_senang",  label: "Parking Senang" },
] as const;

export type QuickTagKey = (typeof QUICK_TAGS)[number]["key"];

// Maps tag keys to a function that checks a facilities object
export const TAG_FILTER_FN: Record<
  QuickTagKey,
  (f: Record<string, unknown>) => boolean
> = {
  iftar:          (f) => f.has_iftar === true,
  terawih:        (f) => f.terawih_rakaat != null,
  ac:             (f) => typeof f.cooling_system === "string" && f.cooling_system.includes("AC"),
  coway:          (f) => f.has_coway === true,
  kids:           (f) => f.has_kids_area === true,
  family:         (f) => f.is_family_friendly === true,
  oku:            (f) => f.has_parking_oku === true,
  telekung:       (f) => f.has_clean_telekung === true,
  tourist:        (f) => f.is_tourist_friendly === true,
  library:        (f) => f.has_library === true,
  tahfiz:         (f) => f.has_tahfiz === true,
  parking_senang: (f) => f.parking_level === "Senang",
};

export const VISIT_TYPE_LABELS: Record<string, string> = {
  subuh:   "Subuh",
  zohor:   "Zohor",
  asar:    "Asar",
  maghrib: "Maghrib",
  isyak:   "Isyak",
  jumaat:  "Jumaat",
  terawih: "Terawih",
  iftar:   "Iftar",
  kuliah:  "Kuliah",
  general: "Umum",
};

export const MALAYSIA_STATES = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka",
  "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya",
  "Sabah", "Sarawak", "Selangor", "Terengganu",
];
