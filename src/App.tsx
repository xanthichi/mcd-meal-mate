import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Coffee,
  Dumbbell,
  Flame,
  Info,
  Leaf,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  TicketPercent,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import type {
  MealPlan,
  PlanRequest,
  PlanResponse,
  Preference,
  ToolTrace,
} from "../shared/types";

const preferences: Array<{
  id: Preference;
  label: string;
  note: string;
  icon: typeof Sparkles;
}> = [
  { id: "balanced", label: "均衡", note: "什么都顾到", icon: Sparkles },
  { id: "protein", label: "高蛋白", note: "练后加餐", icon: Dumbbell },
  { id: "value", label: "省一点", note: "把钱花值", icon: Wallet },
  { id: "light", label: "轻负担", note: "控卡优先", icon: Leaf },
  { id: "coffee", label: "咖啡", note: "续命组合", icon: Coffee },
  { id: "spicy", label: "来点辣", note: "风味优先", icon: Flame },
];

const initialRequest: PlanRequest = {
  city: "上海市",
  landmark: "人民广场",
  budget: 35,
  calorieLimit: 700,
  proteinGoal: 35,
  preference: "balanced",
};

function App() {
  const [form, setForm] = useState<PlanRequest>(initialRequest);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function requestPlan(nextForm: PlanRequest = form) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextForm),
      });
      const payload = (await response.json()) as PlanResponse | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload ? payload.error || "搭餐失败" : "搭餐失败");
      }
      const planResponse = payload as PlanResponse;
      if (planResponse.plans.length === 0) {
        throw new Error("这个预算下没有找到合适组合，试着放宽预算或热量目标。");
      }
      setResult(planResponse);
      setActiveIndex(0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "网络开小差了，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void requestPlan(initialRequest);
    // The form intentionally runs once on first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void requestPlan();
  }

  const activePlan = result?.plans[activeIndex] ?? result?.plans[0];

  return (
    <div className="app-shell">
      <Header mode={result?.mode} />

      <main className="workspace">
        <ControlPanel
          form={form}
          loading={loading}
          onChange={setForm}
          onSubmit={submit}
          onRefresh={() => void requestPlan()}
        />

        <section className="result-stage" aria-live="polite" aria-busy={loading}>
          {loading && <PlanSkeleton />}
          {!loading && error && (
            <div className="error-state" role="alert">
              <div className="error-icon">!</div>
              <p className="eyebrow">暂时搭不出来</p>
              <h2>{error}</h2>
              <button className="text-button" type="button" onClick={() => void requestPlan()}>
                <RefreshCw size={16} aria-hidden="true" />
                再试一次
              </button>
            </div>
          )}
          {!loading && !error && result && activePlan && (
            <>
              <PlanHero plan={activePlan} result={result} />
              <VariantPicker
                plans={result.plans}
                activeIndex={activeIndex}
                onChange={setActiveIndex}
              />
              <McpTrace trace={result.trace} />
            </>
          )}
        </section>

        <SideRail result={result} loading={loading} />
      </main>

      <footer className="site-footer">
        <span>M餐搭子 · 2026 麦当劳程序员创意开发大赛参赛作品</span>
        <span>非麦当劳官方产品，餐品信息以官方渠道为准</span>
      </footer>
    </div>
  );
}

function Header({ mode }: { mode?: PlanResponse["mode"] }) {
  return (
    <header className="topbar">
      <a className="brand" href="#workspace" aria-label="M餐搭子首页">
        <span className="brand-tile" aria-hidden="true">
          <span>M</span>
        </span>
        <span className="brand-copy">
          <strong>餐搭子</strong>
          <small>MEAL MATE</small>
        </span>
      </a>

      <div className="topbar-note">
        <span className="unofficial-mark">非官方参赛作品</span>
        <span className="topbar-divider" aria-hidden="true" />
        <span>不猜菜单，认真算一餐</span>
      </div>

      <div className={`connection-pill ${mode === "live" ? "is-live" : ""}`}>
        {mode === "live" ? <Wifi size={14} /> : <WifiOff size={14} />}
        {mode === "live" ? "MCP 实时" : mode === "demo" ? "演示数据" : "连接中"}
      </div>
    </header>
  );
}

function ControlPanel({
  form,
  loading,
  onChange,
  onSubmit,
  onRefresh,
}: {
  form: PlanRequest;
  loading: boolean;
  onChange: (form: PlanRequest) => void;
  onSubmit: (event: React.FormEvent) => void;
  onRefresh: () => void;
}) {
  const setValue = <K extends keyof PlanRequest>(key: K, value: PlanRequest[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <aside id="workspace" className="control-panel" aria-label="搭餐条件">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">01 / 设置目标</p>
          <h1>
            今天，吃多少
            <br />
            <span>刚刚好？</span>
          </h1>
        </div>
        <button
          className="icon-button"
          type="button"
          title="重新读取当前条件"
          aria-label="重新读取当前条件"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <fieldset className="field-group">
          <legend className="field-label">
            <Sparkles size={15} aria-hidden="true" />
            这一餐最想要什么
          </legend>
          <div className="preference-grid">
            {preferences.map((preference) => {
              const Icon = preference.icon;
              const selected = form.preference === preference.id;
              return (
                <button
                  key={preference.id}
                  className={`preference-button ${selected ? "is-selected" : ""}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setValue("preference", preference.id)}
                >
                  <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                  <span>
                    <strong>{preference.label}</strong>
                    <small>{preference.note}</small>
                  </span>
                  {selected && <Check className="selected-check" size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend className="field-label">
            <MapPin size={15} aria-hidden="true" />
            从哪家店取
          </legend>
          <div className="location-grid">
            <label className="text-field city-field">
              <span>城市</span>
              <input
                type="text"
                value={form.city}
                maxLength={30}
                onChange={(event) => setValue("city", event.target.value)}
                placeholder="上海市"
              />
            </label>
            <label className="text-field landmark-field">
              <span>商圈 / 地标</span>
              <input
                type="text"
                value={form.landmark}
                maxLength={50}
                onChange={(event) => setValue("landmark", event.target.value)}
                placeholder="人民广场"
              />
              <Search size={16} aria-hidden="true" />
            </label>
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend className="field-label">
            <Wallet size={15} aria-hidden="true" />
            预算
          </legend>
          <div className="range-heading">
            <span>最多花</span>
            <strong>
              <small>¥</small>
              {form.budget}
            </strong>
          </div>
          <input
            className="budget-range"
            type="range"
            min="15"
            max="60"
            step="1"
            value={form.budget}
            aria-label="单餐预算"
            style={{ "--range-progress": `${((form.budget - 15) / 45) * 100}%` } as React.CSSProperties}
            onChange={(event) => setValue("budget", Number(event.target.value))}
          />
          <div className="range-labels" aria-hidden="true">
            <span>¥15</span>
            <span>¥60</span>
          </div>
        </fieldset>

        <div className="target-pair">
          <fieldset className="compact-field">
            <legend className="field-label">
              <Flame size={15} aria-hidden="true" />
              热量上限
            </legend>
            <label className="select-field">
              <select
                value={form.calorieLimit}
                onChange={(event) => setValue("calorieLimit", Number(event.target.value))}
              >
                <option value="450">450 kcal</option>
                <option value="550">550 kcal</option>
                <option value="700">700 kcal</option>
                <option value="850">850 kcal</option>
                <option value="1000">1000 kcal</option>
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </fieldset>

          <fieldset className="compact-field">
            <legend className="field-label">
              <Dumbbell size={15} aria-hidden="true" />
              蛋白目标
            </legend>
            <label className="select-field">
              <select
                value={form.proteinGoal}
                onChange={(event) => setValue("proteinGoal", Number(event.target.value))}
              >
                <option value="20">20 g</option>
                <option value="30">30 g</option>
                <option value="35">35 g</option>
                <option value="45">45 g</option>
                <option value="55">55 g</option>
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          </fieldset>
        </div>

        <button className="plan-button" type="submit" disabled={loading}>
          <span>{loading ? "正在翻菜单…" : "帮我搭一餐"}</span>
          <span className="plan-button-icon">
            <ArrowRight size={20} aria-hidden="true" />
          </span>
        </button>
      </form>

      <p className="control-footnote">
        <Info size={13} aria-hidden="true" />
        使用麦当劳 MCP 的实时门店、菜单、价格与营养数据。
      </p>
    </aside>
  );
}

function PlanHero({ plan, result }: { plan: MealPlan; result: PlanResponse }) {
  return (
    <article className="plan-hero">
      <div className="plan-ticket">
        <div className="ticket-top">
          <div>
            <p className="eyebrow">{plan.kicker}</p>
            <h2>{plan.label}</h2>
          </div>
          <span className="fresh-stamp">
            <span className="fresh-dot" />
            {result.mode === "live" ? "实时算出" : "演示快照"}
          </span>
        </div>

        <p className="plan-description">{plan.description}</p>

        <div className="plan-price-row">
          <div className="plan-price">
            <span>本餐合计</span>
            <strong>
              <small>¥</small>
              {plan.total.toFixed(1)}
            </strong>
          </div>
          <div className="metric-grid">
            <div>
              <Flame size={17} aria-hidden="true" />
              <span>
                <strong>{plan.calories}</strong>
                <small>kcal</small>
              </span>
            </div>
            <div>
              <Dumbbell size={17} aria-hidden="true" />
              <span>
                <strong>{plan.protein}</strong>
                <small>g 蛋白</small>
              </span>
            </div>
            <div>
              <Wallet size={17} aria-hidden="true" />
              <span>
                <strong>{plan.savings}</strong>
                <small>元省下</small>
              </span>
            </div>
          </div>
        </div>

        <div className="item-list" aria-label="本餐包含">
          {plan.items.map((item, index) => (
            <div className="meal-item" key={item.code}>
              <span className="item-index">{String(index + 1).padStart(2, "0")}</span>
              <ProductImage item={item} />
              <div className="item-copy">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                </div>
                <div className="item-tags">
                  {item.nutrition.energyKcal} kcal
                  <span aria-hidden="true">/</span>
                  {item.nutrition.protein}g 蛋白
                </div>
              </div>
              <div className="item-price">
                <strong>¥{item.price.toFixed(1)}</strong>
                {item.originalPrice > item.price && <del>¥{item.originalPrice.toFixed(1)}</del>}
              </div>
            </div>
          ))}
        </div>

        <div className="highlight-strip">
          {plan.highlights.map((highlight) => (
            <span key={highlight}>
              <Check size={13} aria-hidden="true" />
              {highlight}
            </span>
          ))}
        </div>
      </div>

      <div className="plan-note">
        <span className="note-number">≈</span>
        <div>
          <strong>这份搭法的公式</strong>
          <p>
            {plan.protein}g 蛋白质 ÷ ¥{plan.total.toFixed(1)} = 每元 {plan.proteinPerYuan}g，
            最终落在 {plan.calories} kcal，价格比菜单原价少 {plan.savings.toFixed(1)} 元。
          </p>
        </div>
      </div>
    </article>
  );
}

function ProductImage({ item }: { item: MealPlan["items"][number] }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) {
    return (
      <div className="product-image product-image-fallback" aria-hidden="true">
        <span>{item.name.slice(0, 1)}</span>
      </div>
    );
  }
  return (
    <div className="product-image">
      <img src={item.image} alt="" loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

function VariantPicker({
  plans,
  activeIndex,
  onChange,
}: {
  plans: MealPlan[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <section className="variants" aria-labelledby="variant-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / 换个思路</p>
          <h3 id="variant-title">还有两种吃法</h3>
        </div>
        <span>同预算，不同答案</span>
      </div>
      <div className="variant-list">
        {plans.map((plan, index) => (
          <button
            type="button"
            key={plan.id}
            className={`variant-button ${activeIndex === index ? "is-active" : ""}`}
            onClick={() => onChange(index)}
            aria-pressed={activeIndex === index}
          >
            <span className="variant-letter">{String.fromCharCode(65 + index)}</span>
            <span className="variant-copy">
              <strong>{plan.label}</strong>
              <small>
                ¥{plan.total.toFixed(1)} · {plan.protein}g 蛋白 · {plan.calories} kcal
              </small>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function McpTrace({ trace }: { trace: ToolTrace[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="trace-section">
      <button
        className="trace-toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>
          <span className={`trace-led ${trace.some((item) => item.status === "fallback") ? "has-fallback" : ""}`} />
          MCP 调用链
        </span>
        <span className="trace-summary">
          {trace.filter((item) => item.status === "success").length}/{trace.length} 步成功
          <ChevronDown size={16} className={open ? "rotate" : ""} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <ol className="trace-list">
          {trace.map((item, index) => (
            <li key={`${item.tool}-${index}`}>
              <span className="trace-order">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{item.label}</strong>
                <code>{item.tool}</code>
              </div>
              <p>{item.summary}</p>
              <span className={`trace-status ${item.status}`}>
                {item.status === "success" ? `${item.durationMs} ms` : "已降级"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SideRail({ result, loading }: { result: PlanResponse | null; loading: boolean }) {
  return (
    <aside className="side-rail" aria-label="门店与优惠">
      <section className="rail-section store-section">
        <div className="rail-title">
          <span className="rail-icon">
            <Store size={17} aria-hidden="true" />
          </span>
          <div>
            <p>本次门店</p>
            <span>{loading ? "正在定位…" : result?.mode === "live" ? "MCP 实时匹配" : "演示门店"}</span>
          </div>
        </div>
        <h3>{result?.store.name ?? "正在查询附近门店"}</h3>
        <p className="store-address">
          <MapPin size={14} aria-hidden="true" />
          {result?.store.address ?? "请稍候"}
        </p>
        <div className="store-meta">
          <span className={result?.store.businessStatus ? "open" : "closed"}>
            <span />
            {result?.store.businessStatus ? "营业中" : "休息中"}
          </span>
          {result?.store.businessStartTime && (
            <span>
              {result.store.businessStartTime}–{result.store.businessEndTime}
            </span>
          )}
          {result?.store.distance !== undefined && <span>{result.store.distance}m</span>}
        </div>
      </section>

      <section className="rail-section coupon-section">
        <div className="rail-title">
          <span className="rail-icon accent">
            <TicketPercent size={17} aria-hidden="true" />
          </span>
          <div>
            <p>能领的券</p>
            <span>领券后再去下单</span>
          </div>
        </div>
        <div className="coupon-list">
          {result?.coupons.slice(0, 3).map((coupon) => (
            <div className="coupon-row" key={coupon.name}>
              <CouponImage coupon={coupon} />
              <div>
                <strong>{coupon.name}</strong>
                <span>{coupon.label}</span>
              </div>
              <ArrowRight size={15} aria-hidden="true" />
            </div>
          ))}
          {!result && <div className="coupon-placeholder" />}
        </div>
      </section>

      <section className="rail-section campaign-section">
        <div className="rail-title">
          <span className="rail-icon ink">
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <div>
            <p>今天吃什么</p>
            <span>活动日历</span>
          </div>
        </div>
        <div className="campaign-list">
          {result?.campaigns.slice(0, 2).map((campaign) => (
            <article className="campaign-card" key={`${campaign.date}-${campaign.title}`}>
              {campaign.image && (
                <img src={campaign.image} alt="" loading="lazy" />
              )}
              <div className="campaign-overlay">
                <span>{campaign.badge}</span>
                <h4>{campaign.title}</h4>
                <p>{campaign.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {result && <p className="rail-notice">{result.notice}</p>}
    </aside>
  );
}

function CouponImage({ coupon }: { coupon: PlanResponse["coupons"][number] }) {
  const [failed, setFailed] = useState(false);
  if (!coupon.image || failed) {
    return (
      <span className="coupon-image coupon-fallback" aria-hidden="true">
        %
      </span>
    );
  }
  return (
    <span className="coupon-image">
      <img src={coupon.image} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

function PlanSkeleton() {
  return (
    <div className="skeleton" aria-label="正在计算搭配">
      <div className="skeleton-head">
        <span />
        <span />
      </div>
      <div className="skeleton-price" />
      <div className="skeleton-row" />
      <div className="skeleton-row short" />
      <div className="skeleton-tabs">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default App;
