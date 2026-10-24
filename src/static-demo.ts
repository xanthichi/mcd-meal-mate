import type { PlanRequest, PlanResponse } from "../shared/types";
import { demoCampaigns, demoCoupons, demoMeals, demoStore } from "../server/demo-data";
import { rawMealsToCandidates } from "../server/nutrition";
import { buildMealPlans } from "../server/planner";

export function createStaticDemoResponse(request: PlanRequest): PlanResponse {
  const candidates = rawMealsToCandidates(demoMeals);
  return {
    mode: "demo",
    generatedAt: new Date().toISOString(),
    store: demoStore,
    plans: buildMealPlans(candidates, request),
    coupons: demoCoupons,
    campaigns: demoCampaigns,
    trace: [
      {
        tool: "query-nearby-stores",
        label: "查询附近门店",
        status: "success",
        durationMs: 0,
        summary: "GitHub Pages 演示门店",
      },
      {
        tool: "query-meals",
        label: "读取实时菜单",
        status: "success",
        durationMs: 0,
        summary: `${demoMeals.length} 个脱敏演示餐品`,
      },
      {
        tool: "list-nutrition-foods",
        label: "读取营养库",
        status: "success",
        durationMs: 0,
        summary: `${demoMeals.length} 条脱敏营养记录`,
      },
    ],
    totalCandidates: candidates.length,
    notice:
      "当前为 GitHub Pages 纯前端演示版，使用脱敏菜单快照。实时门店与 MCP 调用请运行仓库中的 Node 服务。",
  };
}
