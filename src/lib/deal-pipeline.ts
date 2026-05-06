import type {
  DealAnalysis,
  ExitStrategy,
  Recommendation,
} from "./deal-calculations.ts";

export type DealSortKey = "newest" | "score" | "profit" | "cashFlow";

export type DealPipelineFilters = {
  query?: string;
  strategy?: ExitStrategy | "All";
  recommendation?: Recommendation | "All";
  sortBy?: DealSortKey;
};

export type PipelineSummary = {
  totalDeals: number;
  averageScore: number;
  strategyCounts: Record<ExitStrategy, number>;
};

export function filterAndSortDeals(
  deals: DealAnalysis[],
  filters: DealPipelineFilters,
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const strategy = filters.strategy ?? "All";
  const recommendation = filters.recommendation ?? "All";
  const sortBy = filters.sortBy ?? "newest";

  return deals
    .filter((deal) => {
      const matchesQuery =
        !query ||
        deal.address.toLowerCase().includes(query) ||
        deal.exitStrategy.toLowerCase().includes(query) ||
        deal.recommendation.toLowerCase().includes(query);
      const matchesStrategy =
        strategy === "All" || deal.exitStrategy === strategy;
      const matchesRecommendation =
        recommendation === "All" || deal.recommendation === recommendation;

      return matchesQuery && matchesStrategy && matchesRecommendation;
    })
    .toSorted((a, b) => sortDeals(a, b, sortBy));
}

export function createPipelineSummary(deals: DealAnalysis[]): PipelineSummary {
  const totalDeals = deals.length;
  const averageScore = totalDeals
    ? Math.round(deals.reduce((sum, deal) => sum + deal.dealScore, 0) / totalDeals)
    : 0;
  const strategyCounts: Record<ExitStrategy, number> = {
    Flip: 0,
    Rental: 0,
    BRRRR: 0,
    Multifamily: 0,
  };

  deals.forEach((deal) => {
    strategyCounts[deal.exitStrategy] += 1;
  });

  return {
    totalDeals,
    averageScore,
    strategyCounts,
  };
}

function sortDeals(a: DealAnalysis, b: DealAnalysis, sortBy: DealSortKey) {
  if (sortBy === "score") return b.dealScore - a.dealScore;
  if (sortBy === "profit") return b.estimatedProfit - a.estimatedProfit;
  if (sortBy === "cashFlow") return b.monthlyCashFlow - a.monthlyCashFlow;

  return (
    new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
  );
}
