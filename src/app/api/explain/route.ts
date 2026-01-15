import { NextResponse } from "next/server";
import { explainText } from "../../../lib/llm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const result = await explainText(text);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
