import type {
  CampaignInfo,
  CouponInfo,
  MealCandidate,
  Nutrition,
  PlanRequest,
  PlanResponse,
  StoreInfo,
  ToolTrace,
} from "../shared/types.js";
import { demoCampaigns, demoCoupons, demoMeals, demoStore, type RawMeal } from "./demo-data.js";
import {
  cleanName,
  inferMealRole,
  matchNutrition,
  parseNutritionRows,
  rawMealsToCandidates,
} from "./nutrition.js";
import { buildMealPlans } from "./planner.js";

type JsonRpcResponse = {
  result?: {
    structuredContent?: unknown;
    content?: Array<{ type: string; text?: string }>;
    isError?: boolean;
  };
  error?: { code: number; message: string };
};

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const PREFERENCE_COPY: Record<PlanRequest["preference"], string> = {
  balanced: "均衡",
  protein: "高蛋白",
  value: "省钱",
  light: "轻负担",
  coffee: "咖啡",
  spicy: "辣味",
};

class McdClient {
  readonly trace: ToolTrace[] = [];
  private requestId = 0;
  private cache = new Map<string, CacheEntry>();

  constructor(
    private readonly token: string,
    private readonly endpoint = process.env.MCD_MCP_URL ?? "https://mcp.mcd.cn",
  ) {}

  async callTool<T>(name: string, args: Record<string, unknown>, label: string): Promise<T> {
    const startedAt = performance.now();
    this.requestId += 1;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.requestId,
          method: "tools/call",
          params: { name, arguments: args },
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`MCP ${name} returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as JsonRpcResponse;
      if (payload.error) throw new Error(payload.error.message);
      if (payload.result?.isError) {
        const text = payload.result.content?.map((part) => part.text).filter(Boolean).join(" ");
        throw new Error(text || `MCP ${name} returned an error`);
      }

      const value = payload.result?.structuredContent ?? this.parseTextResult(payload.result?.content) ?? null;
      if (value === null) throw new Error(`MCP ${name} returned no data`);

      this.trace.push({
        tool: name,
        label,
        status: "success",
        durationMs: Math.round(performance.now() - startedAt),
        summary: summarizeTool(name, value),
      });
      return value as T;
    } catch (error) {
      this.trace.push({
        tool: name,
        label,
        status: "fallback",
        durationMs: Math.round(performance.now() - startedAt),
        summary: error instanceof Error ? error.message : "调用失败，已使用本地演示数据",
      });
      throw error;
    }
  }

  async cachedTool<T>(
    cacheKey: string,
    ttlMs: number,
    name: string,
    args: Record<string, unknown>,
    label: string,
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.trace.push({
        tool: name,
        label,
        status: "success",
        durationMs: 0,
        summary: "命中 5 分钟内存缓存",
      });
      return cached.value as T;
    }

    const value = await this.callTool<T>(name, args, label);
    this.cache.set(cacheKey, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }

  private parseTextResult(content?: Array<{ type: string; text?: string }>) {
    const text = content?.find((item) => item.type === "text")?.text;
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }
}

function summarizeTool(name: string, value: unknown): string {
  if (name === "query-nearby-stores") {
    const data = (value as { data?: unknown[] }).data;
    return `找到 ${Array.isArray(data) ? data.length : 0} 家可选门店`;
  }
  if (name === "query-meals") {
    const data = (value as { data?: { meals?: Record<string, unknown> } }).data;
    return `读取 ${Object.keys(data?.meals ?? {}).length} 个实时餐品`;
  }
  if (name === "list-nutrition-foods") {
    const raw = (value as { data?: string }).data ?? "";
    return `解析 ${parseNutritionRows(raw).length} 条营养记录`;
  }
  if (name === "available-coupons") {
    const data = (value as { data?: unknown[] }).data;
    return `发现 ${Array.isArray(data) ? data.length : 0} 张可领优惠券`;
  }
  if (name === "campaign-calendar") {
    const data = (value as { data?: { dailyList?: unknown[] } }).data;
    return `读取 ${Array.isArray(data?.dailyList) ? data.dailyList.length : 0} 天活动日历`;
  }
  return "数据已返回";
}

type StorePayload = {
  data?: Array<{
    storeCode?: string;
    storeName?: string;
    address?: string;
    distance?: number;
    businessStatus?: boolean;
    businessStartTime?: string;
    businessEndTime?: string;
  }>;
};

type MealPayload = {
  data?: {
    categories?: Array<{ name?: string; meals?: Array<{ code?: string; tags?: string[] }> }>;
    meals?: Record<
      string,
      {
        name?: string;
        image?: string;
        currentPrice?: string;
        originalPrice?: string;
        discountType?: string;
      }
    >;
  };
};

type CampaignPayload = {
  data?: {
    currentTime?: string;
    dailyList?: Array<{
      date?: string;
      dateText?: string;
      today?: boolean;
      events?: Array<{
        articleDto?: {
          title?: string;
          content?: string;
          imgList?: string[];
        };
      }>;
    }>;
  };
};

function parseStores(payload: StorePayload): StoreInfo | null {
  const store = payload.data?.[0];
  if (!store?.storeCode || !store.storeName) return null;
  return {
    code: store.storeCode,
    name: store.storeName,
    address: store.address ?? "",
    distance: store.distance,
    businessStatus: Boolean(store.businessStatus),
    businessStartTime: store.businessStartTime,
    businessEndTime: store.businessEndTime,
  };
}

function parseMeals(payload: MealPayload, nutritionRows: ReturnType<typeof parseNutritionRows>) {
  const products = payload.data?.meals ?? {};
  const categories = payload.data?.categories ?? [];
  const categoryForCode = new Map<string, string>();
  const tagsForCode = new Map<string, string[]>();

  for (const category of categories) {
    for (const meal of category.meals ?? []) {
      if (!meal.code) continue;
      if (!categoryForCode.has(meal.code)) {
        categoryForCode.set(meal.code, (category.name ?? "其他").replace(/\s+/g, " "));
      }
      const existing = tagsForCode.get(meal.code) ?? [];
      tagsForCode.set(meal.code, [...new Set([...existing, ...(meal.tags ?? [])])]);
    }
  }

  const seen = new Set<string>();
  const candidates: MealCandidate[] = [];
  for (const [code, product] of Object.entries(products)) {
    const name = product.name?.trim();
    const price = Number(product.currentPrice);
    if (!name || !Number.isFinite(price) || price <= 0 || seen.has(code)) continue;
    if (/帽|丝巾|按摩|捶|玩具|周边|套餐|随心|分享|双人|亲子|儿童|乐园|蘸酱|酱$/.test(name)) continue;
    const category = categoryForCode.get(code) ?? "其他";
    if (category.includes("小食拼盘") || category.includes("500 大卡")) continue;

    const nutrition = matchNutrition(name, nutritionRows);
    if (!nutrition) continue;
    seen.add(code);
    candidates.push({
      code,
      name,
      category,
      tags: tagsForCode.get(code) ?? [],
      image: product.image,
      price,
      originalPrice: Number(product.originalPrice) || price,
      discountType: product.discountType,
      nutrition,
      role: inferMealRole(name, category),
    });
  }

  return candidates;
}

function parseCoupons(payload: { data?: Array<{ couponName?: string; couponImage?: string; label?: string }> }): CouponInfo[] {
  return (payload.data ?? [])
    .filter((coupon) => coupon.couponName)
    .slice(0, 4)
    .map((coupon) => ({
      name: coupon.couponName ?? "",
      image: coupon.couponImage,
      label: coupon.label ?? "可领取",
    }));
}

function parseCampaigns(payload: CampaignPayload): CampaignInfo[] {
  const currentDate = payload.data?.currentTime?.slice(0, 10) ?? "";
  const days = [...(payload.data?.dailyList ?? [])].filter((day) => day.date && day.date >= currentDate);
  days.sort((a, b) => (a.today ? -1 : b.today ? 1 : (a.date ?? "").localeCompare(b.date ?? "")));

  const campaigns: CampaignInfo[] = [];
  const seen = new Set<string>();
  for (const day of days) {
    for (const event of day.events ?? []) {
      const article = event.articleDto;
      const title = article?.title?.trim();
      if (!title || seen.has(cleanName(title))) continue;
      seen.add(cleanName(title));
      campaigns.push({
        date: day.date?.slice(5).replace("-", ".") ?? "",
        title,
        summary: (article?.content ?? "")
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(0, 2)
          .join(" · "),
        image: article?.imgList?.[0],
        badge: day.today ? "今日" : "近期",
      });
      if (campaigns.length >= 3) return campaigns;
    }
  }
  return campaigns;
}

function demoRawMealsAsNutrition() {
  return demoMeals.map((meal) => ({
    name: meal.name,
    ...meal.nutrition,
  }));
}

function demoResponse(notice: string, trace: ToolTrace[] = []): PlanResponse {
  const request: PlanRequest = {
    city: "上海市",
    landmark: "人民广场",
    budget: 35,
    calorieLimit: 700,
    proteinGoal: 35,
    preference: "balanced",
  };
  return {
    mode: "demo",
    generatedAt: new Date().toISOString(),
    store: demoStore,
    plans: buildMealPlans(rawMealsToCandidates(demoMeals), request),
    coupons: demoCoupons,
    campaigns: demoCampaigns,
    trace,
    totalCandidates: demoMeals.length,
    notice,
  };
}

export function isMcpConfigured() {
  return Boolean(process.env.MCD_MCP_TOKEN?.trim());
}

export async function createMealPlan(request: PlanRequest): Promise<PlanResponse> {
  const token = process.env.MCD_MCP_TOKEN?.trim();
  if (!token) {
    return demoResponse("未配置 MCD_MCP_TOKEN，当前展示与接口结构一致的脱敏演示数据。");
  }

  const client = new McdClient(token);
  const [nutritionResult, couponResult, campaignResult] = await Promise.allSettled([
    client.cachedTool<{ data?: string }>(
      "nutrition",
      12 * 60 * 60 * 1000,
      "list-nutrition-foods",
      {},
      "读取营养库",
    ),
    client.cachedTool<{ data?: Array<{ couponName?: string; couponImage?: string; label?: string }> }>(
      "coupons",
      5 * 60 * 1000,
      "available-coupons",
      {},
      "读取可领优惠",
    ),
    client.cachedTool<CampaignPayload>(
      "campaigns",
      10 * 60 * 1000,
      "campaign-calendar",
      {},
      "读取活动日历",
    ),
  ]);

  const nutritionRows =
    nutritionResult.status === "fulfilled"
      ? parseNutritionRows(nutritionResult.value.data ?? "")
      : demoRawMealsAsNutrition();

  let store = demoStore;
  try {
    const stores = await client.cachedTool<StorePayload>(
      `stores:${cleanName(request.city)}:${cleanName(request.landmark)}`,
      5 * 60 * 1000,
      "query-nearby-stores",
      {
        beType: 1,
        searchType: 2,
        city: request.city,
        keyword: request.landmark,
      },
      "查询附近门店",
    );
    store = parseStores(stores) ?? store;
  } catch {
    // The planner can still use the labelled demo store snapshot.
  }

  let candidates: MealCandidate[] = [];
  try {
    const meals = await client.cachedTool<MealPayload>(
      `meals:${store.code}`,
      5 * 60 * 1000,
      "query-meals",
      { storeCode: store.code, orderType: 1, beType: 1 },
      "读取实时菜单",
    );
    candidates = parseMeals(meals, nutritionRows);
  } catch {
    // Fall through to the bundled snapshot when the live menu is unavailable.
  }

  if (candidates.length === 0) {
    candidates = rawMealsToCandidates(demoMeals);
  }

  const plans = buildMealPlans(candidates, request);
  const coupons =
    couponResult.status === "fulfilled" ? parseCoupons(couponResult.value) : demoCoupons;
  const campaigns =
    campaignResult.status === "fulfilled" ? parseCampaigns(campaignResult.value) : demoCampaigns;
  const hasLiveCore =
    nutritionResult.status === "fulfilled" &&
    client.trace.some((item) => item.tool === "query-meals" && item.status === "success");

  return {
    mode: hasLiveCore ? "live" : "demo",
    generatedAt: new Date().toISOString(),
    store,
    plans,
    coupons,
    campaigns,
    trace: client.trace,
    totalCandidates: candidates.length,
    notice: hasLiveCore
      ? `已按${PREFERENCE_COPY[request.preference]}偏好，结合 ${store.name} 的实时菜单完成搭配。价格与供应状态以麦当劳官方下单页为准。`
      : "部分 MCP Tool 暂不可用，已切换到脱敏演示快照；页面仍完整展示调用链路。",
  };
}

export function createDemoResponse(request: PlanRequest): PlanResponse {
  return {
    mode: "demo",
    generatedAt: new Date().toISOString(),
    store: demoStore,
    plans: buildMealPlans(rawMealsToCandidates(demoMeals), request),
    coupons: demoCoupons,
    campaigns: demoCampaigns,
    trace: [
      {
        tool: "query-nearby-stores",
        label: "查询附近门店",
        status: "success",
        durationMs: 0,
        summary: "演示门店",
      },
      {
        tool: "query-meals",
        label: "读取实时菜单",
        status: "success",
        durationMs: 0,
        summary: `${demoMeals.length} 个演示餐品`,
      },
      {
        tool: "list-nutrition-foods",
        label: "读取营养库",
        status: "success",
        durationMs: 0,
        summary: `${demoMeals.length} 条营养记录`,
      },
    ],
    totalCandidates: demoMeals.length,
    notice: "当前为脱敏演示快照，配置 MCD_MCP_TOKEN 后可切换实时门店与菜单。",
  };
}

export type { RawMeal, Nutrition };
