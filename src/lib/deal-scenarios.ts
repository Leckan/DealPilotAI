import type { DealAnalysis, DealInput } from "./deal-calculations.ts";
import { analyzeDeal } from "./deal-calculations.ts";

export type DealScenario = {
  name: "Base case" | "Conservative" | "Downside";
  description: string;
  assumptions: string[];
  analysis: DealAnalysis;
  delta: {
    estimatedProfit: number;
    monthlyCashFlow: number;
    dealScore: number;
  };
};

export function createDealScenarios(deal: DealAnalysis): DealScenario[] {
  const baseInput = toDealInput(deal);
  const baseAnalysis = analyzeDeal(baseInput);
  const conservativeInput: DealInput = {
    ...baseInput,
    arv: Math.round(baseInput.arv * 0.97),
    rehabBudget: Math.round(baseInput.rehabBudget * 1.1),
    monthlyRent: Math.round(baseInput.monthlyRent * 0.95),
    holdingPeriod: baseInput.holdingPeriod + 1,
  };
  const downsideInput: DealInput = {
    ...baseInput,
    arv: Math.round(baseInput.arv * 0.93),
    rehabBudget: Math.round(baseInput.rehabBudget * 1.2),
    monthlyRent: Math.round(baseInput.monthlyRent * 0.9),
    interestRate: Math.round((baseInput.interestRate + 0.75) * 100) / 100,
    holdingPeriod: baseInput.holdingPeriod + 2,
  };

  return [
    {
      name: "Base case",
      description: "Original underwriting assumptions.",
      assumptions: ["Current ARV", "Current rehab budget", "Current rent", "Current timeline"],
      analysis: baseAnalysis,
      delta: createDelta(baseAnalysis, baseAnalysis),
    },
    {
      name: "Conservative",
      description: "Moderate stress on exit value, rent, rehab, and timeline.",
      assumptions: ["ARV -3%", "Rehab +10%", "Rent -5%", "Timeline +1 month"],
      analysis: analyzeDeal(conservativeInput),
      delta: createDelta(analyzeDeal(conservativeInput), baseAnalysis),
    },
    {
      name: "Downside",
      description: "Harder downside case with financing and execution pressure.",
      assumptions: ["ARV -7%", "Rehab +20%", "Rent -10%", "Rate +0.75%", "Timeline +2 months"],
      analysis: analyzeDeal(downsideInput),
      delta: createDelta(analyzeDeal(downsideInput), baseAnalysis),
    },
  ];
}

function createDelta(analysis: DealAnalysis, base: DealAnalysis) {
  return {
    estimatedProfit: analysis.estimatedProfit - base.estimatedProfit,
    monthlyCashFlow: analysis.monthlyCashFlow - base.monthlyCashFlow,
    dealScore: analysis.dealScore - base.dealScore,
  };
}

function toDealInput(deal: DealAnalysis): DealInput {
  return {
    address: deal.address,
    purchasePrice: deal.purchasePrice,
    arv: deal.arv,
    rehabBudget: deal.rehabBudget,
    monthlyRent: deal.monthlyRent,
    annualTaxes: deal.annualTaxes,
    annualInsurance: deal.annualInsurance,
    loanAmount: deal.loanAmount,
    interestRate: deal.interestRate,
    holdingPeriod: deal.holdingPeriod,
    exitStrategy: deal.exitStrategy,
  };
}
