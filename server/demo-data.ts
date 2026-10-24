import type { CampaignInfo, CouponInfo, StoreInfo } from "../shared/types.js";

export type RawMeal = {
  code: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  image?: string;
  tags: string[];
  nutrition: {
    energyKcal: number;
    protein: number;
    fat: number;
    carbohydrate: number;
    sodium: number;
    calcium: number;
  };
};

export const demoStore: StoreInfo = {
  code: "1450713",
  name: "麦当劳上海黄浦华旭国际大厦餐厅",
  address: "南京东路街道西藏中路336号",
  distance: 144,
  businessStatus: true,
  businessStartTime: "00:00",
  businessEndTime: "23:59",
};

// Values are a small, de-identified snapshot returned by McDonald's MCP on
// 2026-10-24. The app clearly labels this path as demo mode.
export const demoMeals: RawMeal[] = [
  {
    code: "1440",
    name: "麦辣鸡腿汉堡",
    category: "鸡肉汉堡",
    price: 22.5,
    originalPrice: 22.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260325/product/MS_1440_320.png",
    tags: ["人气经典", "外酥里嫩"],
    nutrition: { energyKcal: 485, protein: 24, fat: 24, carbohydrate: 42, sodium: 1208, calcium: 154 },
  },
  {
    code: "1406",
    name: "板烧鸡腿堡",
    category: "鸡肉汉堡",
    price: 23.5,
    originalPrice: 23.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260325/product/MS_1406_320.png",
    tags: ["板烧滋滋", "多汁惹味"],
    nutrition: { energyKcal: 391, protein: 23, fat: 17, carbohydrate: 35, sodium: 1041, calcium: 93 },
  },
  {
    code: "1450",
    name: "麦香鸡",
    category: "鸡肉汉堡",
    price: 17,
    originalPrice: 17,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_1450_320.png",
    tags: ["经典"],
    nutrition: { energyKcal: 369, protein: 15, fat: 17, carbohydrate: 39, sodium: 731, calcium: 73 },
  },
  {
    code: "1100",
    name: "巨无霸",
    category: "牛肉汉堡",
    price: 25.5,
    originalPrice: 25.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_1100_320.png",
    tags: ["100%纯牛肉", "经典"],
    nutrition: { energyKcal: 513, protein: 27, fat: 26, carbohydrate: 42, sodium: 961, calcium: 171 },
  },
  {
    code: "1600",
    name: "麦香鱼",
    category: "鱼汉堡",
    price: 22.5,
    originalPrice: 22.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260101/product/MS_1600_320.png",
    tags: ["麦香鱼系列"],
    nutrition: { energyKcal: 325, protein: 16, fat: 13, carbohydrate: 35, sodium: 556, calcium: 99 },
  },
  {
    code: "1120",
    name: "双层吉士汉堡",
    category: "牛肉汉堡",
    price: 23,
    originalPrice: 23,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_1120_320.png",
    tags: ["100%纯牛肉"],
    nutrition: { energyKcal: 429, protein: 27, fat: 22, carbohydrate: 31, sodium: 1017, calcium: 232 },
  },
  {
    code: "4648",
    name: "不素之霸双层牛堡",
    category: "牛肉汉堡",
    price: 26.5,
    originalPrice: 26.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260309/product/MS_4648_320.png",
    tags: ["100%纯牛肉"],
    nutrition: { energyKcal: 493, protein: 28, fat: 27, carbohydrate: 34, sodium: 1012, calcium: 75 },
  },
  {
    code: "1106",
    name: "培根蔬萃双层牛堡",
    category: "牛肉汉堡",
    price: 24.5,
    originalPrice: 24.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_1106_320.png",
    tags: ["100%纯牛肉"],
    nutrition: { energyKcal: 442, protein: 24, fat: 23, carbohydrate: 34, sodium: 728, calcium: 73 },
  },
  {
    code: "9900003586",
    name: "双层深海鳕鱼堡",
    category: "鱼汉堡",
    price: 24,
    originalPrice: 24,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_9900003586_320.png",
    tags: ["麦香鱼系列"],
    nutrition: { energyKcal: 485, protein: 28, fat: 21, carbohydrate: 46, sodium: 917, calcium: 147 },
  },
  {
    code: "1401",
    name: "麦乐鸡",
    category: "炸鸡",
    price: 14,
    originalPrice: 14,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_1401_320.png",
    tags: ["人气"],
    nutrition: { energyKcal: 213, protein: 12, fat: 12, carbohydrate: 13, sodium: 422, calcium: 9 },
  },
  {
    code: "1700",
    name: "麦辣鸡翅",
    category: "炸鸡",
    price: 15,
    originalPrice: 15,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260325/product/MS_G1700_320.png",
    tags: ["黄金酥脆", "鲜嫩多汁"],
    nutrition: { energyKcal: 224, protein: 13, fat: 15, carbohydrate: 9, sodium: 537, calcium: 13 },
  },
  {
    code: "520445",
    name: "薄皮焦香V翅",
    category: "炸鸡",
    price: 16,
    originalPrice: 16,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20241202/product/MS_520445_320.png",
    tags: ["人气"],
    nutrition: { energyKcal: 192, protein: 17, fat: 11, carbohydrate: 6, sodium: 594, calcium: 15 },
  },
  {
    code: "521156",
    name: "那么大鸡排（椒盐风味）",
    category: "炸鸡",
    price: 14,
    originalPrice: 14,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260101/product/MS_521156_320.png",
    tags: ["单品"],
    nutrition: { energyKcal: 385, protein: 24, fat: 21, carbohydrate: 24, sodium: 996, calcium: 13 },
  },
  {
    code: "4810",
    name: "薯条",
    category: "小食",
    price: 13.5,
    originalPrice: 13.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20250523/product/MS_G4810_320_1747877491921.png",
    tags: ["经典小食"],
    nutrition: { energyKcal: 289, protein: 4, fat: 12, carbohydrate: 38, sodium: 165, calcium: 18 },
  },
  {
    code: "514782",
    name: "脆脆薯条",
    category: "小食",
    price: 16,
    originalPrice: 16,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_514782_320.png",
    tags: ["小食"],
    nutrition: { energyKcal: 279, protein: 4, fat: 14, carbohydrate: 32, sodium: 540, calcium: 13 },
  },
  {
    code: "4437",
    name: "玉米杯",
    category: "小食",
    price: 13,
    originalPrice: 13,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G4437_320.png",
    tags: ["小食"],
    nutrition: { energyKcal: 53, protein: 2, fat: 1, carbohydrate: 7, sodium: 1, calcium: 6 },
  },
  {
    code: "6102",
    name: "苹果片",
    category: "小食",
    price: 7,
    originalPrice: 7,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_6102_320.png",
    tags: ["清爽"],
    nutrition: { energyKcal: 32, protein: 0, fat: 0, carbohydrate: 7, sodium: 0, calcium: 18 },
  },
  {
    code: "521741",
    name: "脆薯饼",
    category: "小食",
    price: 8.5,
    originalPrice: 8.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_521741_320.png",
    tags: ["小食"],
    nutrition: { energyKcal: 146, protein: 1, fat: 9, carbohydrate: 14, sodium: 311, calcium: 7 },
  },
  {
    code: "9900008751",
    name: "可乐",
    category: "饮品",
    price: 9.5,
    originalPrice: 9.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_9900008751_320.png",
    tags: ["冷饮"],
    nutrition: { energyKcal: 147, protein: 0, fat: 0, carbohydrate: 36, sodium: 0, calcium: 10 },
  },
  {
    code: "3010",
    name: "雪碧",
    category: "饮品",
    price: 9.5,
    originalPrice: 9.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_3010_320.png",
    tags: ["冷饮"],
    nutrition: { energyKcal: 105, protein: 0, fat: 0, carbohydrate: 26, sodium: 29, calcium: 0 },
  },
  {
    code: "3757",
    name: "纯悦",
    category: "饮品",
    price: 7.5,
    originalPrice: 7.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_3757_320.png",
    tags: ["饮用水"],
    nutrition: { energyKcal: 0, protein: 0, fat: 0, carbohydrate: 0, sodium: 0, calcium: 0 },
  },
  {
    code: "3505",
    name: "锡兰红茶",
    category: "饮品",
    price: 11.5,
    originalPrice: 11.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_3505_320.png",
    tags: ["热饮"],
    nutrition: { energyKcal: 2, protein: 0, fat: 0, carbohydrate: 0, sodium: 0, calcium: 5 },
  },
  {
    code: "515280",
    name: "阳光柠檬红茶",
    category: "饮品",
    price: 9.5,
    originalPrice: 9.5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G515280_320.png",
    tags: ["冷饮"],
    nutrition: { energyKcal: 117, protein: 0, fat: 0, carbohydrate: 29, sodium: 17, calcium: 0 },
  },
  {
    code: "507411",
    name: "麦咖啡™美式",
    category: "麦咖啡",
    price: 11.9,
    originalPrice: 19,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260422/product/MS_G507374_320.gif",
    tags: ["限定特惠", "提神"],
    nutrition: { energyKcal: 13, protein: 1, fat: 0, carbohydrate: 2, sodium: 0, calcium: 7 },
  },
  {
    code: "507409",
    name: "麦咖啡™奶铁",
    category: "麦咖啡",
    price: 13.9,
    originalPrice: 21,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/20260422/product/MS_G507372_320.gif",
    tags: ["限定特惠", "更奶更浓"],
    nutrition: { energyKcal: 186, protein: 11, fat: 8, carbohydrate: 17, sodium: 99, calcium: 320 },
  },
  {
    code: "515837",
    name: "圆筒冰淇淋",
    category: "甜品",
    price: 5,
    originalPrice: 5,
    image: "https://menu-img.mcd.cn/pcm/prod/menu/ProductPool/product/MS_G515837_320.png",
    tags: ["冰淇淋"],
    nutrition: { energyKcal: 93, protein: 2, fat: 3, carbohydrate: 14, sodium: 36, calcium: 77 },
  },
];

export const demoCoupons: CouponInfo[] = [
  {
    name: "免费脆薯饼",
    image: "https://img.mcd.cn/cms/images/858839306b7cca66.png",
    label: "可领取",
  },
  {
    name: "11.9元麦辣鸡腿堡",
    image:
      "https://mcd-portal-prod-cos1-1300270282.cos.ap-shanghai.myqcloud.com/campaign/prod/campaign-offer/coupon/428e50a23a7243b497691f44f55df3a6/%E9%BA%A6%E8%BE%A3%E9%B8%A1%E8%85%BF%E5%A0%A1600x600.png",
    label: "可领取",
  },
  {
    name: "19.9元王牌炸鸡任选2",
    image:
      "https://mcd-portal-prod-cos1-1300270282.cos.ap-shanghai.myqcloud.com/campaign/prod/campaign-offer/coupon/3d8aad332ed94030aca790068eb56054/%E7%8E%8B%E7%89%8C%E7%82%B8%E9%B8%A1%E4%BB%BB%E9%80%892%20600x600.png",
    label: "可领取",
  },
];

export const demoCampaigns: CampaignInfo[] = [
  {
    date: "10.24",
    title: "韩式风味蘸酱上新",
    summary: "鸡薯双全盒 15.9 元起，炸鸡蘸酱 11.9 元起。",
    image: "https://cms-cdn.mcd.cn/img/short-content/01acad0d43f6f5c062d58eecd375e167.jpg",
    badge: "今日",
  },
  {
    date: "10.26",
    title: "下周麦麦省预告",
    summary: "11.9 元麦辣鸡腿堡、19.9 元王牌炸鸡两件套。",
    image: "https://cms-cdn.mcd.cn/img/short-content/2a8bc93b345ab4f8649d000aa2828af2.jpg",
    badge: "预告",
  },
];
