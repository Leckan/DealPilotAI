import assert from "node:assert/strict";
import { test } from "node:test";

import { analyzeDeal, emptyDealInput } from "../src/lib/deal-calculations.ts";
import {
  createPipelineSummary,
  filterAndSortDeals,
} from "../src/lib/deal-pipeline.ts";

const deals = [
  analyzeDeal({
    ...emptyDealInput,
    address: "100 Strong Buy Ave, Tampa, FL",
    purchasePrice: 180000,
    arv: 315000,
    rehabBudget: 15000,
    monthlyRent: 3600,
    loanAmount: 120000,
    exitStrategy: "Rental",
  }),
  analyzeDeal({
    ...emptyDealInput,
    address: "200 Maybe Flip Rd, Boise, ID",
    purchasePrice: 245000,
    arv: 355000,
    rehabBudget: 42000,
    loanAmount: 210000,
    exitStrategy: "Flip",
  }),
  analyzeDeal({
    ...emptyDealInput,
    address: "300 Multifamily Pine St, Atlanta, GA",
    purchasePrice: 390000,
    arv: 510000,
    rehabBudget: 25000,
    monthlyRent: 5400,
    loanAmount: 315000,
    exitStrategy: "Multifamily",
  }),
];

test("filters deals by search, strategy, and recommendation", () => {
  const result = filterAndSortDeals(deals, {
    query: "pine",
    strategy: "Multifamily",
    recommendation: "Strong Buy",
    sortBy: "score",
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].address, "300 Multifamily Pine St, Atlanta, GA");
});

test("sorts deals by profit, cash flow, and newest analyzed date", () => {
  const byProfit = filterAndSortDeals(deals, { sortBy: "profit" });
  const byCashFlow = filterAndSortDeals(deals, { sortBy: "cashFlow" });
  const byNewest = filterAndSortDeals(
    [
      { ...deals[0], analyzedAt: "2026-01-01T00:00:00.000Z" },
      { ...deals[1], analyzedAt: "2026-03-01T00:00:00.000Z" },
    ],
    { sortBy: "newest" },
  );

  assert.ok(byProfit[0].estimatedProfit >= byProfit[1].estimatedProfit);
  assert.ok(byCashFlow[0].monthlyCashFlow >= byCashFlow[1].monthlyCashFlow);
  assert.equal(byNewest[0].address, "200 Maybe Flip Rd, Boise, ID");
});

test("summarizes pipeline counts and average score", () => {
  const summary = createPipelineSummary(deals);

  assert.equal(summary.totalDeals, 3);
  assert.ok(summary.averageScore > 0);
  assert.equal(summary.strategyCounts.Flip, 1);
  assert.equal(summary.strategyCounts.Multifamily, 1);
});
