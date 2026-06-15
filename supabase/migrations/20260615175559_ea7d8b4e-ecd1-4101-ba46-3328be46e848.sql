
-- Tighten INSERT policies: replace WITH CHECK (true) with length-bounded validation
-- The app is no-auth by design (public write), but we enforce input size limits to mitigate abuse.

DROP POLICY IF EXISTS "Public insert emails" ON public.emails;
CREATE POLICY "Public insert emails" ON public.emails
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(purpose) BETWEEN 1 AND 2000
    AND length(recipient) BETWEEN 1 AND 500
    AND length(tone) BETWEEN 1 AND 50
    AND (instructions IS NULL OR length(instructions) <= 4000)
    AND length(subject) BETWEEN 1 AND 500
    AND length(body) BETWEEN 1 AND 20000
  );

DROP POLICY IF EXISTS "Public insert meeting_summaries" ON public.meeting_summaries;
CREATE POLICY "Public insert meeting_summaries" ON public.meeting_summaries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(notes) BETWEEN 1 AND 50000
    AND length(summary) BETWEEN 1 AND 20000
    AND pg_column_size(decisions) <= 50000
    AND pg_column_size(action_items) <= 50000
    AND pg_column_size(deadlines) <= 50000
  );

DROP POLICY IF EXISTS "Public insert task_plans" ON public.task_plans;
CREATE POLICY "Public insert task_plans" ON public.task_plans
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(tasks) BETWEEN 1 AND 20000
    AND hours >= 0 AND hours <= 168
    AND length(priority) BETWEEN 1 AND 50
    AND pg_column_size(prioritized) <= 50000
    AND pg_column_size(schedule) <= 50000
    AND pg_column_size(tips) <= 50000
  );
