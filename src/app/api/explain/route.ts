import { NextResponse } from "next/server";
import { explainText, type ExplainMode } from "../../../lib/llm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      mode?: ExplainMode;
      answers?: string[];
    };
    const text = body.text?.trim();
    const mode = body.mode ?? "normal";
    const answers =
      Array.isArray(body.answers) && body.answers.length
        ? body.answers.map((answer) => answer.trim()).filter(Boolean)
        : undefined;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    if (!["quick", "normal", "kid"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
    }

    const result = await explainText(text, mode, answers);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
