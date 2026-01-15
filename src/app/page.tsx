"use client";

import { useState } from "react";

type ExplainResult = {
  explanation: string;
  summary: string;
  nextSteps: string[];
  needsClarification: boolean;
  questions?: string[];
};

type ExplainMode = "quick" | "normal" | "kid";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ExplainMode>("normal");
  const [answers, setAnswers] = useState<string[]>([]);

  const handleExplain = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please paste some text to explain.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers([]);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, mode }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Something went wrong.");
      }

      const data = (await res.json()) as ExplainResult;
      setResult(data);
      if (data.needsClarification && data.questions?.length) {
        setAnswers(data.questions.map(() => ""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExplanation = async () => {
    const trimmed = text.trim();
    if (!trimmed || !result?.questions?.length) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, mode, answers }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Something went wrong.");
      }

      const data = (await res.json()) as ExplainResult;
      setResult(data);
      if (data.needsClarification && data.questions?.length) {
        setAnswers(data.questions.map(() => ""));
      } else {
        setAnswers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
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

  const handleCopyForTexting = async () => {
    if (!result) return;
    const textToCopy = [
      "Plain English Explanation",
      result.explanation,
      "",
      "Short Summary",
      result.summary,
      "",
      "Next steps",
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
          <div className="mb-4">
            <span className="text-sm font-medium text-slate-700">
              Explanation mode
            </span>
            <div className="mt-2 inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  { id: "quick", label: "Quick" },
                  { id: "normal", label: "Normal" },
                  { id: "kid", label: "Explain like I'm 12" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  className={`rounded-md px-3 py-1 text-sm ${
                    mode === option.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                  onClick={() => setMode(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
            <button
              className="rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              onClick={handleCopyForTexting}
              disabled={!result}
            >
              Copy for texting
            </button>
            {error ? (
              <span className="text-sm text-red-600">{error}</span>
            ) : null}
          </div>
        </section>

        {result ? (
          <section className="mt-8 grid gap-4">
            {result.needsClarification && result.questions?.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-slate-900">
                <h2 className="text-base font-semibold">Quick questions</h2>
                <div className="mt-3 space-y-3">
                  {result.questions.map((question, index) => (
                    <label key={question} className="block text-sm">
                      <span className="font-medium">{question}</span>
                      <input
                        className="mt-2 w-full rounded-md border border-amber-200 bg-white p-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        value={answers[index] ?? ""}
                        onChange={(event) =>
                          handleAnswerChange(index, event.target.value)
                        }
                        type="text"
                      />
                    </label>
                  ))}
                  <button
                    className="rounded-md bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                    onClick={handleUpdateExplanation}
                    disabled={
                      loading || answers.some((answer) => !answer.trim())
                    }
                  >
                    {loading ? "Thinking…" : "Update explanation"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
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
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
