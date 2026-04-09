import { useState, useCallback, useRef, useEffect } from "react";

const LOGO_URL = ""; // Replace with your cafe logo URL, e.g. "https://example.com/logo.png"

function LogoImage() {
  const [failed, setFailed] = useState(false);
  if (!LOGO_URL || failed) {
    return <span className="text-2xl leading-none">☕</span>;
  }
  return (
    <img
      src={LOGO_URL}
      alt="Cafe Logo"
      className="w-full h-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

type Language = "en" | "ar";

interface Order {
  id: number;
  number: number;
  isNew: boolean;
}

const T = {
  en: {
    dir: "ltr" as const,
    appTitle: "Order Ready",
    appSubtitle: "Your order is ready for pickup",
    placeholder: "Order #",
    notify: "Notify",
    clearAll: "Clear All",
    noOrdersTitle: "No orders ready yet",
    noOrdersSubtitle: "Enter an order number below to notify customers",
    readyLabel: "Ready for Pickup",
    langToggle: "AR",
    errorInvalid: "Enter a valid number (1–9999)",
    errorDuplicate: "Already on screen",
  },
  ar: {
    dir: "rtl" as const,
    appTitle: "الطلب جاهز",
    appSubtitle: "طلبك جاهز للاستلام",
    placeholder: "رقم الطلب",
    notify: "إشعار",
    clearAll: "مسح الكل",
    noOrdersTitle: "لا توجد طلبات جاهزة",
    noOrdersSubtitle: "أدخل رقم الطلب أدناه لإعلام العملاء",
    readyLabel: "جاهز للاستلام",
    langToggle: "EN",
    errorInvalid: "أدخل رقمًا صحيحًا (١–٩٩٩٩)",
    errorDuplicate: "الطلب معروض بالفعل",
  },
};

function playBell() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [
      [523.25, 0],
      [659.25, 0.15],
      [783.99, 0.3],
      [1046.5, 0.45],
    ].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.8);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.8);
    });
    setTimeout(() => ctx.close(), 3000);
  } catch {
    /* no-op */
  }
}

/* ─────────────────────────────────────────────────────────────
   Dynamic scaling hook
   Watches the container dimensions + order count and computes
   the largest square card size that fits every order on screen
   without any scrolling — no matter how many orders exist.
───────────────────────────────────────────────────────────── */
interface GridLayout {
  cols: number;
  cardSize: number;
  fontSize: number;
  gap: number;
}

function useScaledGrid(
  containerRef: React.RefObject<HTMLElement | null>,
  count: number
): GridLayout {
  const [layout, setLayout] = useState<GridLayout>({
    cols: 4,
    cardSize: 160,
    fontSize: 60,
    gap: 14,
  });

  const compute = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (count === 0) {
      setLayout({ cols: 4, cardSize: 160, fontSize: 60, gap: 14 });
      return;
    }

    const PAD = 20;  // inner padding on each side
    const G   = 14;  // gap between cards
    const W   = Math.max(1, el.clientWidth  - PAD * 2);
    const H   = Math.max(1, el.clientHeight - PAD * 2);

    // Find the column count that maximises card size
    let best = 0;
    let bestCols = 1;
    for (let c = 1; c <= count; c++) {
      const r   = Math.ceil(count / c);
      const cw  = (W - (c - 1) * G) / c;
      const ch  = (H - (r - 1) * G) / r;
      const s   = Math.min(cw, ch);
      if (s > best) { best = s; bestCols = c; }
    }

    const cardSize = Math.max(55, Math.min(best, 260));
    const fontSize = Math.round(cardSize * 0.38);
    setLayout({ cols: bestCols, cardSize, fontSize, gap: G });
  }, [containerRef, count]);

  useEffect(() => {
    compute();
    const ro = new ResizeObserver(compute);
    const el = containerRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [compute, containerRef]);

  return layout;
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
export default function OrderSystem() {
  const [lang, setLang]         = useState<Language>("en");
  const [orders, setOrders]     = useState<Order[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [nextId, setNextId]     = useState(1);
  const inputRef  = useRef<HTMLInputElement>(null);
  const mainRef   = useRef<HTMLElement | null>(null);
  const layout    = useScaledGrid(mainRef, orders.length);
  const t         = T[lang];

  useEffect(() => {
    document.documentElement.dir  = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  const addOrder = useCallback(() => {
    const num = parseInt(inputValue.trim(), 10);
    if (!inputValue.trim() || isNaN(num) || num < 1 || num > 9999) {
      setErrorMsg(t.errorInvalid);
      inputRef.current?.focus();
      return;
    }
    if (orders.some((o) => o.number === num)) {
      setErrorMsg(t.errorDuplicate);
      inputRef.current?.focus();
      return;
    }
    setErrorMsg("");
    playBell();
    const id = nextId;
    setOrders((prev) => [{ id, number: num, isNew: true }, ...prev]);
    setNextId((n) => n + 1);
    setInputValue("");
    inputRef.current?.focus();
    setTimeout(() => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, isNew: false } : o)));
    }, 6000);
  }, [inputValue, orders, nextId, t]);

  const dismissOrder = useCallback((id: number) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setOrders([]);
    setErrorMsg("");
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ direction: t.dir }}
    >
      {/* ── SLIM HEADER ── */}
      <header className="flex-shrink-0 bg-primary text-primary-foreground flex items-center gap-3 px-4 sm:px-6 py-2.5 shadow-md">
        <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          <LogoImage />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-base sm:text-lg leading-tight tracking-tight truncate">
            {t.appTitle}
          </p>
          <p className="text-xs text-primary-foreground/70 leading-tight truncate hidden sm:block">
            {t.appSubtitle}
          </p>
        </div>
        {orders.length > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/80 bg-white/15 rounded-full px-3 py-1 border border-white/20 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block" />
            {orders.length} {t.readyLabel}
          </span>
        )}
      </header>

      {/* ── MAIN DISPLAY AREA ── */}
      {/* overflow-hidden: no scrollbars ever; layout JS ensures everything fits */}
      <main
        ref={mainRef}
        className="flex-1 overflow-hidden bg-background relative"
      >
        {/* Watermark — always centered via sticky-sentinel */}
        <div className="watermark-sentinel" aria-hidden="true" />

        {orders.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="text-7xl sm:text-8xl opacity-30 select-none">🔔</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground">
              {t.noOrdersTitle}
            </h2>
            <p className="text-muted-foreground/70 text-base sm:text-lg max-w-sm">
              {t.noOrdersSubtitle}
            </p>
          </div>
        ) : (
          /* Dynamic grid — fills 100% of main, no overflow */
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              gridTemplateColumns: `repeat(${layout.cols}, ${layout.cardSize}px)`,
              gap: `${layout.gap}px`,
              justifyContent: "center",
              alignContent: "center",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onDismiss={dismissOrder}
                cardSize={layout.cardSize}
                fontSize={layout.fontSize}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── COMPACT BOTTOM BAR (Staff Control) ── */}
      <footer className="flex-shrink-0 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 sm:px-5 py-2.5">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Number Input */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="number"
              min="1"
              max="9999"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setErrorMsg("");
              }}
              onKeyDown={(e) => e.key === "Enter" && addOrder()}
              placeholder={t.placeholder}
              className="w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-xl font-black text-center focus:outline-none focus:border-primary transition-colors"
              style={{ appearance: "textfield", MozAppearance: "textfield" } as React.CSSProperties}
            />
            {errorMsg && (
              <p className="absolute -top-6 start-0 text-xs text-destructive font-semibold whitespace-nowrap">
                ⚠ {errorMsg}
              </p>
            )}
          </div>

          {/* Notify button */}
          <button
            onClick={addOrder}
            className="flex-shrink-0 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-sm px-4 py-2.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            {t.notify}
          </button>

          {/* Clear All button */}
          <button
            onClick={clearAll}
            disabled={orders.length === 0}
            className="flex-shrink-0 rounded-xl border-2 border-destructive/60 text-destructive hover:bg-destructive/10 disabled:opacity-25 disabled:cursor-not-allowed font-semibold text-sm px-3 py-2.5 transition-all cursor-pointer whitespace-nowrap"
          >
            {t.clearAll}
          </button>

          {/* Divider */}
          <div className="w-px h-7 bg-border flex-shrink-0" />

          {/* Language toggle */}
          <button
            onClick={() => setLang((l) => (l === "en" ? "ar" : "en"))}
            className="flex-shrink-0 rounded-xl bg-muted hover:bg-accent text-foreground font-black text-sm px-3 py-2.5 transition-all cursor-pointer border border-border"
          >
            {t.langToggle}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Order card — size is driven entirely by the layout engine
───────────────────────────────────────────────────────────── */
function OrderCard({
  order,
  onDismiss,
  cardSize,
  fontSize,
}: {
  order: Order;
  onDismiss: (id: number) => void;
  cardSize: number;
  fontSize: number;
}) {
  return (
    <div
      onClick={() => onDismiss(order.id)}
      title="Tap to dismiss"
      style={{ width: cardSize, height: cardSize }}
      className={`
        relative flex items-center justify-center
        rounded-2xl border-4 select-none cursor-pointer
        transition-all duration-200
        hover:scale-95 hover:opacity-80 active:scale-90
        ${
          order.isNew
            ? "border-primary bg-primary/8 order-card-new shadow-xl"
            : "border-primary/40 bg-card order-card shadow-md"
        }
      `}
    >
      {order.isNew && (
        <span className="absolute top-2 end-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
      )}
      <span
        className={`font-black leading-none tabular-nums transition-colors ${
          order.isNew ? "text-primary" : "text-foreground/80"
        }`}
        style={{ fontSize }}
      >
        {order.number}
      </span>
    </div>
  );
}
