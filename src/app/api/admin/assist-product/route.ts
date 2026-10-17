import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

type Draft = { names: string[]; description: string; specifications: string[] };
const schema = { type: "object", properties: { names: { type: "array", items: { type: "string" } }, description: { type: "string" }, specifications: { type: "array", items: { type: "string" } } }, required: ["names", "description", "specifications"], additionalProperties: false };

function localDraft(name: string, brand: string, category: string, specs: string[]): Draft {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const additions: Record<string, string[]> = {
    "Paints & Finishes": ["paint", "finish", "pack size"], "Cement & Building": ["cement", "grade", "bag size"],
    "Roofing & Steel": ["roofing", "sheet profile", "sheet length"], "Fasteners & Fixings": ["fastener", "material", "size"],
    "Site & Hand Tools": ["site tool", "material", "dimensions"],
  };
  const names = cleanName ? [cleanName, `${brand.trim()} ${cleanName}`.trim(), `${cleanName} · ${category}`] : [];
  const description = cleanName ? `${cleanName} from ${brand.trim() || "Rentry Engineering"}, available in ${category.toLowerCase()}. Confirm the exact size, finish and application with our team before ordering.` : "Add a product name and brand to draft a clear, editable description.";
  const suggested = (additions[category] || ["model", "size", "material", "application"]).map((label) => `Confirm ${label} with supplier`);
  return { names: [...new Set(names)].slice(0, 3), description, specifications: specs.length ? specs : suggested };
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 140) : "";
    const brand = typeof body.brand === "string" ? body.brand.trim().slice(0, 80) : "";
    const category = typeof body.category === "string" ? body.category.trim().slice(0, 80) : "Other";
    const specs = Array.isArray(body.specifications) ? body.specifications.filter((value: unknown) => typeof value === "string").slice(0, 20) : [];
    const local = localDraft(name, brand, category, specs);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ...local, source: "quick-draft", note: "For AI-generated drafts, add OPENAI_API_KEY to .env.local. Review suggested technical details before publishing." });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_PRODUCT_ASSIST_MODEL || "gpt-5.4-mini",
        store: false,
        input: [
          { role: "developer", content: "Draft concise ecommerce product copy and product-name completions for a Kenyan engineering and building-supplies shop. Never invent certifications, exact capacities, dimensions, grades, safety claims, warranty terms, or compatibility. Technical specifications must be phrased as short fields for the admin to verify, or reuse supplied specifications only. Return valid JSON matching the schema." },
          { role: "user", content: JSON.stringify({ partialProductName: name, brand, category, suppliedSpecifications: specs }) },
        ],
        text: { format: { type: "json_schema", name: "product_draft", strict: true, schema } },
        max_output_tokens: 350,
      }),
    });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ ...local, source: "quick-draft", note: "AI is unavailable right now. You can still edit this quick draft." });
    const text = typeof result.output_text === "string" ? result.output_text : result.output?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("");
    const draft = JSON.parse(text) as Draft;
    return NextResponse.json({ names: draft.names.slice(0, 3), description: draft.description.slice(0, 2000), specifications: draft.specifications.filter((item) => typeof item === "string").slice(0, 20), source: "ai", note: "AI draft ready. Verify all product-specific details before publishing." });
  } catch {
    return NextResponse.json({ error: "Could not draft product content." }, { status: 400 });
  }
}
