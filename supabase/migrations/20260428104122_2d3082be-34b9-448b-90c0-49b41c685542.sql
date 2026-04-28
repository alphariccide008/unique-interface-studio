-- LIKES
CREATE TYPE public.like_action AS ENUM ('like', 'pass');

CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL,
  liked_id uuid NOT NULL,
  action public.like_action NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id),
  CHECK (liker_id <> liked_id)
);
CREATE INDEX idx_likes_liked ON public.likes(liked_id);
CREATE INDEX idx_likes_liker ON public.likes(liker_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see their own likes" ON public.likes FOR SELECT TO authenticated USING (auth.uid() = liker_id);
CREATE POLICY "users insert their own likes" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = liker_id);

-- MATCHES (user_a < user_b for uniqueness)
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);
CREATE INDEX idx_matches_a ON public.matches(user_a);
CREATE INDEX idx_matches_b ON public.matches(user_b);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see their matches" ON public.matches FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "users delete their matches" ON public.matches FOR DELETE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Auto-create match when mutual like happens
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reciprocal boolean;
  a uuid;
  b uuid;
BEGIN
  IF NEW.action <> 'like' THEN RETURN NEW; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id AND action = 'like'
  ) INTO reciprocal;
  IF reciprocal THEN
    a := LEAST(NEW.liker_id, NEW.liked_id);
    b := GREATEST(NEW.liker_id, NEW.liked_id);
    INSERT INTO public.matches (user_a, user_b) VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_create_match AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

-- DAILY QUESTIONS
CREATE TABLE public.daily_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable by all auth" ON public.daily_questions FOR SELECT TO authenticated USING (true);

-- Seed pool
INSERT INTO public.daily_questions (question) VALUES
  ('If the world ended tomorrow, whose name would you carve into the final stone?'),
  ('What is the smallest lie you tell yourself most often?'),
  ('Describe a moment that quietly changed who you are.'),
  ('What sound feels most like home to you?'),
  ('When did you last surprise yourself?'),
  ('What is one belief you hold that few people share?'),
  ('What would you do tomorrow if no one would judge you?'),
  ('Which scar — visible or not — would you tell me about first?'),
  ('What does devotion look like to you?'),
  ('What is the most beautiful thing you have ever destroyed?');

-- SPARK ANSWERS
CREATE TABLE public.spark_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.daily_questions(id) ON DELETE CASCADE,
  spark_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id, spark_date)
);
CREATE INDEX idx_spark_match_date ON public.spark_answers(match_id, spark_date);

ALTER TABLE public.spark_answers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_in_match(_match_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = _match_id AND (_user_id = user_a OR _user_id = user_b)
  );
$$;

CREATE POLICY "members read spark answers" ON public.spark_answers FOR SELECT TO authenticated
  USING (public.is_in_match(match_id, auth.uid()));
CREATE POLICY "users insert own spark answer" ON public.spark_answers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_in_match(match_id, auth.uid()));

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_match_created ON public.messages(match_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_in_match(match_id, auth.uid()));
CREATE POLICY "members send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_in_match(match_id, auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spark_answers;