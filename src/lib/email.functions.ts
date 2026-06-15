import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

const GenerateInput = z.object({
  purpose: z.string().min(1),
  recipient: z.string().min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  instructions: z.string().optional().default(""),
});

const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider, DEFAULT_MODEL } = await import(
      "./ai-gateway.server"
    );
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are a professional business communication assistant.

Generate an email using the following details:

Purpose: ${data.purpose}
Recipient: ${data.recipient}
Tone: ${data.tone}
Instructions: ${data.instructions || "(none)"}

Generate a JSON object with:
- "subject": a concise subject line
- "body": the complete professional email body, including greeting, body paragraphs, and an appropriate closing with sign-off`;

    const { experimental_output } = await generateText({
      model: gateway(DEFAULT_MODEL),
      experimental_output: Output.object({ schema: EmailSchema }),
      prompt,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("emails")
      .insert({
        purpose: data.purpose,
        recipient: data.recipient,
        tone: data.tone,
        instructions: data.instructions,
        subject: experimental_output.subject,
        body: experimental_output.body,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listEmails = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("emails")
    .select("id, recipient, subject, tone, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
});

export const getEmail = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("emails")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
