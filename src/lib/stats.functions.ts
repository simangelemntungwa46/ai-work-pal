import { createServerFn } from "@tanstack/react-start";

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [emails, meetings, tasks] = await Promise.all([
    supabaseAdmin.from("emails").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("meeting_summaries").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("task_plans").select("*", { count: "exact", head: true }),
  ]);
  return {
    emails: emails.count ?? 0,
    meetings: meetings.count ?? 0,
    tasks: tasks.count ?? 0,
    research: 0,
  };
});
