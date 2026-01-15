"use client";

import { useState } from "react";

type ExplainResult = {
  explanation: string;
  summary: string;
  nextSteps: string[];
};

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please paste some text to explain.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Something went wrong.");
      }

      const data = (await res.json()) as ExplainResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const textToCopy = [
      "Plain English Explanation",
      result.explanation,
      "",
      "Short Summary",
      result.summary,
      "",
      "What this means for you",
      ...result.nextSteps.map((step) => `- ${step}`),
    ].join("\n");

    await navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Explain it like I&apos;m not stupid
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Paste confusing text and get a clear, honest explanation.
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <label className="text-sm font-medium text-slate-700">
            Confusing text
          </label>
          <textarea
            className="mt-2 h-48 w-full rounded-md border border-slate-300 p-3 text-base outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            placeholder="Example: The insurer may deny coverage if material misrepresentation is found in the application or underwriting file..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="mt-2 text-sm text-slate-500">
            Don&apos;t paste passwords or private info.
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleExplain}
              disabled={loading}
            >
              {loading ? "Thinking…" : "Explain this"}
            </button>
            <button
              className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              onClick={handleCopy}
              disabled={!result}
            >
              Copy result
            </button>
            {error ? (
              <span className="text-sm text-red-600">{error}</span>
            ) : null}
          </div>
        </section>

        {result ? (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold">
                Plain English Explanation
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                {result.explanation}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold">Short Summary</h2>
              <p className="mt-2 text-sm text-slate-700">{result.summary}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold">
                What this means for you
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                {result.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
