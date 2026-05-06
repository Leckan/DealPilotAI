import { createDealAnalysisResponse } from "@/lib/deal-api";

export async function POST(request: Request) {
  const payload = await request.json();
  const response = createDealAnalysisResponse(payload);

  return Response.json(response.ok ? { data: response.data } : { errors: response.errors }, {
    status: response.status,
  });
}
