import { NextResponse } from "next/server";

type AnalysisPayload = {
  photos?: string[];
  allowedTypes?: string[];
  allowedCategories?: string[];
  allowedStates?: string[];
  allowedDocuments?: string[];
  allowedBrands?: string[];
};

function stripDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

function jsonFromText(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  return JSON.parse(cleaned);
}

function modelCandidates() {
  const configuredModel = process.env.GEMINI_VISION_MODEL?.trim();
  return Array.from(
    new Set([configuredModel, "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"].filter(Boolean))
  ) as string[];
}

function shouldTryNextModel(status: number, message: string) {
  return (
    (status === 400 || status === 404 || status === 429 || status >= 500) &&
    /model|not found|not supported|generatecontent|unsupported|unavailable/i.test(message)
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY manquante. Ajoutez la clé dans Netlify > Site configuration > Environment variables." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as AnalysisPayload;
  const photos = (body.photos ?? [])
    .filter((photo) => photo.startsWith("data:image/"))
    .slice(0, 3)
    .map(stripDataUrl)
    .filter(Boolean) as Array<{ mimeType: string; data: string }>;

  if (!photos.length) {
    return NextResponse.json({ error: "Ajoutez au moins une photo avant l’analyse." }, { status: 400 });
  }

  const prompt = `
Tu aides une équipe objets trouvés en gare. Analyse les photos et propose une saisie, mais ne devine pas les données sensibles.

Règles:
- Réponds seulement en JSON valide, sans texte autour.
- Si plusieurs objets sont visibles dans la même souche, liste-les tous dans "items".
- Ne lis pas les numéros complets de documents d'identité ou cartes bancaires.
- Compte seulement le nombre de cartes bancaires visibles, sans relever leurs numéros.
- Pour les documents, indique seulement le type probable: CNI, passeport, permis, carte bancaire, etc.
- Si tu n'es pas sûr, laisse le champ vide ou mets "À vérifier".
- L'agent humain corrigera toujours avant enregistrement.

Valeurs autorisées pour objectType: ${(body.allowedTypes ?? []).join(", ")}
Valeurs autorisées pour category: ${(body.allowedCategories ?? []).join(", ")}
Valeurs autorisées pour colorState: ${(body.allowedStates ?? []).join(", ")}
Valeurs autorisées pour documents: ${(body.allowedDocuments ?? []).join(", ")}
Marques connues possibles: ${(body.allowedBrands ?? []).join(", ")}

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
  "bankCardCount": 0,
  "documentName": "",
  "confidence": "faible|moyenne|forte"
}
`;

  const requestPayload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          ...photos.map((photo) => ({
            inlineData: {
              mimeType: photo.mimeType,
              data: photo.data
            }
          }))
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  let lastModelError = "Analyse photo impossible avec Gemini.";

  for (const model of modelCandidates()) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error?.message ?? lastModelError;
      lastModelError = message;
      if (shouldTryNextModel(response.status, message)) continue;

      return NextResponse.json({ error: message }, { status: response.status });
    }

    try {
      const text = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("\n") ?? "";
      return NextResponse.json(jsonFromText(text));
    } catch {
      return NextResponse.json(
        { error: "Réponse Gemini illisible. Réessayez avec une photo plus nette." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    { error: `${lastModelError} Aucun modèle Gemini disponible pour l'analyse photo.` },
    { status: 503 }
  );
}
