export type ExplainResult = {
  explanation: string;
  summary: string;
  nextSteps: string[];
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function explainText(input: string): Promise<ExplainResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const prompt = `
You are a helpful human who explains confusing text. Follow these rules:
- Write like a helpful human.
- No jargon unless you define it.
- Short paragraphs.
- If input is unclear, say what’s missing instead of guessing.
- Never claim certainty when it’s vague.
- No "as an AI model" language.

Output JSON only with keys:
explanation (2-6 short paragraphs),
summary (1-2 sentences),
nextSteps (1-4 bullet items, as array of strings).

Input:
${input}
  `.trim();

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return JSON only. No extra text." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "LLM request failed");
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from LLM");
  }

  try {
    const parsed = JSON.parse(content) as ExplainResult;
    if (
      !parsed.explanation ||
      !parsed.summary ||
      !Array.isArray(parsed.nextSteps)
    ) {
      throw new Error("Invalid response shape");
    }
    return {
      explanation: parsed.explanation,
      summary: parsed.summary,
      nextSteps: parsed.nextSteps.slice(0, 4),
    };
  } catch (error) {
    throw new Error("Failed to parse LLM response");
  }
}
