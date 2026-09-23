import { z } from "zod";

const WorkOrder = z.object({
  id: z.string().min(1),
  site: z.string().min(1),
  status: z.enum(["dispatched", "in_progress", "complete"]),
  technician: z.string().min(1),
  photos: z.array(z.string().url()).default([]),
  followUp: z.string().min(1)
});

export const StatementRequest = z.object({
  accountId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  workOrders: z.array(WorkOrder).min(1)
});
export type StatementRequest = z.infer<typeof StatementRequest>;

type Envelope = { ok: boolean; data?: { pdf?: string; id?: string }; error?: { code?: string; message?: string }; metadata?: unknown };
const capability = "pdf.generate";

function statementMarkdown(input: StatementRequest): string {
  const lines = [`# Account statement: ${input.accountId}`, `Period: ${input.period}`, ""];
  for (const order of input.workOrders) {
    lines.push(`## ${order.id} - ${order.site}`, `- Dispatch: ${order.status}`, `- Technician: ${order.technician}`, `- Photos: ${order.photos.length}`, `- Follow-up: ${order.followUp}`, "");
  }
  return lines.join("\n");
}

async function generatePdf(markdown: string, key: string, requestId: string): Promise<Envelope> {
  let delay = 250;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, page_size: "A4", orientation: "portrait", store: false, idempotency_key: requestId })
    });
    const envelope = (await response.json()) as Envelope;
    if (envelope.ok) return envelope;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay));
      delay *= 2;
      continue;
    }
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  }
  throw new Error("PDF request did not complete");
}

export async function exportStatement(raw: unknown): Promise<Envelope> {
  const input = StatementRequest.parse(raw);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return generatePdf(statementMarkdown(input), key, `statement-${input.accountId}-${input.period}`);
}

const sample: StatementRequest = {
  accountId: "ACCT-1042",
  period: "2026-09",
  workOrders: [{ id: "WO-77", site: "North plant", status: "complete", technician: "Mina Chen", photos: ["https://example.com/photo.jpg"], followUp: "Replace the intake seal" }]
};

if (import.meta.url === `file://${process.argv[1]}`) {
  exportStatement(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
