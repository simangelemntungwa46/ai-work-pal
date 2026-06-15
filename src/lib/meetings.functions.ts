import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const GenerateInput = z.object({
  notes: z.string().min(10),
});

const SummarySchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  action_items: z.array(
    z.object({
      task: z.string(),
      owner: z.string().optional(),
    }),
  ),
  deadlines: z.array(
    z.object({
      item: z.string(),
      due: z.string(),
    }),
  ),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider, DEFAULT_MODEL } = await import(
      "./ai-gateway.server"
    );
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are an AI meeting assistant.

Analyze the following meeting notes:

${data.notes}

Return a JSON object with:
- "summary": a 2-4 sentence executive summary
- "decisions": array of key decisions made
- "action_items": array of objects { task, owner } — owner is the responsible person if mentioned, otherwise omit
- "deadlines": array of objects { item, due } — for any deadlines mentioned`;

    const { experimental_output } = await generateText({
      model: gateway(DEFAULT_MODEL),
      experimental_output: Output.object({ schema: SummarySchema }),
      prompt,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("meeting_summaries")
      .insert({
        notes: data.notes,
        summary: experimental_output.summary,
        decisions: experimental_output.decisions,
        action_items: experimental_output.action_items,
        deadlines: experimental_output.deadlines,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMeetings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("meeting_summaries")
    .select("id, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
});

export const getMeeting = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("meeting_summaries")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
