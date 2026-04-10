-- Run this in Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message     text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 1000),
  rating      int  CHECK (rating BETWEEN 1 AND 5),
  page_url    text,
  name        text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- Anyone can insert; nobody can read/update/delete via API (only service role)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);
