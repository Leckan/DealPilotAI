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

function isExitStrategy(value: unknown): value is DealInput["exitStrategy"] {
  return (
    value === "Flip" ||
    value === "Rental" ||
    value === "BRRRR" ||
    value === "Multifamily"
  );
}
