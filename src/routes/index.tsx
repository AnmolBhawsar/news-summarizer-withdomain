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
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Decorative orbs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-3xl animate-pulse-glow" />

      <main className="relative mx-auto flex max-w-2xl flex-col gap-10 px-4 py-14 md:py-24">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            Daily AI-curated digest
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            <span className="text-gradient">News, summarized</span>
            <br />
            <span className="text-foreground/90">straight to your inbox.</span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground md:text-base">
            Pick a topic and we'll send a clean, AI-summarized news digest to your email.
          </p>
        </header>

        <section className="glass shadow-card rounded-2xl p-6 md:p-8 animate-float" style={{ animationDuration: "10s" }}>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground/90">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="domain" className="block text-sm font-medium text-foreground/90">
                Select News Domain <span className="text-destructive">*</span>
              </label>
              <select
                id="domain"
                name="domain"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-border bg-background/40 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              >
                <option value="" disabled>
                  Choose a domain…
                </option>
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !domain}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Sending…
                </>
              ) : (
                <>
                  ✨ Get my news summary
                </>
              )}
            </button>
          </form>
        </section>

        <section aria-live="polite">
          {result.status === "success" && (
            <div className="glass shadow-card rounded-2xl p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gradient">Result</h2>
                <button
                  onClick={reset}
                  className="rounded-lg border border-border bg-background/40 px-3 py-1.5 text-xs font-medium transition hover:bg-accent/20"
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
                        <pre className="whitespace-pre-wrap break-words font-sans text-foreground/90">{formatValue(v)}</pre>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {result.status === "error" && (
            <div className="glass rounded-2xl border-destructive/40 p-6 md:p-8" style={{ borderColor: "oklch(0.65 0.24 20 / 0.4)" }}>
              <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
              <p className="mt-2 text-sm text-foreground/90">
                {result.message}
                {result.httpStatus ? ` (status ${result.httpStatus})` : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={submit}
                  disabled={!email || !domain}
                  className="rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
                >
                  Retry
                </button>
                <button
                  onClick={reset}
                  className="rounded-lg border border-border bg-background/40 px-3 py-1.5 text-xs font-medium transition hover:bg-accent/20"
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
