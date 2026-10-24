import { describe, expect, it } from "vitest";
import type { PlanRequest } from "../shared/types.js";
import { demoMeals } from "./demo-data.js";
import { parseNutritionRows, rawMealsToCandidates } from "./nutrition.js";
import { buildMealPlans } from "./planner.js";

const request: PlanRequest = {
  city: "上海市",
  landmark: "人民广场",
  budget: 35,
  calorieLimit: 700,
  proteinGoal: 35,
  preference: "balanced",
};

describe("nutrition parsing", () => {
  it("uses energyKcal rather than energyKj", () => {
    const rows = parseNutritionRows(
      "[1]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:\n  巨无霸,null,2146,513,27,26,42,961,171",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "巨无霸",
      energyKcal: 513,
      protein: 27,
      fat: 26,
      carbohydrate: 42,
      sodium: 961,
      calcium: 171,
    });
  });

  it("turns the demo snapshot into food-only candidates", () => {
    const candidates = rawMealsToCandidates(demoMeals);
    expect(candidates.length).toBeGreaterThan(15);
    expect(candidates.every((item) => item.price > 0)).toBe(true);
    expect(candidates.some((item) => item.name.includes("帽"))).toBe(false);
  });
});

describe("meal planner", () => {
  const candidates = rawMealsToCandidates(demoMeals);

  it("returns three distinct plans within the requested limits", () => {
    const plans = buildMealPlans(candidates, request);
    expect(plans).toHaveLength(3);

    const signatures = plans.map((plan) => plan.items.map((item) => item.code).sort().join("+"));
    expect(new Set(signatures).size).toBe(3);

    for (const plan of plans) {
      expect(plan.total).toBeLessThanOrEqual(request.budget);
      expect(plan.calories).toBeLessThanOrEqual(request.calorieLimit);
      expect(plan.items.some((item) => item.role === "main")).toBe(true);
      expect(plan.items.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("does not combine two separate drinks in a normal meal", () => {
    const plans = buildMealPlans(candidates, request);
    for (const plan of plans) {
      const beverages = plan.items.filter((item) => item.role === "drink" || item.role === "coffee");
      expect(beverages.length).toBeLessThanOrEqual(1);
    }
  });

  it("honors a coffee-only preference", () => {
    const plans = buildMealPlans(candidates, {
      ...request,
      budget: 28,
      preference: "coffee",
    });

    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].items.some((item) => item.role === "coffee")).toBe(true);
    expect(plans[0].total).toBeLessThanOrEqual(28);
  });

  it("returns no impossible combination when the budget cannot cover a main", () => {
    const plans = buildMealPlans(candidates, {
      ...request,
      budget: 10,
      calorieLimit: 400,
    });
    expect(plans).toHaveLength(0);
  });
});
