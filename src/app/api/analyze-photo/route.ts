import { NextResponse } from "next/server";

type AnalysisPayload = {
  photos?: string[];
  allowedTypes?: string[];
  allowedCategories?: string[];
  allowedStates?: string[];
  allowedDocuments?: string[];
};

function extractOutputText(data: unknown) {
  if (typeof data !== "object" || data === null) return "";
  const maybe = data as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown; type?: string }> }> };
  if (typeof maybe.output_text === "string") return maybe.output_text;
  return (
    maybe.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => (typeof content.text === "string" ? content.text : ""))
      .join("\n") ?? ""
  );
}

function jsonFromText(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY manquante. Ajoutez la clé dans Netlify ou dans .env." }, { status: 503 });
  }

  const body = (await request.json()) as AnalysisPayload;
  const photos = (body.photos ?? []).filter((photo) => photo.startsWith("data:image/")).slice(0, 3);
  if (!photos.length) {
    return NextResponse.json({ error: "Ajoutez au moins une photo avant l’analyse." }, { status: 400 });
  }

  const prompt = `
Tu aides une équipe objets trouvés en gare. Analyse les photos et propose une saisie, mais ne devine pas les données sensibles.

Règles:
- Réponds seulement en JSON valide.
- Si plusieurs objets sont visibles dans la même souche, liste-les tous dans "items".
- Ne lis pas les numéros complets de documents d'identité ou cartes bancaires.
- Pour les documents, indique seulement le type probable: CNI, passeport, permis, carte bancaire, etc.
- Si tu n'es pas sûr, laisse le champ vide ou mets "À vérifier".
- L'agent humain corrigera toujours avant enregistrement.

Valeurs autorisées pour objectType: ${(body.allowedTypes ?? []).join(", ")}
Valeurs autorisées pour category: ${(body.allowedCategories ?? []).join(", ")}
Valeurs autorisées pour colorState: ${(body.allowedStates ?? []).join(", ")}
Valeurs autorisées pour documents: ${(body.allowedDocuments ?? []).join(", ")}

Format JSON:
{
  "objectType": "",
  "category": "",
  "colorState": "",
  "brand": "",
  "description": "",
  "items": [
    { "name": "", "color": "", "brand": "", "quantity": "1", "notes": "" }
  ],
  "documents": [],
  "hasMoney": false,
  "moneyAmount": "",
  "documentName": "",
  "confidence": "faible|moyenne|forte"
}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...photos.map((photo) => ({
              type: "input_image",
              image_url: photo
            }))
          ]
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data.error?.message ?? "Analyse photo impossible." }, { status: response.status });
  }

  try {
    return NextResponse.json(jsonFromText(extractOutputText(data)));
  } catch {
    return NextResponse.json({ error: "L’analyse a répondu dans un format inattendu." }, { status: 502 });
  }
}
