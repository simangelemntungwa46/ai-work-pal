import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const GenerateInput = z.object({
  tasks: z.string().min(1),
  hours: z.number().min(0.5).max(24),
  priority: z.enum(["Low", "Medium", "High"]),
});

const PlanSchema = z.object({
  prioritized: z.array(
    z.object({
      task: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      estimate_minutes: z.number(),
    }),
  ),
  schedule: z.array(
    z.object({
      time: z.string(),
      task: z.string(),
    }),
  ),
  tips: z.array(z.string()),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider, DEFAULT_MODEL } = await import(
      "./ai-gateway.server"
    );
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a productivity coach.

Tasks:
${data.tasks}

Available Hours: ${data.hours}
Default Priority Bias: ${data.priority}

Return a JSON object with:
- "prioritized": array of { task, priority (High/Medium/Low), estimate_minutes }
- "schedule": array of { time (e.g. "09:00 AM"), task } — a realistic time-blocked day fitting within the available hours
- "tips": array of 3-5 short productivity recommendations specific to these tasks`;

    const { experimental_output } = await generateText({
      model: gateway(DEFAULT_MODEL),
      experimental_output: Output.object({ schema: PlanSchema }),
      prompt,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("task_plans")
      .insert({
        tasks: data.tasks,
        hours: data.hours,
        priority: data.priority,
        prioritized: experimental_output.prioritized,
        schedule: experimental_output.schedule,
        tips: experimental_output.tips,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listTaskPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("task_plans")
    .select("id, tasks, hours, priority, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
});

export const getTaskPlan = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("task_plans")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
