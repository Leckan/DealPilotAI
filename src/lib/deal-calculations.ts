export type ExitStrategy = "Flip" | "Rental" | "BRRRR" | "Multifamily";

export type RiskLevel = "Low" | "Medium" | "High";

export type Recommendation = "Strong Buy" | "Maybe" | "Avoid";

export type DealInput = {
  address: string;
  purchasePrice: number;
  arv: number;
  rehabBudget: number;
  monthlyRent: number;
  annualTaxes: number;
  annualInsurance: number;
  loanAmount: number;
  interestRate: number;
  holdingPeriod: number;
  exitStrategy: ExitStrategy;
};

export type DealAnalysis = DealInput & {
  id: string;
  analyzedAt: string;
  maxAllowableOffer: number;
  estimatedProfit: number;
  roi: number;
  monthlyCashFlow: number;
  noi: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  dealScore: number;
  riskLevel: RiskLevel;
  recommendation: Recommendation;
};

export type DealValidationErrors = Partial<Record<keyof DealInput, string>>;

const SELLING_COST_RATE = 0.08;
const RENTAL_OPERATING_EXPENSE_RATE = 0.26875;
export const emptyDealInput: DealInput = {
  address: "",
  purchasePrice: 250000,
  arv: 350000,
  rehabBudget: 40000,
  monthlyRent: 2800,
  annualTaxes: 4800,
  annualInsurance: 1800,
  loanAmount: 200000,
  interestRate: 7,
  holdingPeriod: 6,
  exitStrategy: "Flip",
};

export function validateDealInput(input: DealInput): DealValidationErrors {
  const errors: DealValidationErrors = {};

  if (!input.address.trim()) {
    errors.address = "Property address is required.";
  }

  const positiveFields: Array<keyof DealInput> = [
    "purchasePrice",
    "arv",
    "monthlyRent",
    "holdingPeriod",
  ];

  positiveFields.forEach((field) => {
    if (typeof input[field] === "number" && input[field] <= 0) {
      errors[field] = `${labelFor(field)} must be greater than 0.`;
    }
  });

  const nonNegativeFields: Array<keyof DealInput> = [
    "rehabBudget",
    "annualTaxes",
    "annualInsurance",
    "loanAmount",
    "interestRate",
  ];

  nonNegativeFields.forEach((field) => {
    if (typeof input[field] === "number" && input[field] < 0) {
      errors[field] = `${labelFor(field)} cannot be negative.`;
    }
  });

  return errors;
}

export function analyzeDeal(input: DealInput): DealAnalysis {
  const grossRent = input.monthlyRent * 12;
  const operatingExpenses =
    input.annualTaxes +
    input.annualInsurance +
    grossRent * RENTAL_OPERATING_EXPENSE_RATE;
  const noi = grossRent - operatingExpenses;
  const annualDebtService = calculateAnnualDebtService(
    input.loanAmount,
    input.interestRate,
  );
  const monthlyDebtService = annualDebtService / 12;
  const monthlyCashFlow = noi / 12 - monthlyDebtService;
  const cashInvested = Math.max(
    input.purchasePrice - input.loanAmount + input.rehabBudget,
    1,
  );
  const estimatedProfit =
    input.arv -
    input.purchasePrice -
    input.rehabBudget -
    input.arv * SELLING_COST_RATE -
    (input.annualTaxes + input.annualInsurance) *
      (input.holdingPeriod / 12);
  const roi = (estimatedProfit / Math.max(input.purchasePrice + input.rehabBudget, 1)) * 100;
  const capRate = (noi / Math.max(input.purchasePrice + input.rehabBudget, 1)) * 100;
  const cashOnCashReturn = (monthlyCashFlow * 12 * 100) / cashInvested;
  const dscr = noi / Math.max(annualDebtService, 1);
  const maxAllowableOffer = input.arv * 0.7 - input.rehabBudget;
  const dealScore = scoreDeal({
    roi,
    capRate,
    cashOnCashReturn,
    dscr,
    profitMargin: estimatedProfit / Math.max(input.arv, 1),
    exitStrategy: input.exitStrategy,
  });
  const riskLevel = riskFromScore(dealScore);
  const recommendation = recommendationFromScore(dealScore, riskLevel);

  return {
    ...input,
    id: createDealId(input.address),
    analyzedAt: new Date().toISOString(),
    maxAllowableOffer: roundCurrency(maxAllowableOffer),
    estimatedProfit: roundCurrency(estimatedProfit),
    roi: roundPercent(roi),
    monthlyCashFlow: roundCurrency(monthlyCashFlow),
    noi: roundCurrency(noi),
    capRate: roundPercent(capRate),
    cashOnCashReturn: roundPercent(cashOnCashReturn),
    dscr: roundRatio(dscr),
    dealScore,
    riskLevel,
    recommendation,
  };
}

export function createMockSavedDeals(): DealAnalysis[] {
  return [
    analyzeDeal({
      ...emptyDealInput,
      address: "1188 Maple Ridge Dr, Charlotte, NC",
      purchasePrice: 220000,
      arv: 332000,
      rehabBudget: 38000,
      monthlyRent: 2850,
      annualTaxes: 3900,
      annualInsurance: 1500,
      loanAmount: 176000,
      interestRate: 6.85,
      holdingPeriod: 5,
      exitStrategy: "Flip",
    }),
    analyzeDeal({
      ...emptyDealInput,
      address: "52 Harbor St, Tampa, FL",
      purchasePrice: 410000,
      arv: 530000,
      rehabBudget: 25000,
      monthlyRent: 5200,
      annualTaxes: 7800,
      annualInsurance: 3600,
      loanAmount: 320000,
      interestRate: 6.65,
      holdingPeriod: 12,
      exitStrategy: "Multifamily",
    }),
  ];
}

function scoreDeal({
  roi,
  capRate,
  cashOnCashReturn,
  dscr,
  profitMargin,
  exitStrategy,
}: {
  roi: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  profitMargin: number;
  exitStrategy: ExitStrategy;
}) {
  const flipScore = clamp(roi * 2.8 + profitMargin * 80, 0, 42);
  const incomeScore = clamp(capRate * 2 + cashOnCashReturn * 1.5 + dscr * 12, 0, 60);
  const strategyBonus = exitStrategy === "BRRRR" || exitStrategy === "Multifamily" ? 8 : 4;
  const score = 26 + Math.max(flipScore, incomeScore) + strategyBonus;

  return Math.round(clamp(score, 0, 100));
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 78) return "Low";
  if (score >= 55) return "Medium";
  return "High";
}

function recommendationFromScore(
  score: number,
  riskLevel: RiskLevel,
): Recommendation {
  if (score >= 78 && riskLevel !== "High") return "Strong Buy";
  if (score >= 55) return "Maybe";
  return "Avoid";
}

function calculateAnnualDebtService(loanAmount: number, interestRate: number) {
  if (loanAmount <= 0 || interestRate <= 0) return 0;

  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = 30 * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate) /
    (1 - (1 + monthlyRate) ** -numberOfPayments);

  return monthlyPayment * 12;
}

function labelFor(field: keyof DealInput) {
  const labels: Record<keyof DealInput, string> = {
    address: "Property address",
    purchasePrice: "Purchase price",
    arv: "ARV",
    rehabBudget: "Rehab budget",
    monthlyRent: "Monthly rent",
    annualTaxes: "Annual taxes",
    annualInsurance: "Annual insurance",
    loanAmount: "Loan amount",
    interestRate: "Interest rate",
    holdingPeriod: "Holding period",
    exitStrategy: "Exit strategy",
  };

  return labels[field];
}

function createDealId(address: string) {
  return `${address.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
}

function roundCurrency(value: number) {
  return Math.round(value);
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRatio(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
