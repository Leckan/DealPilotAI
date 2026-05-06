import type {
  DealAnalysis,
  DealInput,
  DealValidationErrors,
} from "./deal-calculations.ts";
import { analyzeDeal, validateDealInput } from "./deal-calculations.ts";

export type DealAnalysisApiResponse =
  | {
      ok: true;
      status: 201;
      data: DealAnalysis;
    }
  | {
      ok: false;
      status: 400;
      errors: DealValidationErrors;
    };

export type DealInsight = {
  summary: string;
  strengths: string[];
  watchouts: string[];
  nextSteps: string[];
};

export type DealInsightApiResponse = {
  ok: true;
  status: 200;
  data: DealInsight;
};

export type DealMemo = {
  filename: string;
  contentType: "text/html";
  html: string;
};

export type DealMemoApiResponse = {
  ok: true;
  status: 200;
  data: DealMemo;
};

export function createDealAnalysisResponse(
  payload: unknown,
): DealAnalysisApiResponse {
  const input = normalizeDealInput(payload);
  const errors = validateDealInput(input);

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      status: 400,
      errors,
    };
  }

  // Future integration: enrich this server boundary with property records,
  // rent comps, repair estimates, financing quotes, and AI narrative analysis.
  return {
    ok: true,
    status: 201,
    data: analyzeDeal(input),
  };
}

export function createDealInsightResponse(
  deal: DealAnalysis,
): DealInsightApiResponse {
  // Future integration: replace this deterministic mock analyst with an AI model
  // call that can consider comps, property history, market data, and user goals.
  const strengths = buildStrengths(deal);
  const watchouts = buildWatchouts(deal);
  const nextSteps = buildNextSteps(deal);

  return {
    ok: true,
    status: 200,
    data: {
      summary: `${deal.recommendation}: DealPilot scores this ${deal.exitStrategy.toLowerCase()} at ${deal.dealScore}/100 with ${deal.riskLevel.toLowerCase()} risk. The current assumptions point to ${formatCurrency(deal.estimatedProfit)} in projected profit and ${formatCurrency(deal.monthlyCashFlow)} in monthly cash flow.`,
      strengths,
      watchouts,
      nextSteps,
    },
  };
}

export function createDealMemoResponse(deal: DealAnalysis): DealMemoApiResponse {
  const insight = createDealInsightResponse(deal).data;
  const filename = `dealpilot-${slugify(deal.address)}.html`;

  // Future integration: replace this HTML memo with a true PDF renderer such as
  // Playwright PDF, React PDF, or a queue-backed document generation service.
  return {
    ok: true,
    status: 200,
    data: {
      filename,
      contentType: "text/html",
      html: renderInvestorMemo(deal, insight),
    },
  };
}

function normalizeDealInput(payload: unknown): DealInput {
  const record =
    payload && typeof payload === "object" ? (payload as Partial<DealInput>) : {};

  return {
    address: String(record.address ?? ""),
    purchasePrice: Number(record.purchasePrice ?? 0),
    arv: Number(record.arv ?? 0),
    rehabBudget: Number(record.rehabBudget ?? 0),
    monthlyRent: Number(record.monthlyRent ?? 0),
    annualTaxes: Number(record.annualTaxes ?? 0),
    annualInsurance: Number(record.annualInsurance ?? 0),
    loanAmount: Number(record.loanAmount ?? 0),
    interestRate: Number(record.interestRate ?? 0),
    holdingPeriod: Number(record.holdingPeriod ?? 0),
    exitStrategy: isExitStrategy(record.exitStrategy)
      ? record.exitStrategy
      : "Flip",
  };
}

function buildStrengths(deal: DealAnalysis) {
  const strengths: string[] = [];

  if (deal.estimatedProfit > 25000) {
    strengths.push(
      `Projected profit of ${formatCurrency(deal.estimatedProfit)} gives the deal a workable upside cushion.`,
    );
  }

  if (deal.monthlyCashFlow > 0) {
    strengths.push(
      `Positive monthly cash flow of ${formatCurrency(deal.monthlyCashFlow)} supports hold optionality.`,
    );
  }

  if (deal.dscr >= 1.2) {
    strengths.push(`DSCR of ${deal.dscr.toFixed(2)} suggests the rent can cover debt service with room to spare.`);
  }

  if (deal.purchasePrice <= deal.maxAllowableOffer) {
    strengths.push("Purchase price is at or below the 70% ARV max allowable offer target.");
  }

  return strengths.length
    ? strengths
    : ["The deal has a complete underwriting profile and can be compared against better pipeline opportunities."];
}

function buildWatchouts(deal: DealAnalysis) {
  const watchouts: string[] = [];

  if (deal.purchasePrice > deal.maxAllowableOffer) {
    watchouts.push(
      `Offer is ${formatCurrency(deal.purchasePrice - deal.maxAllowableOffer)} above the max allowable offer target, compressing margin.`,
    );
  }

  if (deal.roi < 12) {
    watchouts.push(`ROI of ${deal.roi}% leaves limited margin for rehab overruns or resale slippage.`);
  }

  if (deal.monthlyCashFlow < 0) {
    watchouts.push(
      `Negative monthly cash flow of ${formatCurrency(deal.monthlyCashFlow)} increases carry risk.`,
    );
  }

  if (deal.dscr < 1.15) {
    watchouts.push(`DSCR of ${deal.dscr.toFixed(2)} is thin for a leveraged rental or BRRRR hold.`);
  }

  if (watchouts.length === 0) {
    watchouts.push("No major numeric red flags surfaced from the current assumptions.");
  }

  if (watchouts.length === 1) {
    watchouts.push("Market comps, contractor bids, and lender terms still need outside verification.");
  }

  return watchouts;
}

function buildNextSteps(deal: DealAnalysis) {
  const nextSteps = [
    "Verify taxes, insurance, rent comps, and rehab budget before submitting final terms.",
    "Stress test the offer with a 10% rehab overrun and a slower exit timeline.",
  ];

  if (deal.purchasePrice > deal.maxAllowableOffer) {
    nextSteps.unshift(
      `Renegotiate the offer toward ${formatCurrency(deal.maxAllowableOffer)} or request seller credits.`,
    );
  }

  if (deal.exitStrategy === "BRRRR" || deal.exitStrategy === "Rental") {
    nextSteps.push("Confirm lender DSCR requirements and refinance assumptions before acquisition.");
  }

  if (deal.exitStrategy === "Flip") {
    nextSteps.push("Pull sold comps and contractor bids to validate ARV and days-on-market risk.");
  }

  return nextSteps;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function renderInvestorMemo(deal: DealAnalysis, insight: DealInsight) {
  const metrics = [
    ["Max allowable offer", formatCurrency(deal.maxAllowableOffer)],
    ["Estimated profit", formatCurrency(deal.estimatedProfit)],
    ["ROI", `${deal.roi}%`],
    ["Monthly cash flow", formatCurrency(deal.monthlyCashFlow)],
    ["NOI", formatCurrency(deal.noi)],
    ["Cap rate", `${deal.capRate}%`],
    ["Cash-on-cash return", `${deal.cashOnCashReturn}%`],
    ["DSCR", deal.dscr.toFixed(2)],
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DealPilot AI Investor Memo - ${escapeHtml(deal.address)}</title>
    <style>
      body { color: #17211f; font-family: Arial, Helvetica, sans-serif; margin: 0; background: #f7faf9; }
      main { background: #fff; margin: 32px auto; max-width: 920px; padding: 40px; border: 1px solid #dbe7e3; border-radius: 10px; }
      h1, h2 { margin: 0; }
      h1 { font-size: 32px; }
      h2 { color: #073d3a; font-size: 18px; margin-top: 32px; }
      p { color: #52635f; line-height: 1.6; }
      .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #dbe7e3; padding-bottom: 24px; }
      .score { background: #073d3a; border-radius: 10px; color: #fff; min-width: 160px; padding: 20px; text-align: center; }
      .score strong { display: block; font-size: 42px; }
      .grid { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 18px; }
      .card { border: 1px solid #dbe7e3; border-radius: 8px; padding: 14px; }
      .label { color: #71827e; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
      .value { color: #17211f; font-size: 20px; font-weight: 700; margin-top: 6px; }
      ul { color: #52635f; line-height: 1.6; padding-left: 20px; }
      .recommendation { background: #eef8f5; border-left: 4px solid #0b625c; padding: 14px 16px; }
      @media print { body { background: #fff; } main { border: 0; margin: 0; max-width: none; } }
    </style>
  </head>
  <body>
    <main>
      <section class="header">
        <div>
          <p class="label">DealPilot AI Investor Memo</p>
          <h1>${escapeHtml(deal.address)}</h1>
          <p>${escapeHtml(deal.exitStrategy)} analysis generated ${new Date(deal.analyzedAt).toLocaleDateString("en-US")}.</p>
        </div>
        <div class="score">
          <span class="label" style="color:#bfe6de">Deal score</span>
          <strong>${deal.dealScore}</strong>
          <span>${escapeHtml(deal.recommendation)} • ${escapeHtml(deal.riskLevel)} risk</span>
        </div>
      </section>
      <section>
        <h2>Recommendation</h2>
        <p class="recommendation">${escapeHtml(insight.summary)}</p>
      </section>
      <section>
        <h2>Core Metrics</h2>
        <div class="grid">
          ${metrics
            .map(
              ([label, value]) => `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`,
            )
            .join("")}
        </div>
      </section>
      ${renderMemoList("Strengths", insight.strengths)}
      ${renderMemoList("Watchouts", insight.watchouts)}
      ${renderMemoList("Next Steps", insight.nextSteps)}
    </main>
  </body>
</html>`;
}

function renderMemoList(title: string, items: string[]) {
  return `<section><h2>${escapeHtml(title)}</h2><ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul></section>`;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "deal"
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isExitStrategy(value: unknown): value is DealInput["exitStrategy"] {
  return (
    value === "Flip" ||
    value === "Rental" ||
    value === "BRRRR" ||
    value === "Multifamily"
  );
}
