import assert from "node:assert/strict";
import { test } from "node:test";

import { analyzeDeal, validateDealInput } from "../src/lib/deal-calculations.ts";

const baseDeal = {
  address: "1420 Willow Ave, Austin, TX",
  purchasePrice: 245000,
  arv: 355000,
  rehabBudget: 42000,
  monthlyRent: 2900,
  annualTaxes: 5200,
  annualInsurance: 1800,
  loanAmount: 210000,
  interestRate: 7.25,
  holdingPeriod: 6,
  exitStrategy: "Flip" as const,
};

test("analyzes a fix-and-flip deal with profit, ROI, risk, and recommendation", () => {
  const result = analyzeDeal(baseDeal);

  assert.equal(result.maxAllowableOffer, 206500);
  assert.equal(result.estimatedProfit, 36100);
  assert.equal(result.roi, 12.58);
  assert.equal(result.dealScore, 72);
  assert.equal(result.riskLevel, "Medium");
  assert.equal(result.recommendation, "Maybe");
});

test("analyzes rental metrics including NOI, cap rate, cash flow, cash-on-cash, and DSCR", () => {
  const result = analyzeDeal({
    ...baseDeal,
    exitStrategy: "Rental",
    purchasePrice: 220000,
    rehabBudget: 18000,
    monthlyRent: 3200,
    loanAmount: 176000,
    interestRate: 6.75,
  });

  assert.equal(result.noi, 21080);
  assert.equal(result.capRate, 8.86);
  assert.equal(result.monthlyCashFlow, 615);
  assert.equal(result.cashOnCashReturn, 11.91);
  assert.equal(result.dscr, 1.54);
  assert.equal(result.recommendation, "Strong Buy");
});

test("validates required positive deal inputs", () => {
  const errors = validateDealInput({
    ...baseDeal,
    address: "",
    purchasePrice: 0,
    interestRate: -1,
  });

  assert.deepEqual(errors, {
    address: "Property address is required.",
    purchasePrice: "Purchase price must be greater than 0.",
    interestRate: "Interest rate cannot be negative.",
  });
});
