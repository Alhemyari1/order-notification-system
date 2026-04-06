import { useState, useCallback, useRef, useEffect } from "react";

const LOGO_URL = ""; // Replace with your cafe logo URL, e.g. "https://example.com/logo.png"

function LogoImage() {
  const [failed, setFailed] = useState(false);
  if (!LOGO_URL || failed) {
    return <span style={{ fontSize: "1.6rem" }}>☕</span>;
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
  timestamp: number;
  isNew: boolean;
}

const translations = {
  en: {
    dir: "ltr" as const,
    appTitle: "Order Ready",
    appSubtitle: "Your order is ready for pickup",
    controlPanelTitle: "Staff Control Panel",
    orderNumberLabel: "Ready Order Number",
    orderNumberPlaceholder: "Enter order #",
    notifyButton: "Notify / Add Order",
    clearAllButton: "Clear All",
    noOrdersTitle: "No orders ready yet",
    noOrdersSubtitle: "Use the control panel to notify customers",
    readyOrders: "Ready for Pickup",
    lang: "AR",
    orderInputError: "Please enter a valid order number",
    orderExists: "Order already displayed",
  },
  ar: {
    dir: "rtl" as const,
    appTitle: "الطلب جاهز",
    appSubtitle: "طلبك جاهز للاستلام",
    controlPanelTitle: "لوحة تحكم الموظفين",
    orderNumberLabel: "رقم الطلب الجاهز",
    orderNumberPlaceholder: "أدخل رقم الطلب",
    notifyButton: "إشعار / إضافة طلب",
    clearAllButton: "مسح الكل",
    noOrdersTitle: "لا توجد طلبات جاهزة",
    noOrdersSubtitle: "استخدم لوحة التحكم لإعلام العملاء",
    readyOrders: "جاهز للاستلام",
    lang: "EN",
    orderInputError: "يرجى إدخال رقم طلب صالح",
    orderExists: "الطلب معروض بالفعل",
  },
};

function playBellSound() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    const timings = [0, 0.15, 0.3, 0.45];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timings[i]);
      gain.gain.setValueAtTime(0, ctx.currentTime + timings[i]);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + timings[i] + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timings[i] + 0.8);

      osc.start(ctx.currentTime + timings[i]);
      osc.stop(ctx.currentTime + timings[i] + 0.8);
    });

    setTimeout(() => ctx.close(), 3000);
  } catch {
    // Audio not available
  }
}

export default function OrderSystem() {
  const [lang, setLang] = useState<Language>("en");
  const [orders, setOrders] = useState<Order[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [nextId, setNextId] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  const handleAddOrder = useCallback(() => {
    const num = parseInt(inputValue.trim(), 10);
    if (!inputValue.trim() || isNaN(num) || num <= 0 || num > 9999) {
      setErrorMsg(t.orderInputError);
      inputRef.current?.focus();
      return;
    }
    if (orders.some((o) => o.number === num)) {
      setErrorMsg(t.orderExists);
      inputRef.current?.focus();
      return;
    }

    setErrorMsg("");
    playBellSound();

    const newOrder: Order = {
      id: nextId,
      number: num,
      timestamp: Date.now(),
      isNew: true,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setNextId((n) => n + 1);
    setInputValue("");
    inputRef.current?.focus();

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === newOrder.id ? { ...o, isNew: false } : o))
      );
    }, 6000);
  }, [inputValue, orders, nextId, t]);

  const handleClearAll = useCallback(() => {
    setOrders([]);
    setErrorMsg("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleAddOrder();
    },
    [handleAddOrder]
  );

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  return (
    <div className="min-h-screen flex flex-col" style={{ direction: t.dir }}>
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
              {/* Replace LOGO_URL below with your cafe logo image URL */}
              <LogoImage />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">
                {t.appTitle}
              </h1>
              <p className="text-sm text-primary-foreground/80">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors font-bold text-sm border border-white/30 cursor-pointer"
          >
            {t.lang}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* ===== STAFF CONTROL PANEL ===== */}
        <aside className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sticky top-6">
            <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              {t.controlPanelTitle}
            </h2>

            {/* Order Number Input */}
            <div className="mb-4">
              <label
                htmlFor="order-input"
                className="block text-sm font-semibold text-muted-foreground mb-2"
              >
                {t.orderNumberLabel}
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id="order-input"
                  type="number"
                  min="1"
                  max="9999"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setErrorMsg("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t.orderNumberPlaceholder}
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  style={{ appearance: "textfield" }}
                />
              </div>
              {errorMsg && (
                <p className="mt-2 text-sm text-destructive font-medium">{errorMsg}</p>
              )}
            </div>

            {/* Notify Button */}
            <button
              onClick={handleAddOrder}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-bold text-base transition-all shadow-md hover:shadow-lg cursor-pointer mb-3"
            >
              {t.notifyButton}
            </button>

            {/* Clear All Button */}
            <button
              onClick={handleClearAll}
              disabled={orders.length === 0}
              className="w-full py-3 rounded-xl border-2 border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-sm transition-all cursor-pointer"
            >
              {t.clearAllButton}
            </button>

            {/* Order count badge */}
            {orders.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  <span className="font-bold text-primary text-lg">{orders.length}</span>{" "}
                  {t.readyOrders}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ===== CUSTOMER DISPLAY AREA ===== */}
        <section className="flex-1 min-w-0">
          {orders.length === 0 ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-2xl font-bold text-muted-foreground">{t.noOrdersTitle}</h3>
              <p className="text-muted-foreground mt-2 text-center px-4">{t.noOrdersSubtitle}</p>
            </div>
          ) : (
            <div>
              {/* Section label */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  {t.readyOrders}
                </span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* Order grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div
      className={`
        relative flex items-center justify-center
        rounded-2xl border-4 border-primary
        bg-gradient-to-br from-card to-primary/5
        shadow-lg
        aspect-square
        cursor-default select-none
        transition-all duration-300
        ${order.isNew ? "order-card-new" : "order-card"}
      `}
    >
      {/* Pulsing dot for new orders */}
      {order.isNew && (
        <span className="absolute top-2 end-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      )}

      <span className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-primary leading-none tabular-nums">
        {order.number}
      </span>
    </div>
  );
}
