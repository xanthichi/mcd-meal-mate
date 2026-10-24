import type { PlanRequest, PlanResponse } from "../shared/types";

export async function fetchPlan(request: PlanRequest): Promise<PlanResponse> {
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = (await response.json()) as PlanResponse | { error?: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error || "搭餐失败" : "搭餐失败");
  }
  return payload as PlanResponse;
}
