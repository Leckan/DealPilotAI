import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createDealAnalysisResponse,
  createDealInsightResponse,
} from "../src/lib/deal-api.ts";
import { analyzeDeal, emptyDealInput } from "../src/lib/deal-calculations.ts";

test("creates a successful analysis API payload for valid deal input", () => {
  const response = createDealAnalysisResponse({
    ...emptyDealInput,
    address: "777 API Route Ln, Nashville, TN",
  });

  assert.equal(response.ok, true);
  assert.equal(response.status, 201);

  if (!response.ok) {
    throw new Error("Expected analysis response to be successful.");
  }

  assert.equal(response.data.address, "777 API Route Ln, Nashville, TN");
  assert.equal(typeof response.data.dealScore, "number");
});

test("returns validation errors for invalid analysis API input", () => {
  const response = createDealAnalysisResponse({
    ...emptyDealInput,
    address: "",
    purchasePrice: 0,
  });

  assert.equal(response.ok, false);
  assert.equal(response.status, 400);

  if (response.ok) {
    throw new Error("Expected validation response to fail.");
  }

  assert.equal(response.errors.address, "Property address is required.");
  assert.equal(
    response.errors.purchasePrice,
    "Purchase price must be greater than 0.",
  );
});

test("creates AI-style acquisition insights for a viable deal", () => {
  const deal = analyzeDeal({
    ...emptyDealInput,
    address: "88 Cash Flow Way, Raleigh, NC",
    monthlyRent: 4200,
    purchasePrice: 215000,
    loanAmount: 172000,
    rehabBudget: 16000,
    exitStrategy: "Rental",
  });

  const response = createDealInsightResponse(deal);

  assert.equal(response.ok, true);
  assert.equal(response.status, 200);
  assert.match(response.data.summary, /Strong Buy|Maybe|Avoid/);
  assert.ok(response.data.strengths.length >= 2);
  assert.ok(response.data.watchouts.length >= 2);
  assert.ok(response.data.nextSteps.length >= 2);
});

test("flags weak deal economics in AI-style insights", () => {
  const deal = analyzeDeal({
    ...emptyDealInput,
    address: "11 Thin Margin Ave, Boise, ID",
    purchasePrice: 340000,
    arv: 365000,
    monthlyRent: 1800,
    rehabBudget: 65000,
    loanAmount: 320000,
    exitStrategy: "Flip",
  });

  const response = createDealInsightResponse(deal);

  assert.equal(response.ok, true);
  assert.equal(response.status, 200);
  assert.ok(response.data.watchouts.some((item) => item.includes("margin")));
  assert.ok(response.data.nextSteps.some((item) => item.includes("offer")));
});
