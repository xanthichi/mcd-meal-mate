import "dotenv/config";
import path from "node:path";
import compression from "compression";
import express from "express";
import type { PlanRequest, Preference } from "../shared/types.js";
import { createMealPlan, isMcpConfigured } from "./mcp.js";

const app = express();
const port = Number(process.env.PORT) || 8787;
const preferences: Preference[] = ["balanced", "protein", "value", "light", "coffee", "spicy"];

app.disable("x-powered-by");
app.use(compression());
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    mcpConfigured: isMcpConfigured(),
    time: new Date().toISOString(),
  });
});

app.post("/api/plan", async (request, response) => {
  const body = request.body as Partial<PlanRequest>;
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const landmark = typeof body.landmark === "string" ? body.landmark.trim() : "";
  const budget = Number(body.budget);
  const calorieLimit = Number(body.calorieLimit);
  const proteinGoal = Number(body.proteinGoal);
  const preference = preferences.includes(body.preference as Preference)
    ? (body.preference as Preference)
    : "balanced";

  if (!city || !landmark || city.length > 30 || landmark.length > 50) {
    response.status(400).json({ error: "请填写有效的城市和地标。" });
    return;
  }
  if (!Number.isFinite(budget) || budget < 10 || budget > 200) {
    response.status(400).json({ error: "预算需要在 10 到 200 元之间。" });
    return;
  }
  if (!Number.isFinite(calorieLimit) || calorieLimit < 300 || calorieLimit > 2000) {
    response.status(400).json({ error: "热量目标需要在 300 到 2000 kcal 之间。" });
    return;
  }
  if (!Number.isFinite(proteinGoal) || proteinGoal < 5 || proteinGoal > 150) {
    response.status(400).json({ error: "蛋白质目标需要在 5 到 150g 之间。" });
    return;
  }

  try {
    const result = await createMealPlan({
      city,
      landmark,
      budget: Math.round(budget * 10) / 10,
      calorieLimit: Math.round(calorieLimit),
      proteinGoal: Math.round(proteinGoal),
      preference,
    });
    response.json(result);
  } catch (error) {
    console.error("Plan request failed", error);
    response.status(502).json({ error: "搭餐服务暂时不可用，请稍后再试。" });
  }
});

const staticDirectory = path.resolve(process.cwd(), "dist");

app.use(express.static(staticDirectory));
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(staticDirectory, "index.html"));
});

app.listen(port, () => {
  console.log(`M餐搭子 server listening on http://localhost:${port}`);
});
