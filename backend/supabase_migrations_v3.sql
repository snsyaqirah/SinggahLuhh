-- ============================================================
-- JejakMasjid — Migration v3
-- Run this in the Supabase SQL Editor (once)
-- ============================================================

-- 1. Add gender column to profiles
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text
  CHECK (gender = ANY (ARRAY['Lelaki'::text, 'Perempuan'::text]));


-- 2. Seed badges
-- ----------------------------------------------------------------
INSERT INTO public.badges (code, name, description, icon, requirement_type, requirement_value)
VALUES
  ('first_checkin',    'Peneroka Pertama',      'Check-in pertama di mana-mana masjid!',                '🌙', 'total_visits',            1),
  ('visit_5',          'Jejak 5 Masjid',         'Dah jejak 5 masjid berlainan — teruskan!',              '🕌', 'unique_masjids_visited',   5),
  ('visit_10',         'Jejak 10 Masjid',        'Dah jejak 10 masjid berlainan — berganda!',             '🏅', 'unique_masjids_visited',  10),
  ('visit_25',         'Penjelajah Masjid',      '25 masjid berlainan — kaki jalan sungguh!',             '🗺️', 'unique_masjids_visited',  25),
  ('visit_50',         'Pakar Penjelajah',       '50 masjid — masjid Malaysia pun dah sukar!',           '🌟', 'unique_masjids_visited',  50),
  ('streak_3',         'Anak Soleh',             'Streak 3 hari berturut-turut.',                         '🔥', 'streak_count',             3),
  ('streak_7',         'Seminggu Penuh',         'Streak 7 hari berturut-turut — MasyaAllah!',            '✨', 'streak_count',             7),
  ('streak_30',        'Sebulan Istiqamah',      'Streak 30 hari — Allahu Akbar!',                       '🏆', 'streak_count',            30),
  ('terawih_hunter',   'Pemburu Terawih',        '5 kali check-in solat terawih.',                        '🌙', 'visit_type_terawih',       5),
  ('jumaat_regular',   'Tetamu Jumaat',          '4 kali solat Jumaat direkod.',                          '📿', 'visit_type_jumaat',        4),
  ('iftar_lover',      'Pemburu Iftar',          '3 kali check-in di masjid dengan iftar.',               '🍛', 'visit_type_iftar',         3),
  ('contributor',      'Penyumbang Komuniti',    'Tambah maklumat kemudahan atau gambar pertama kali.',   '💪', 'reputation_points',        50),
  ('verified_adder',   'Pelapor Tepat',          'Menyumbang kepada pengesahan 3 masjid.',                '✅', 'verifications_contributed', 3),
  ('century',          '100 Kunjungan',          '100 check-in direkod — legenda!',                      '💯', 'total_visits',           100)
ON CONFLICT (code) DO NOTHING;


-- 3. (Optional) Verify
-- ----------------------------------------------------------------
-- SELECT code, name, icon FROM public.badges ORDER BY requirement_value;
