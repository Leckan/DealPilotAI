"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  DealAnalysis,
  DealInput,
  DealValidationErrors,
  ExitStrategy,
  analyzeDeal,
  createMockSavedDeals,
  emptyDealInput,
  validateDealInput,
} from "@/lib/deal-calculations";
import type { DealInsight } from "@/lib/deal-api";

type AppView = "landing" | "dashboard" | "analyze" | "results" | "deals";

const STORAGE_KEY = "dealpilot.savedDeals";
const CURRENT_DEAL_KEY = "dealpilot.currentDeal";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "New Analysis" },
  { href: "/results", label: "Results" },
  { href: "/deals", label: "Saved Deals" },
];

const exitStrategies: ExitStrategy[] = ["Flip", "Rental", "BRRRR", "Multifamily"];

export function DealPilotApp({ view }: { view: AppView }) {
  const [savedDeals, setSavedDeals] = useState<DealAnalysis[]>([]);
  const [activeDeal, setActiveDeal] = useState<DealAnalysis | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = readDeals();
      setSavedDeals(saved);
      setActiveDeal(readCurrentDeal() ?? saved[0] ?? null);
    });
  }, []);

  function saveDeal(deal: DealAnalysis) {
    const nextDeals = [deal, ...savedDeals.filter((item) => item.id !== deal.id)];
    setSavedDeals(nextDeals);
    setActiveDeal(deal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDeals));
    localStorage.setItem(CURRENT_DEAL_KEY, JSON.stringify(deal));
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <AppShell view={view}>
        {view === "landing" && <Landing savedDeals={savedDeals} />}
        {view === "dashboard" && (
          <Dashboard savedDeals={savedDeals} activeDeal={activeDeal} />
        )}
        {view === "analyze" && <AnalysisForm onSave={saveDeal} />}
        {view === "results" && <Results deal={activeDeal} />}
        {view === "deals" && <SavedDeals deals={savedDeals} onSelect={setActiveDeal} />}
      </AppShell>
    </div>
  );
}

function AppShell({
  children,
  view,
}: {
  children: React.ReactNode;
  view: AppView;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
      <aside className="border-b border-[#dbe7e3] bg-[#073d3a] text-white lg:min-h-screen lg:w-72 lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-7">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#ddf8ef] text-lg font-black text-[#073d3a]">
              DP
            </span>
            <span>
              <span className="block text-lg font-semibold">DealPilot AI</span>
              <span className="block text-xs text-[#a9d4cb]">Investor underwriting</span>
            </span>
          </Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-5 pb-5 lg:block lg:space-y-2 lg:px-4">
          {navItems.map((item) => {
            const isActive = routeMatchesView(item.href, view);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition lg:flex ${
                  isActive
                    ? "bg-white text-[#073d3a]"
                    : "text-[#d3eee8] hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-6 pt-8 lg:block">
          <div className="rounded-lg border border-white/15 bg-white/10 p-4">
            <p className="text-sm font-semibold">MVP mode</p>
            <p className="mt-2 text-sm leading-6 text-[#c7e7e0]">
              Local storage is active. PostgreSQL persistence can replace this layer
              when database credentials are configured.
            </p>
          </div>
        </div>
      </aside>
      <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}

function Landing({ savedDeals }: { savedDeals: DealAnalysis[] }) {
  const featured = savedDeals[0] ?? createMockSavedDeals()[0];

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="py-6">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[#102321] sm:text-5xl lg:text-6xl">
            The AI acquisitions analyst every real estate investor wishes they had.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52635f]">
            Analyze flips, rentals, BRRRR opportunities, and small multifamily deals
            with fast underwriting, clear risk flags, and investor-ready metrics.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-md bg-[#073d3a] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#0b504c]" href="/analyze">
              Analyze a Deal
            </Link>
            <Link className="rounded-md border border-[#c6d7d3] bg-white px-5 py-3 text-center text-sm font-semibold text-[#173b37] hover:border-[#7fb5aa]" href="/dashboard">
              View Dashboard
            </Link>
          </div>
        </div>
        <DealSummaryPanel deal={featured} />
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["4", "Exit strategies"],
          ["10", "Core metrics"],
          ["0-100", "Deal score"],
          ["Local", "Saved deals"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
            <p className="text-3xl font-semibold text-[#073d3a]">{value}</p>
            <p className="mt-1 text-sm font-medium text-[#60716d]">{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Dashboard({
  savedDeals,
  activeDeal,
}: {
  savedDeals: DealAnalysis[];
  activeDeal: DealAnalysis | null;
}) {
  const deals = savedDeals.length ? savedDeals : createMockSavedDeals();
  const bestDeal = activeDeal ?? deals[0];
  const averageScore = Math.round(
    deals.reduce((sum, deal) => sum + deal.dealScore, 0) / deals.length,
  );

  return (
    <div className="space-y-7">
      <PageHeader
        title="Investor Dashboard"
        description="Track acquisition quality, risk, and expected returns across your active pipeline."
        actionHref="/analyze"
        actionLabel="New Deal"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pipeline Deals" value={deals.length.toString()} />
        <MetricCard label="Average Score" value={averageScore.toString()} tone="teal" />
        <MetricCard label="Top Profit" value={formatCurrency(Math.max(...deals.map((deal) => deal.estimatedProfit)))} tone="green" />
        <MetricCard label="Best DSCR" value={Math.max(...deals.map((deal) => deal.dscr)).toFixed(2)} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent underwriting</h2>
            <Link href="/deals" className="text-sm font-semibold text-[#0b625c]">View all</Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#e2ece9]">
            {deals.slice(0, 5).map((deal) => (
              <DealRow key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
        <DealSummaryPanel deal={bestDeal} />
      </div>
    </div>
  );
}

function AnalysisForm({ onSave }: { onSave: (deal: DealAnalysis) => void }) {
  const router = useRouter();
  const [input, setInput] = useState<DealInput>(emptyDealInput);
  const [errors, setErrors] = useState<DealValidationErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preview = useMemo(() => analyzeDeal(input), [input]);

  function updateField<K extends keyof DealInput>(field: K, value: DealInput[K]) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const nextErrors = validateDealInput(input);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/deals/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as {
        data?: DealAnalysis;
        errors?: DealValidationErrors;
      };

      if (!response.ok) {
        setErrors(payload.errors ?? {});
        setSubmitError("Please review the highlighted assumptions.");
        return;
      }

      if (!payload.data) {
        setSubmitError("DealPilot could not generate an analysis. Please try again.");
        return;
      }

      onSave(payload.data);
      router.push("/results");
    } catch {
      setSubmitError("Analysis service is unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <form onSubmit={submit} className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
        <PageHeader
          title="New Deal Analysis"
          description="Enter the core deal assumptions and DealPilot will calculate the investor metrics."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Property address" error={errors.address} className="md:col-span-2">
            <input value={input.address} onChange={(event) => updateField("address", event.target.value)} className={inputClass(errors.address)} placeholder="123 Main St, Phoenix, AZ" />
          </Field>
          <NumberField label="Purchase price" value={input.purchasePrice} error={errors.purchasePrice} onChange={(value) => updateField("purchasePrice", value)} />
          <NumberField label="ARV" value={input.arv} error={errors.arv} onChange={(value) => updateField("arv", value)} />
          <NumberField label="Rehab budget" value={input.rehabBudget} error={errors.rehabBudget} onChange={(value) => updateField("rehabBudget", value)} />
          <NumberField label="Monthly rent" value={input.monthlyRent} error={errors.monthlyRent} onChange={(value) => updateField("monthlyRent", value)} />
          <NumberField label="Annual taxes" value={input.annualTaxes} error={errors.annualTaxes} onChange={(value) => updateField("annualTaxes", value)} />
          <NumberField label="Annual insurance" value={input.annualInsurance} error={errors.annualInsurance} onChange={(value) => updateField("annualInsurance", value)} />
          <NumberField label="Loan amount" value={input.loanAmount} error={errors.loanAmount} onChange={(value) => updateField("loanAmount", value)} />
          <NumberField label="Interest rate" value={input.interestRate} error={errors.interestRate} step="0.01" onChange={(value) => updateField("interestRate", value)} />
          <NumberField label="Holding period (months)" value={input.holdingPeriod} error={errors.holdingPeriod} onChange={(value) => updateField("holdingPeriod", value)} />
          <Field label="Exit strategy">
            <select value={input.exitStrategy} onChange={(event) => updateField("exitStrategy", event.target.value as ExitStrategy)} className={inputClass()}>
              {exitStrategies.map((strategy) => (
                <option key={strategy}>{strategy}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="rounded-md bg-[#073d3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b504c] disabled:cursor-not-allowed disabled:bg-[#6d8985]" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Analyzing..." : "Analyze Deal"}
          </button>
          <button className="rounded-md border border-[#c6d7d3] bg-white px-5 py-3 text-sm font-semibold text-[#173b37]" type="button" onClick={() => setInput(emptyDealInput)}>
            Reset
          </button>
        </div>
        {submitError ? (
          <p className="mt-4 rounded-md border border-[#f3a29b] bg-[#fff4f2] px-3 py-2 text-sm font-semibold text-[#b42318]">
            {submitError}
          </p>
        ) : null}
      </form>
      <DealSummaryPanel deal={preview} label="Live preview" />
    </div>
  );
}

function Results({ deal }: { deal: DealAnalysis | null }) {
  const [insight, setInsight] = useState<DealInsight | null>(null);
  const [insightError, setInsightError] = useState("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportError, setExportError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  async function askAiAboutDeal() {
    if (!deal) return;

    setInsightError("");
    setIsInsightLoading(true);

    try {
      const response = await fetch("/api/deals/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deal),
      });
      const payload = (await response.json()) as { data?: DealInsight };

      if (!response.ok || !payload.data) {
        setInsightError("DealPilot AI could not generate insights. Please try again.");
        return;
      }

      setInsight(payload.data);
    } catch {
      setInsightError("DealPilot AI is unavailable. Please try again.");
    } finally {
      setIsInsightLoading(false);
    }
  }

  async function exportDealMemo() {
    if (!deal) return;

    setExportStatus("");
    setExportError("");
    setIsExporting(true);

    try {
      const response = await fetch("/api/deals/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deal),
      });
      const payload = (await response.json()) as {
        data?: {
          filename: string;
          contentType: string;
          html: string;
        };
      };

      if (!response.ok || !payload.data) {
        setExportError("DealPilot could not generate the memo. Please try again.");
        return;
      }

      const blob = new Blob([payload.data.html], {
        type: `${payload.data.contentType};charset=utf-8`,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = payload.data.filename;
      link.click();
      URL.revokeObjectURL(url);
      setExportStatus("Memo downloaded. Open it in your browser and print to PDF.");
    } catch {
      setExportError("Export service is unavailable. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  if (!deal) {
    return (
      <EmptyState
        title="No analyzed deal yet"
        description="Run a new deal analysis to generate the full results page."
        href="/analyze"
        action="Analyze a Deal"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deal Results"
        description={deal.address}
        actionHref="/analyze"
        actionLabel="Analyze Another"
      />
      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <DealScoreCard deal={deal} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Max allowable offer" value={formatCurrency(deal.maxAllowableOffer)} tone="teal" />
          <MetricCard label="Estimated profit" value={formatCurrency(deal.estimatedProfit)} tone="green" />
          <MetricCard label="ROI" value={`${deal.roi}%`} />
          <MetricCard label="Monthly cash flow" value={formatCurrency(deal.monthlyCashFlow)} tone="green" />
          <MetricCard label="NOI" value={formatCurrency(deal.noi)} />
          <MetricCard label="Cap rate" value={`${deal.capRate}%`} />
          <MetricCard label="Cash-on-cash" value={`${deal.cashOnCashReturn}%`} />
          <MetricCard label="DSCR" value={deal.dscr.toFixed(2)} tone="amber" />
          <MetricCard label="Strategy" value={deal.exitStrategy} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AiInsightPanel
          insight={insight}
          error={insightError}
          isLoading={isInsightLoading}
          onAsk={askAiAboutDeal}
        />
        <ExportPanel
          status={exportStatus}
          error={exportError}
          isExporting={isExporting}
          onExport={exportDealMemo}
        />
      </div>
    </div>
  );
}

function SavedDeals({
  deals,
  onSelect,
}: {
  deals: DealAnalysis[];
  onSelect: (deal: DealAnalysis) => void;
}) {
  const router = useRouter();
  const displayDeals = deals.length ? deals : createMockSavedDeals();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Deals"
        description="Review prior analyses stored locally in this MVP."
        actionHref="/analyze"
        actionLabel="New Analysis"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {displayDeals.map((deal) => (
          <button
            key={deal.id}
            className="rounded-lg border border-[#dbe7e3] bg-white p-5 text-left shadow-sm transition hover:border-[#94c9bf] hover:shadow-md"
            onClick={() => {
              onSelect(deal);
              localStorage.setItem(CURRENT_DEAL_KEY, JSON.stringify(deal));
              router.push("/results");
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[#17211f]">{deal.address}</p>
                <p className="mt-1 text-sm text-[#60716d]">{deal.exitStrategy} • {formatCurrency(deal.purchasePrice)} purchase</p>
              </div>
              <span className={recommendationClass(deal.recommendation)}>{deal.recommendation}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MiniMetric label="Score" value={deal.dealScore.toString()} />
              <MiniMetric label="Profit" value={formatCurrency(deal.estimatedProfit)} />
              <MiniMetric label="Cash flow" value={formatCurrency(deal.monthlyCashFlow)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DealSummaryPanel({
  deal,
  label = "Featured analysis",
}: {
  deal: DealAnalysis;
  label?: string;
}) {
  return (
    <div className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#60716d]">{label}</p>
          <h2 className="mt-2 text-xl font-semibold text-[#17211f]">{deal.address}</h2>
        </div>
        <span className={recommendationClass(deal.recommendation)}>{deal.recommendation}</span>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-[160px_1fr]">
        <ScoreRing score={deal.dealScore} />
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="Profit" value={formatCurrency(deal.estimatedProfit)} />
          <MiniMetric label="ROI" value={`${deal.roi}%`} />
          <MiniMetric label="Cash flow" value={formatCurrency(deal.monthlyCashFlow)} />
          <MiniMetric label="DSCR" value={deal.dscr.toFixed(2)} />
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-[#f2f7f5] p-4">
        <p className="text-sm font-semibold text-[#173b37]">Risk level: {deal.riskLevel}</p>
        <p className="mt-1 text-sm leading-6 text-[#60716d]">
          Mock underwriting based on user-entered assumptions. Future versions can
          pull property records, rent comps, lender terms, and AI memo generation.
        </p>
      </div>
    </div>
  );
}

function DealScoreCard({ deal }: { deal: DealAnalysis }) {
  return (
    <div className="rounded-lg border border-[#dbe7e3] bg-[#073d3a] p-6 text-white shadow-sm">
      <p className="text-sm font-semibold text-[#bfe6de]">Recommendation</p>
      <h2 className="mt-2 text-3xl font-semibold">{deal.recommendation}</h2>
      <div className="mt-7 flex justify-center">
        <ScoreRing score={deal.dealScore} dark />
      </div>
      <div className="mt-7 rounded-lg bg-white/10 p-4">
        <p className="text-sm font-semibold">Risk level: {deal.riskLevel}</p>
        <p className="mt-2 text-sm leading-6 text-[#d3eee8]">
          Score blends profitability, income strength, leverage coverage, and
          strategy fit into a practical acquisition signal.
        </p>
      </div>
    </div>
  );
}

function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#102321]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#60716d]">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link className="rounded-md bg-[#073d3a] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#0b504c]" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "teal" | "green" | "amber";
}) {
  const toneClass = {
    neutral: "text-[#17211f]",
    teal: "text-[#073d3a]",
    green: "text-[#087f5b]",
    amber: "text-[#a16207]",
  }[tone];

  return (
    <div className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#60716d]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

function DealRow({ deal }: { deal: DealAnalysis }) {
  return (
    <Link href="/results" onClick={() => localStorage.setItem(CURRENT_DEAL_KEY, JSON.stringify(deal))} className="grid gap-3 border-b border-[#e2ece9] bg-white p-4 last:border-b-0 hover:bg-[#f7faf9] md:grid-cols-[1fr_110px_120px_120px] md:items-center">
      <div>
        <p className="font-semibold text-[#17211f]">{deal.address}</p>
        <p className="mt-1 text-sm text-[#60716d]">{deal.exitStrategy}</p>
      </div>
      <MiniMetric label="Score" value={deal.dealScore.toString()} />
      <MiniMetric label="Profit" value={formatCurrency(deal.estimatedProfit)} />
      <span className={recommendationClass(deal.recommendation)}>{deal.recommendation}</span>
    </Link>
  );
}

function ScoreRing({ score, dark = false }: { score: number; dark?: boolean }) {
  const background = dark ? "#2e6862" : "#dcebe7";
  const foreground = score >= 78 ? "#10b981" : score >= 55 ? "#d99b20" : "#ef4444";

  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${foreground} ${score * 3.6}deg, ${background} 0deg)`,
      }}
      aria-label={`Deal score ${score} out of 100`}
    >
      <div className={`grid h-28 w-28 place-items-center rounded-full ${dark ? "bg-[#073d3a]" : "bg-white"}`}>
        <div className="text-center">
          <p className={`text-4xl font-semibold ${dark ? "text-white" : "text-[#102321]"}`}>{score}</p>
          <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#bfe6de]" : "text-[#60716d]"}`}>Deal score</p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-[#263a36]">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-1 block text-sm font-medium text-[#b42318]">{error}</span> : null}
    </label>
  );
}

function NumberField({
  label,
  value,
  error,
  step = "1",
  onChange,
}: {
  label: string;
  value: number;
  error?: string;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label} error={error}>
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className={inputClass(error)} />
    </Field>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8c88]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#17211f]">{value}</p>
    </div>
  );
}

function AiInsightPanel({
  insight,
  error,
  isLoading,
  onAsk,
}: {
  insight: DealInsight | null;
  error: string;
  isLoading: boolean;
  onAsk: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#17211f]">Ask AI about this deal</h3>
          <p className="mt-2 text-sm leading-6 text-[#60716d]">
            Generate mock acquisition notes, downside risks, and next steps from
            the current deal metrics.
          </p>
        </div>
        <button
          className="rounded-md bg-[#073d3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b504c] disabled:cursor-not-allowed disabled:bg-[#6d8985]"
          type="button"
          onClick={onAsk}
          disabled={isLoading}
        >
          {isLoading ? "Thinking..." : "Ask AI"}
        </button>
      </div>
      {error ? (
        <p className="mt-4 rounded-md border border-[#f3a29b] bg-[#fff4f2] px-3 py-2 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      ) : null}
      {insight ? (
        <div className="mt-5 space-y-4">
          <p className="rounded-lg bg-[#eef8f5] p-4 text-sm leading-6 text-[#173b37]">
            {insight.summary}
          </p>
          <InsightList title="Strengths" items={insight.strengths} />
          <InsightList title="Watchouts" items={insight.watchouts} />
          <InsightList title="Next steps" items={insight.nextSteps} />
        </div>
      ) : null}
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#17211f]">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-[#60716d]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b625c]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExportPanel({
  status,
  error,
  isExporting,
  onExport,
}: {
  status: string;
  error: string;
  isExporting: boolean;
  onExport: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#dbe7e3] bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#17211f]">Export PDF</h3>
      <p className="mt-2 text-sm leading-6 text-[#60716d]">
        Download a PDF-ready investor memo with assumptions, metrics, recommendation,
        watchouts, and next steps.
      </p>
      {/* Future integration: connect PDF generation to a server route that
          renders a branded memo and persists export history. */}
      <button
        className="mt-5 rounded-md bg-[#073d3a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b504c] disabled:cursor-not-allowed disabled:bg-[#6d8985]"
        type="button"
        onClick={onExport}
        disabled={isExporting}
      >
        {isExporting ? "Generating..." : "Download Memo"}
      </button>
      {status ? (
        <p className="mt-4 rounded-md border border-[#b7e3d9] bg-[#eef8f5] px-3 py-2 text-sm font-semibold text-[#0b625c]">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md border border-[#f3a29b] bg-[#fff4f2] px-3 py-2 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-lg border border-[#dbe7e3] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[#102321]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#60716d]">{description}</p>
        <Link href={href} className="mt-6 inline-flex rounded-md bg-[#073d3a] px-5 py-3 text-sm font-semibold text-white">
          {action}
        </Link>
      </div>
    </div>
  );
}

function readDeals() {
  if (typeof window === "undefined") return [];

  try {
    // Future integration: replace localStorage with PostgreSQL-backed deal
    // persistence once database credentials and auth are configured.
    const rawDeals = localStorage.getItem(STORAGE_KEY);
    if (!rawDeals) {
      const starterDeals = createMockSavedDeals();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterDeals));
      return starterDeals;
    }

    return JSON.parse(rawDeals) as DealAnalysis[];
  } catch {
    return createMockSavedDeals();
  }
}

function readCurrentDeal() {
  if (typeof window === "undefined") return null;

  try {
    const rawDeal = localStorage.getItem(CURRENT_DEAL_KEY);
    return rawDeal ? (JSON.parse(rawDeal) as DealAnalysis) : null;
  } catch {
    return null;
  }
}

function routeMatchesView(href: string, view: AppView) {
  return (
    (href === "/dashboard" && view === "dashboard") ||
    (href === "/analyze" && view === "analyze") ||
    (href === "/results" && view === "results") ||
    (href === "/deals" && view === "deals")
  );
}

function inputClass(error?: string) {
  return `w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#17211f] outline-none transition focus:ring-3 ${
    error
      ? "border-[#f3a29b] focus:border-[#b42318] focus:ring-[#fce7e5]"
      : "border-[#cbdad6] focus:border-[#0b625c] focus:ring-[#d9f3ed]"
  }`;
}

function recommendationClass(recommendation: string) {
  const classes: Record<string, string> = {
    "Strong Buy": "bg-[#dcfce7] text-[#166534]",
    Maybe: "bg-[#fef3c7] text-[#92400e]",
    Avoid: "bg-[#fee2e2] text-[#991b1b]",
  };

  return `inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${classes[recommendation]}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
