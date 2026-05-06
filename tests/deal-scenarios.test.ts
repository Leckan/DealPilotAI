import assert from "node:assert/strict";
import { test } from "node:test";

import { analyzeDeal, emptyDealInput } from "../src/lib/deal-calculations.ts";
import { createDealScenarios } from "../src/lib/deal-scenarios.ts";

const deal = analyzeDeal({
  ...emptyDealInput,
  address: "900 Scenario Blvd, Denver, CO",
  purchasePrice: 260000,
  arv: 390000,
  rehabBudget: 45000,
  monthlyRent: 3100,
  loanAmount: 210000,
  holdingPeriod: 6,
  exitStrategy: "BRRRR",
});

test("creates base, conservative, and downside deal scenarios", () => {
  const scenarios = createDealScenarios(deal);

  assert.deepEqual(
    scenarios.map((scenario) => scenario.name),
    ["Base case", "Conservative", "Downside"],
  );
  assert.equal(scenarios[0].analysis.estimatedProfit, deal.estimatedProfit);
});

test("conservative and downside scenarios reduce projected economics", () => {
  const [base, conservative, downside] = createDealScenarios(deal);

  assert.ok(conservative.analysis.estimatedProfit < base.analysis.estimatedProfit);
  assert.ok(downside.analysis.estimatedProfit < conservative.analysis.estimatedProfit);
  assert.ok(conservative.analysis.monthlyCashFlow < base.analysis.monthlyCashFlow);
  assert.ok(downside.analysis.monthlyCashFlow < conservative.analysis.monthlyCashFlow);
});

test("scenario deltas show movement from the base case", () => {
  const [, conservative] = createDealScenarios(deal);

  assert.ok(conservative.delta.estimatedProfit < 0);
  assert.ok(conservative.delta.monthlyCashFlow < 0);
  assert.ok(conservative.delta.dealScore <= 0);
});
