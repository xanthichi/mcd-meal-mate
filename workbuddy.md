# WorkBuddy 开发上下文

## 项目

- 项目名称：M餐搭子（MCD Meal Mate）
- 参赛方向：麦当劳 MCP 创意开发大赛 / 实用决策类 Skill
- 开发日期：2026-10-24
- 项目性质：非麦当劳官方产品

## 可直接继续开发的会话指令

> 你是本次项目的产品与开发搭子。请在现有 `mcd-meal-mate` 项目中，基于 WorkBuddy 已连接的自定义 `mcd-mcp` 服务，继续完善一个“按预算、热量、蛋白质和口味自动搭一餐”的 Skill。
>
> 必须遵守以下约束：
> 1. Token 只能通过 `MCD_MCP_TOKEN` 环境变量读取，禁止写入仓库、日志或前端。
> 2. 菜单、价格优先使用 `query-meals`；营养数据使用 `list-nutrition-foods`；门店使用 `query-nearby-stores`。
> 3. 券和活动是可选增强，分别使用 `available-coupons` 与 `campaign-calendar`。
> 4. 不调用下单、抽奖或积分兑换工具。
> 5. 每个推荐必须展示总价、热量、蛋白质、原价差额和可解释的推荐理由。
> 6. MCP 失败时必须明确标记降级状态，不得把演示数据伪装成实时结果。
> 7. 修改后运行 `npm run check` 和 `npm run build`，并检查桌面和手机界面。

## WorkBuddy 连接器配置

在 WorkBuddy 中进入：

`专家·技能·连接器` → `连接器` → `自定义连接器` → `配置 MCP`

粘贴以下脱敏配置，并把本机环境变量替换为自己的真实 Token：

```json
{
  "mcpServers": {
    "mcd-mcp": {
      "type": "streamablehttp",
      "url": "https://mcp.mcd.cn",
      "headers": {
        "Authorization": "Bearer ${MCD_MCP_TOKEN}"
      }
    }
  }
}
```

启用 `mcd-mcp` 后，可在 WorkBuddy 对话中直接发出下面的验收请求：

> 帮我读取上海市人民广场附近可到店自取的麦当劳门店，读取营养库和该门店实时菜单，再按预算 35 元、热量上限 700 kcal、蛋白质目标 35g 生成三套搭配。告诉我每套包含哪些商品、总价、热量、蛋白质和推荐理由，并列出实际调用了哪些 MCP Tool。

## 已完成的开发与验证

- 已实现服务端 MCP JSON-RPC 客户端，使用 Streamable HTTP 接入 `https://mcp.mcd.cn`。
- 已验证 `query-nearby-stores`、`query-meals`、`list-nutrition-foods`、`available-coupons`、`campaign-calendar` 五个 Tool 可成功返回数据。
- 已完成菜单与营养映射、kcal 单位校正、组合约束、三方案评分和响应式前端。
- 已验证无 Token 时使用脱敏演示快照；有 Token 时使用实时数据，并在页面显示 MCP 状态。
- 已通过 TypeScript 检查、生产构建和 6 项自动化测试。

## 设计上下文

- 用户痛点：菜单选择多、营养信息分散、预算与口味难兼顾。
- 核心动作：填写 5 组简单条件，10 秒内得到三种可执行搭配。
- 视觉方向：编辑部菜单 × 餐饮小票 × 克制的品牌红黄配色。
- 目标用户：上班族、学生、健身人群、控卡人群和需要快速做决定的人。
- 成功标准：结果能解释、价格能追溯、Token 不泄露、没有 MCP 也能演示。

## 产品边界

- 本 Skill 是点餐前的决策辅助，不是自动下单代理。
- 商品价格、库存与活动状态以麦当劳官方渠道为准。
- 营养数据来自 MCP 返回值，不构成医疗或专业营养建议。
