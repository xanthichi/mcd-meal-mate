# 麦当劳 MCP 集成说明

## 1. 接入信息

| 项目 | 值 |
| --- | --- |
| MCP Server | `mcd-mcp` |
| 接入地址 | `https://mcp.mcd.cn` |
| 传输协议 | Streamable HTTP |
| 鉴权方式 | `Authorization: Bearer ${MCD_MCP_TOKEN}` |
| 配置示例 | [`mcp-config.example.json`](./mcp-config.example.json) |

真实 Token 只通过服务端环境变量 `MCD_MCP_TOKEN` 注入。浏览器不会接触 Token，仓库内不保存任何真实凭据。

## 2. 实际使用的 MCP Tool

### `query-nearby-stores`

- 用途：根据城市与地标查询可到店自取的门店。
- 入参：`city`、`keyword`、`searchType=2`、`beType=1`。
- 应用位置：`server/mcp.ts` → `createMealPlan()`。
- 输出用途：取得 `storeCode`、门店名称、地址、营业状态和距离。

### `query-meals`

- 用途：读取当前门店正在售卖的餐品、价格、原价、标签与图片。
- 入参：第一步返回的 `storeCode`、`orderType=1`、`beType=1`。
- 应用位置：`server/mcp.ts` → `parseMeals()`。
- 输出用途：生成可计算的候选商品池。套餐、周边、蘸酱和无法匹配营养数据的商品会被过滤。

### `list-nutrition-foods`

- 用途：读取麦当劳常见餐品的能量、蛋白质、脂肪、碳水、钠和钙数据。
- 入参：无。
- 应用位置：`server/nutrition.ts` → `parseNutritionRows()`。
- 输出用途：将营养记录与实时菜单商品匹配，为组合优化提供硬约束。API 中的 `energyKj` 与 `energyKcal` 会分开解析，界面只使用 kcal。

### `available-coupons`

- 用途：读取当前可领取的麦麦省优惠券。
- 入参：无。
- 应用位置：`server/mcp.ts` → `parseCoupons()`。
- 输出用途：在结果页侧栏展示可领优惠。该 Tool 不承诺券一定能用于当前订单，因此本项目不会虚报“已抵扣”。

### `campaign-calendar`

- 用途：读取麦当劳当月活动日历。
- 入参：无；默认返回当前月。
- 应用位置：`server/mcp.ts` → `parseCampaigns()`。
- 输出用途：在结果页展示今日和近期活动，补充“今天吃什么”的场景信息。

## 3. 调用流程

```text
用户填写城市、地标、预算、热量、蛋白质与偏好
            │
            ▼
POST /api/plan
            │
            ├─ query-nearby-stores  获取门店
            ├─ list-nutrition-foods 获取营养库 ─┐
            ├─ available-coupons    获取可领券  ├─ 并行读取
            └─ campaign-calendar    获取活动    ┘
            │
            ▼
query-meals（使用门店 code 读取实时菜单）
            │
            ▼
菜单 × 营养映射 → 过滤 → 预算/热量约束 → 组合评分
            │
            ▼
返回 3 套搭配：均衡首选、蛋白加码、省心搭
```

所有 Tool 调用都会记录到响应中的 `trace`。成功时显示耗时；失败时标记为 `fallback` 并启用脱敏演示快照，页面不会假装实时调用成功。

## 4. 业务价值

传统点餐需要用户在菜单、营养表、优惠券和预算之间来回切换。M餐搭子把这些数据合成一个可解释的决策：

1. **减少选择成本**：从上百个 SKU 中直接给出 2–3 件商品的完整组合。
2. **目标可量化**：每个组合都展示总价、热量、蛋白质、每元蛋白质和原价差额。
3. **结果可追溯**：用户可以展开 MCP 调用链，看到门店、菜单、营养和活动分别来自哪个 Tool。
4. **安全可部署**：Token 只保存在服务端；配置样例仅含占位符；默认演示模式无需凭据。
5. **适合真实场景**：覆盖健身加餐、工作日午餐、控卡、省钱、咖啡续命和辣味偏好。

## 5. 安全与边界

- 不调用 `create-order`、`mall-create-order`、`draw-lottery` 等会产生交易或消耗积分的 Tool。
- 不要求用户提供手机号、地址、会员账号或支付信息。
- `city`、`landmark` 只用于门店查询，并在服务端限制长度。
- 服务端超时为 15 秒，菜单与营养结果带内存缓存，避免无意义地重复请求。
- 所有餐品信息与价格均以麦当劳官方渠道为准，本项目不构成营养或医疗建议。

## 6. 本地验证

```bash
cp .env.example .env
# 编辑 .env，将 YOUR_MCD_MCP_TOKEN 替换为自己的 Token
npm run dev
```

真实调用已验证通过：

```text
query-nearby-stores  success
query-meals          success
list-nutrition-foods success
available-coupons    success
campaign-calendar    success
```
