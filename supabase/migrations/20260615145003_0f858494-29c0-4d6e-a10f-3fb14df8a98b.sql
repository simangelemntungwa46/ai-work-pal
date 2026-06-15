
CREATE TABLE public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose text NOT NULL,
  recipient text NOT NULL,
  tone text NOT NULL,
  instructions text,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.emails TO anon, authenticated;
GRANT ALL ON public.emails TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read emails" ON public.emails FOR SELECT USING (true);
CREATE POLICY "Public insert emails" ON public.emails FOR INSERT WITH CHECK (true);

CREATE TABLE public.meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notes text NOT NULL,
  summary text NOT NULL,
  decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  deadlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.meeting_summaries TO anon, authenticated;
GRANT ALL ON public.meeting_summaries TO service_role;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read meeting_summaries" ON public.meeting_summaries FOR SELECT USING (true);
CREATE POLICY "Public insert meeting_summaries" ON public.meeting_summaries FOR INSERT WITH CHECK (true);

CREATE TABLE public.task_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tasks text NOT NULL,
  hours numeric NOT NULL,
  priority text NOT NULL,
  prioritized jsonb NOT NULL DEFAULT '[]'::jsonb,
  schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  tips jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.task_plans TO anon, authenticated;
GRANT ALL ON public.task_plans TO service_role;
ALTER TABLE public.task_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read task_plans" ON public.task_plans FOR SELECT USING (true);
CREATE POLICY "Public insert task_plans" ON public.task_plans FOR INSERT WITH CHECK (true);
