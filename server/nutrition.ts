import type { MealCandidate, Nutrition } from "../shared/types.js";
import type { RawMeal } from "./demo-data.js";

type NutritionRow = Nutrition & {
  name: string;
};

const aliasMap: Record<string, string> = {
  麦乐鸡: "麦乐鸡5块",
  麦辣鸡翅: "麦辣鸡翅-2块",
  那么大鸡排: "那么大鸡排",
  "那么大鸡排（椒盐风味）": "那么大鸡排",
  薯条: "中薯条",
  玉米杯: "小杯玉米杯",
  可乐: "可乐中杯",
  雪碧: "雪碧中杯",
  "100%苹果汁(盒装)": "100%苹果汁",
  "纯牛奶(盒装)": "纯牛奶（盒装）",
  鲜萃咖啡: "小杯鲜萃咖啡",
  燕麦奶铁: "热燕麦奶铁中杯",
  "麦咖啡™美式": "冰美式中杯",
  麦咖啡美式: "冰美式中杯",
  卡布奇诺: "卡布奇诺中杯",
  阳光柠檬红茶: "阳光柠檬红茶中杯",
  "怡泉+C": "中杯怡泉+C",
  金牛堡: "巨无霸",
};

export function cleanName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[™®]/g, "")
    .replace(/[“”"'‘’]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function parseNutritionRows(raw: string): NutritionRow[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("[") && !line.startsWith("{") && !line.startsWith("productName"))
    .map((line) => line.split(","))
    .filter((parts) => parts.length >= 9)
    .map((parts) => {
      const values = parts.slice(-8).map((value) => Number(value));
      return {
        name: parts[0],
        energyKcal: values[2] ?? 0,
        protein: values[3] ?? 0,
        fat: values[4] ?? 0,
        carbohydrate: values[5] ?? 0,
        sodium: values[6] ?? 0,
        calcium: values[7] ?? 0,
      };
    })
    .filter((row) => Number.isFinite(row.energyKcal));
}

export function inferMealRole(name: string, category: string): MealCandidate["role"] {
  if (/咖啡|美式|奶铁|卡布奇诺|浓缩/.test(name) || category.includes("麦咖啡")) {
    return "coffee";
  }
  if (/可乐|雪碧|纯悦|红茶|牛奶|果汁|柠檬|橙|奶昔|豆浆|柠柠/.test(name)) {
    return "drink";
  }
  if (/圆筒|冰淇淋|新地|麦旋风|派|阿芙佳朵/.test(name)) {
    return "dessert";
  }
  if (/堡|鸡肉卷|鸡排|麦乐鸡|鸡翅|V翅|脆汁鸡|巨无霸|麦香鸡|麦香鱼/.test(name)) {
    return "main";
  }
  return "side";
}

function shouldSkip(name: string, category: string): boolean {
  if (/帽|丝巾|按摩|捶|玩具|周边|卡$|麦金卡|随心|分享|双人|亲子|儿童|乐园|蘸酱|酱$/.test(name)) {
    return true;
  }
  if (/套餐/.test(name)) {
    return true;
  }
  return category.includes("小食拼盘");
}

export function matchNutrition(name: string, rows: NutritionRow[]): Nutrition | null {
  const key = cleanName(name);
  const alias = aliasMap[name] ?? aliasMap[key];
  const candidates = [key, cleanName(alias ?? "")].filter(Boolean);

  for (const candidate of candidates) {
    const exact = rows.find((row) => cleanName(row.name) === candidate);
    if (exact) {
      return {
        energyKcal: exact.energyKcal,
        protein: exact.protein,
        fat: exact.fat,
        carbohydrate: exact.carbohydrate,
        sodium: exact.sodium,
        calcium: exact.calcium,
      };
    }
  }

  const fuzzy = rows.find((row) => {
    const rowName = cleanName(row.name);
    return (
      (key.length >= 4 && (rowName.includes(key) || key.includes(rowName))) ||
      (cleanName(alias ?? "").length >= 4 &&
        (rowName.includes(cleanName(alias ?? "")) || cleanName(alias ?? "").includes(rowName)))
    );
  });
  if (!fuzzy) return null;

  return {
    energyKcal: fuzzy.energyKcal,
    protein: fuzzy.protein,
    fat: fuzzy.fat,
    carbohydrate: fuzzy.carbohydrate,
    sodium: fuzzy.sodium,
    calcium: fuzzy.calcium,
  };
}

export function rawMealsToCandidates(meals: RawMeal[]): MealCandidate[] {
  const seen = new Set<string>();
  const result: MealCandidate[] = [];

  for (const meal of meals) {
    if (seen.has(meal.code) || shouldSkip(meal.name, meal.category) || meal.price <= 0) continue;
    seen.add(meal.code);
    result.push({
      code: meal.code,
      name: meal.name,
      category: meal.category,
      tags: meal.tags.filter(Boolean),
      image: meal.image,
      price: meal.price,
      originalPrice: meal.originalPrice,
      nutrition: meal.nutrition,
      role: inferMealRole(meal.name, meal.category),
    });
  }

  return result;
}
