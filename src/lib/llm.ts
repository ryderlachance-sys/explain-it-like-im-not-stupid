export type ExplainMode = "quick" | "normal" | "kid";

export type ExplainResult = {
  explanation: string;
  summary: string;
  nextSteps: string[];
  needsClarification: boolean;
  questions?: string[];
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function explainText(
  input: string,
  mode: ExplainMode,
): Promise<ExplainResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const modeGuidance = {
    quick: "Be brief and direct. Use the shortest helpful wording.",
    normal: "Be clear and balanced. Keep it easy to read.",
    kid: "Explain like I'm 12. Use very simple words and friendly tone.",
  }[mode];

  const prompt = `
You are a helpful human who explains confusing text. Follow these rules:
- Write like a helpful human.
- No jargon unless you define it.
- Short paragraphs.
- If input is unclear, say what’s missing instead of guessing.
- Never claim certainty when it’s vague.
- No "as an AI model" language.
- If the input is vague or missing context, set needsClarification to true and ask 1-2 questions.

Output JSON only with keys:
explanation (2-6 short paragraphs),
summary (1-2 sentences),
nextSteps (1-4 bullet items, as array of strings).
needsClarification (boolean),
questions (optional array of 1-2 strings).

Mode guidance:
${modeGuidance}

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
      !Array.isArray(parsed.nextSteps) ||
      typeof parsed.needsClarification !== "boolean"
    ) {
      throw new Error("Invalid response shape");
    }

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.slice(0, 2)
      : undefined;

    return {
      explanation: parsed.explanation,
      summary: parsed.summary,
      nextSteps: parsed.nextSteps.slice(0, 4),
      needsClarification: parsed.needsClarification,
      questions,
    };
  } catch (error) {
    throw new Error("Failed to parse LLM response");
  }
}
