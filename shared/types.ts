export type Preference =
  | "balanced"
  | "protein"
  | "value"
  | "light"
  | "coffee"
  | "spicy";

export type PlanRequest = {
  city: string;
  landmark: string;
  budget: number;
  calorieLimit: number;
  proteinGoal: number;
  preference: Preference;
};

export type ToolTrace = {
  tool: string;
  label: string;
  status: "success" | "fallback";
  durationMs: number;
  summary: string;
};

export type StoreInfo = {
  code: string;
  name: string;
  address: string;
  distance?: number;
  businessStatus: boolean;
  businessStartTime?: string;
  businessEndTime?: string;
};

export type Nutrition = {
  energyKcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  sodium: number;
  calcium: number;
};

export type MealCandidate = {
  code: string;
  name: string;
  category: string;
  tags: string[];
  image?: string;
  price: number;
  originalPrice: number;
  discountType?: string;
  nutrition: Nutrition;
  role: "main" | "side" | "drink" | "dessert" | "coffee";
};

export type PlanItem = Omit<MealCandidate, "nutrition"> & {
  nutrition: Nutrition;
};

export type MealPlan = {
  id: "best" | "protein" | "value";
  label: string;
  kicker: string;
  description: string;
  items: PlanItem[];
  total: number;
  originalTotal: number;
  savings: number;
  calories: number;
  protein: number;
  proteinPerYuan: number;
  highlights: string[];
};

export type CouponInfo = {
  name: string;
  image?: string;
  label: string;
};

export type CampaignInfo = {
  date: string;
  title: string;
  summary: string;
  image?: string;
  badge: string;
};

export type PlanResponse = {
  mode: "live" | "demo";
  generatedAt: string;
  store: StoreInfo;
  plans: MealPlan[];
  coupons: CouponInfo[];
  campaigns: CampaignInfo[];
  trace: ToolTrace[];
  totalCandidates: number;
  notice: string;
};
