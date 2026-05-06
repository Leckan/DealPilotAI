import { createDealMemoResponse } from "@/lib/deal-api";
import type { DealAnalysis } from "@/lib/deal-calculations";

export async function POST(request: Request) {
  const deal = (await request.json()) as DealAnalysis;
  const response = createDealMemoResponse(deal);

  return Response.json({ data: response.data }, { status: response.status });
}
