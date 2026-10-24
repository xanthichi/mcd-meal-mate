import type {
  MealCandidate,
  MealPlan,
  PlanItem,
  PlanRequest,
  Preference,
} from "../shared/types.js";

type ScoredPlan = MealPlan & {
  score: number;
  valueScore: number;
};

const preferenceCopy: Record<Preference, { label: string; kicker: string; description: string }> = {
  balanced: {
    label: "刚刚好",
    kicker: "均衡首选",
    description: "荤素、主食与饮品都有照顾，预算和营养都留有余地。",
  },
  protein: {
    label: "蛋白优先",
    kicker: "练后实在",
    description: "优先把蛋白质拉高，同时不把热量和预算拉爆。",
  },
  value: {
    label: "省一点",
    kicker: "性价比派",
    description: "先看每一块钱能换到多少蛋白质，再用小食补齐满足感。",
  },
  light: {
    label: "轻负担",
    kicker: "控卡组合",
    description: "把热量压进目标线，用清爽饮品和轻量小食填补空隙。",
  },
  coffee: {
    label: "咖啡续命",
    kicker: "打工人套餐",
    description: "给咖啡留位置，再选一份靠谱主食用餐。",
  },
  spicy: {
    label: "来点辣的",
    kicker: "风味优先",
    description: "优先有辣味和酥脆口感的单品，同时守住预算线。",
  },
};

function sumNutrition(items: MealCandidate[]) {
  return items.reduce(
    (total, item) => ({
      calories: total.calories + item.nutrition.energyKcal,
      protein: total.protein + item.nutrition.protein,
    }),
    { calories: 0, protein: 0 },
  );
}

function toPlanItem(item: MealCandidate): PlanItem {
  return { ...item };
}

function makeHighlights(
  items: MealCandidate[],
  total: number,
  originalTotal: number,
  calories: number,
  protein: number,
  request: PlanRequest,
) {
  const highlights: string[] = [];
  const proteinReach = Math.round((protein / Math.max(request.proteinGoal, 1)) * 100);
  const roles = new Set(items.map((item) => item.role));

  if (protein >= request.proteinGoal) {
    highlights.push(`蛋白质 ${Math.round(protein)}g，达到本次目标的 ${Math.min(proteinReach, 999)}%`);
  } else {
    highlights.push(`蛋白质 ${Math.round(protein)}g，约为目标的 ${proteinReach}%`);
  }

  if (calories <= request.calorieLimit * 0.88) {
    highlights.push(`总热量 ${Math.round(calories)} kcal，仍在预算内留有余地`);
  } else if (calories <= request.calorieLimit) {
    highlights.push(`总热量 ${Math.round(calories)} kcal，控制在 ${request.calorieLimit} kcal 内`);
  }

  if (originalTotal - total >= 2) {
    highlights.push(`按菜单标价计算，共省下 ${(originalTotal - total).toFixed(1)} 元`);
  }

  if (roles.size >= 3) {
    highlights.push("主食、配餐与饮品齐全，不用再临时加单");
  } else if (!roles.has("main") && items.some((item) => item.role === "coffee")) {
    highlights.push("咖啡和小食的组合适合下午或加班时段");
  }

  return highlights.slice(0, 3);
}

function scorePreference(
  items: MealCandidate[],
  total: number,
  calories: number,
  protein: number,
  request: PlanRequest,
) {
  const proteinReach = Math.min(protein / Math.max(request.proteinGoal, 1), 1.5);
  const calorieRoom = Math.max(0, 1 - calories / Math.max(request.calorieLimit, 1));
  const budgetRoom = Math.max(0, 1 - total / Math.max(request.budget, 1));
  const roles = new Set(items.map((item) => item.role)).size;
  const variety = roles / 3;
  const value = protein / Math.max(total, 1);
  const spicy = items.some((item) => /辣|龙焰|V翅/.test(item.name)) ? 1 : 0;
  const coffee = items.some((item) => item.role === "coffee") ? 1 : 0;
  const dessertPenalty = items.filter((item) => item.role === "dessert").length * 0.12;

  switch (request.preference) {
    case "protein":
      return proteinReach * 1.8 + value * 0.35 + variety * 0.25 - dessertPenalty;
    case "value":
      return value * 0.9 + budgetRoom * 0.8 + calorieRoom * 0.25 + variety * 0.18;
    case "light":
      return calorieRoom * 1.5 + proteinReach * 0.5 + budgetRoom * 0.3 - dessertPenalty * 2;
    case "coffee":
      return coffee * 1.3 + (1 - Math.abs(total - request.budget * 0.65) / request.budget) * 0.35 + proteinReach * 0.4;
    case "spicy":
      return spicy * 1.1 + proteinReach * 0.55 + budgetRoom * 0.35;
    case "balanced":
    default:
      return proteinReach * 0.95 + calorieRoom * 0.45 + budgetRoom * 0.35 + variety * 0.4 - dessertPenalty;
  }
}

function comboAllowed(items: MealCandidate[], request: PlanRequest) {
  const counts = items.reduce<Record<string, number>>((result, item) => {
    result[item.role] = (result[item.role] ?? 0) + 1;
    return result;
  }, {});

  if (
    (counts.drink ?? 0) + (counts.coffee ?? 0) > 1 ||
    (counts.dessert ?? 0) > 1
  ) {
    return false;
  }

  if (request.preference === "coffee") {
    return (counts.coffee ?? 0) >= 1;
  }

  return (counts.main ?? 0) >= 1;
}

function scorePlan(items: MealCandidate[], request: PlanRequest): ScoredPlan | null {
  const total = Number(items.reduce((sum, item) => sum + item.price, 0).toFixed(1));
  const originalTotal = Number(items.reduce((sum, item) => sum + item.originalPrice, 0).toFixed(1));
  const { calories, protein } = sumNutrition(items);

  if (total > request.budget + 0.01 || calories > request.calorieLimit) return null;
  if (!comboAllowed(items, request)) return null;

  const copy = preferenceCopy[request.preference];
  const score = scorePreference(items, total, calories, protein, request);
  const proteinPerYuan = protein / Math.max(total, 1);
  const valueScore = proteinPerYuan * 3 + (originalTotal - total) / Math.max(originalTotal, 1);
  const id = "best";

  return {
    id,
    label: copy.label,
    kicker: copy.kicker,
    description: copy.description,
    items: items.map(toPlanItem),
    total,
    originalTotal,
    savings: Number((originalTotal - total).toFixed(1)),
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    proteinPerYuan: Math.round(proteinPerYuan * 10) / 10,
    highlights: makeHighlights(items, total, originalTotal, calories, protein, request),
    score,
    valueScore,
  };
}

function combinations<T>(items: T[], min: number, max: number): T[][] {
  const output: T[][] = [];

  function walk(start: number, current: T[]) {
    if (current.length >= min) output.push([...current]);
    if (current.length === max) return;
    for (let index = start; index < items.length; index += 1) {
      current.push(items[index]);
      walk(index + 1, current);
      current.pop();
    }
  }

  walk(0, []);
  return output;
}

function fingerprint(plan: ScoredPlan) {
  return plan.items
    .map((item) => item.code)
    .sort()
    .join("+");
}

export function buildMealPlans(candidates: MealCandidate[], request: PlanRequest): MealPlan[] {
  const affordable = candidates
    .filter((item) => item.price <= request.budget && item.nutrition.energyKcal <= request.calorieLimit)
    .sort((a, b) => a.price - b.price);

  if (affordable.length === 0) return [];

  const minItems = request.budget < 24 ? 1 : 2;
  const maxItems = request.budget < 24 ? 2 : 3;
  const scored = combinations(affordable, minItems, maxItems)
    .map((items) => scorePlan(items, request))
    .filter((plan): plan is ScoredPlan => plan !== null)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  const best = scored[0];
  const used = new Set([fingerprint(best)]);
  const protein = scored
    .filter((plan) => !used.has(fingerprint(plan)))
    .sort((a, b) => b.protein - a.protein || b.score - a.score)[0];
  if (protein) used.add(fingerprint(protein));
  const value = scored
    .filter((plan) => !used.has(fingerprint(plan)))
    .sort((a, b) => b.valueScore - a.valueScore || b.score - a.score)[0];

  const selected: ScoredPlan[] = [
    { ...best, id: "best" },
    {
      ...(protein ?? best),
      id: "protein",
      label: "蛋白加码",
      kicker: "多吃一点肉",
      description: "把蛋白质再抬一档，适合运动后或下一餐间隔较长的时候。",
    },
    {
      ...(value ?? best),
      id: "value",
      label: "省心搭",
      kicker: "少花一点",
      description: "在目标范围内换一种更省钱的组合，仍保留主食和满足感。",
    },
  ];

  return selected.map(({ score: _score, valueScore: _valueScore, ...plan }, index) => {
    if (index === 0) return plan;
    return {
      ...plan,
      highlights:
        index === 1
          ? [
              `蛋白质 ${plan.protein}g，单位价格能换到 ${plan.proteinPerYuan}g 蛋白质`,
              ...plan.highlights.slice(0, 2),
            ].slice(0, 3)
          : [
              `这一搭共 ${plan.total.toFixed(1)} 元，比预算少 ${(request.budget - plan.total).toFixed(1)} 元`,
              ...plan.highlights.slice(0, 2),
            ].slice(0, 3),
    };
  });
}

export function calculatePlanScore(
  items: MealCandidate[],
  request: PlanRequest,
): number {
  const plan = scorePlan(items, request);
  return plan?.score ?? Number.NEGATIVE_INFINITY;
}
