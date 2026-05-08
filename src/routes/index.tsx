import { createFileRoute } from "@tanstack/react-router";
import { useState, FormEvent } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "News Summarizer" },
      { name: "description", content: "Get AI-summarized news delivered to your inbox by domain." },
    ],
  }),
});

const WEBHOOK_URL = "https://nilyaaa.app.n8n.cloud/webhook/news-summarizer";

const DOMAIN_OPTIONS = [
  { label: "Technology", value: "technology" },
  { label: "Business", value: "business" },
  { label: "Sports", value: "sports" },
  { label: "Health", value: "health" },
  { label: "Political", value: "political" },
];

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Record<string, unknown> }
  | { status: "error"; message: string; httpStatus?: number };

function formatKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function Index() {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<ResultState>({ status: "idle" });

  const submit = async () => {
    setResult({ status: "loading" });
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, domain }),
      });

      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setResult({
          status: "error",
          message: "Server returned a non-JSON response.",
          httpStatus: res.status,
        });
        return;
      }

      if (!res.ok) {
        setResult({
          status: "error",
          message:
            (data && typeof data === "object" && "message" in data && typeof (data as Record<string, unknown>).message === "string"
              ? ((data as Record<string, unknown>).message as string)
              : `Request failed with status ${res.status}.`),
          httpStatus: res.status,
        });
        return;
      }

      // Normalize: arrays with one object → unwrap; ensure object
      let obj: Record<string, unknown> = {};
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
        obj = data[0] as Record<string, unknown>;
      } else if (data && typeof data === "object") {
        obj = data as Record<string, unknown>;
      }
      setResult({ status: "success", data: obj });
    } catch (err) {
      setResult({
        status: "error",
        message: err instanceof Error ? err.message : "Network error. Please try again.",
      });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !domain) return;
    submit();
  };

  const reset = () => {
    setEmail("");
    setDomain("");
    setResult({ status: "idle" });
  };

  const isLoading = result.status === "loading";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 md:py-20">
        <header className="space-y-3 text-center">
          <span className="inline-block rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Powered by n8n + AI
          </span>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">News Summarizer</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Pick a topic and we'll email you an AI-summarized news digest.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="domain" className="block text-sm font-medium">
                Select News Domain <span className="text-destructive">*</span>
              </label>
              <select
                id="domain"
                name="domain"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="" disabled>
                  Choose a domain…
                </option>
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !domain}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Sending…
                </>
              ) : (
                "Get my news summary"
              )}
            </button>
          </form>
        </section>

        <section aria-live="polite">
          {result.status === "success" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Result</h2>
                <button
                  onClick={reset}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground"
                >
                  Run again
                </button>
              </div>

              {Object.keys(result.data).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data returned.</p>
              ) : (
                <dl className="divide-y divide-border">
                  {Object.entries(result.data).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-1 gap-1 py-3 md:grid-cols-3 md:gap-4">
                      <dt className="text-sm font-medium text-muted-foreground">{formatKey(k)}</dt>
                      <dd className="text-sm md:col-span-2">
                        <pre className="whitespace-pre-wrap break-words font-sans">{formatValue(v)}</pre>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {result.status === "error" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm md:p-8">
              <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
              <p className="mt-2 text-sm text-foreground">
                {result.message}
                {result.httpStatus ? ` (status ${result.httpStatus})` : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={submit}
                  disabled={!email || !domain}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  Retry
                </button>
                <button
                  onClick={reset}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
