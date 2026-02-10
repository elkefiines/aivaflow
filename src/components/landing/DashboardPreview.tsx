import { motion, useInView } from "framer-motion";
import { AlertTriangle, Clock, Moon, Shield, ChevronRight, Search, Bell } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const tabs = ["Overview", "Incidents", "Metrics", "History", "Teams"];

const stats = [
  { icon: AlertTriangle, label: "Critical Issues", value: 38, color: "text-red-400", bg: "bg-red-400/10" },
  { icon: Clock, label: "Days open", value: 26, color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Moon, label: "Overnight work", value: 103, color: "text-blue-400", bg: "bg-blue-400/10" },
];

const statusBars = [
  { label: "On-call shifts", pct: 20, color: "bg-emerald-500" },
  { label: "Status pages", pct: 25, color: "bg-primary" },
  { label: "Alerts used", pct: 40, color: "bg-rose-400" },
  { label: "Reports", pct: 15, color: "bg-amber-400" },
];

const summaryItems = [
  { label: "Triage", pct: 12, color: "bg-emerald-500" },
  { label: "Fixing", pct: 8, color: "bg-primary" },
  { label: "Investigating", pct: 2, color: "bg-amber-400" },
];

// Animated counter component
const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => {
      const duration = 1200;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, value, delay]);

  return <span ref={ref}>{count}</span>;
};

// Animated progress bar
const AnimatedBar = ({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="h-3 bg-background rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{
          width: inView ? `${pct * 2.5}%` : "0%",
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
};

const DashboardPreview = () => {
  const chartPoints = {
    green: [180, 200, 250, 280, 320, 350, 300, 280, 340, 380, 400, 420],
    blue: [120, 140, 160, 180, 200, 220, 190, 210, 250, 270, 300, 320],
    pink: [80, 100, 90, 120, 110, 140, 160, 150, 170, 190, 200, 180],
  };

  const maxVal = 450;
  const toPath = (points: number[]) => {
    const w = 100 / (points.length - 1);
    return points.map((p, i) => `${i * w},${100 - (p / maxVal) * 100}`).join(" ");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  } as const;

  const chartLine = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.8, delay, ease: [0.37, 0, 0.63, 1] as const },
    }),
  };

  return (
    <section className="relative z-10 -mt-24 px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto"
      >
        <div className="glass-strong p-1 rounded-3xl glow-blue">
          <div className="bg-card rounded-[22px] overflow-hidden">
            {/* Top bar */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center justify-between px-6 py-3 border-b border-border/20"
            >
              <span className="font-display font-bold text-foreground text-sm">Resq.io</span>
              <div className="flex items-center gap-1">
                {tabs.map((tab, i) => (
                  <button
                    key={tab}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      i === 0
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-400">C</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="p-6"
            >
              {/* Welcome line */}
              <motion.h3 variants={item} className="font-display text-xl font-bold text-foreground mb-5">
                Welcome in, <span className="font-normal text-muted-foreground">Caroline</span>
              </motion.h3>

              {/* Status bars row + stat numbers */}
              <motion.div variants={item} className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 flex-1">
                  {statusBars.map((bar, i) => (
                    <div key={bar.label} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground">{bar.label}</span>
                      </div>
                      <div className="h-6 bg-background rounded-lg overflow-hidden flex items-center px-2">
                        <AnimatedBar pct={bar.pct} color={bar.color} delay={400 + i * 150} />
                        <span className="ml-2 text-[10px] text-muted-foreground">{bar.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right stats with animated numbers */}
                <div className="flex items-center gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      variants={item}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xl font-display font-bold text-foreground leading-none">
                          <AnimatedNumber value={stat.value} delay={600 + i * 200} />
                        </p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <div className="grid grid-cols-12 gap-4">
                {/* Left: Summary */}
                <motion.div variants={item} className="col-span-2 glass p-4 rounded-xl">
                  <h4 className="text-xs font-medium text-foreground mb-3">Summary</h4>
                  <div className="space-y-3">
                    {summaryItems.map((si, i) => (
                      <div key={si.label} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">{si.label}</span>
                            <span className="text-[10px] text-muted-foreground">{si.pct}%</span>
                          </div>
                          <AnimatedBar pct={si.pct * 4} color={si.color} delay={800 + i * 150} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Center: Incident frequency chart with animated SVG lines */}
                <motion.div variants={item} className="col-span-7 glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-foreground">Incident frequency</h4>
                    <div className="flex items-center gap-3">
                      {["12 months", "30 days", "1 week"].map((period, i) => (
                        <button
                          key={period}
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-36 relative">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[400, 300, 200].map((v) => (
                        <div key={v} className="flex items-center gap-2">
                          <span className="text-[8px] text-muted-foreground/40 w-6 text-right">{v}</span>
                          <div className="flex-1 h-px bg-border/10" />
                        </div>
                      ))}
                    </div>

                    <motion.svg
                      viewBox="0 0 100 100"
                      className="w-full h-full"
                      preserveAspectRatio="none"
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                    >
                      {/* Green line */}
                      <motion.polyline
                        points={toPath(chartPoints.green)}
                        fill="none"
                        stroke="hsl(142 71% 45%)"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        variants={chartLine}
                        custom={0.3}
                      />
                      {/* Blue line */}
                      <motion.polyline
                        points={toPath(chartPoints.blue)}
                        fill="none"
                        stroke="hsl(233 90% 60%)"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        variants={chartLine}
                        custom={0.5}
                      />
                      {/* Pink line */}
                      <motion.polyline
                        points={toPath(chartPoints.pink)}
                        fill="none"
                        stroke="hsl(330 80% 60%)"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        variants={chartLine}
                        custom={0.7}
                      />
                      {/* Tooltip dot */}
                      <motion.circle
                        cx="63.6"
                        cy="24.4"
                        r="1.2"
                        fill="hsl(233 90% 60%)"
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2, duration: 0.4, type: "spring" }}
                      />
                    </motion.svg>

                    {/* Tooltip */}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 2.2, duration: 0.4 }}
                      className="absolute top-4 right-[30%] glass px-2 py-1 rounded-lg text-[9px] text-foreground pointer-events-none"
                    >
                      <span className="text-muted-foreground">7 September</span>
                      <br />
                      <span>5 incidents</span>
                    </motion.div>

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-1">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <span key={m} className="text-[7px] text-muted-foreground/40">{m}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Right: Vulnerability */}
                <motion.div variants={item} className="col-span-3 glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-medium text-foreground">Vulnerability</h4>
                    </div>
                    <motion.div
                      className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </motion.div>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                    Encryption ensures customer data remains completely secure from breaches.
                  </p>

                  {/* Priority circles with pulse animation */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center"
                        animate={{ boxShadow: ["0 0 0px hsl(233 90% 47% / 0)", "0 0 12px hsl(233 90% 47% / 0.4)", "0 0 0px hsl(233 90% 47% / 0)"] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <span className="text-[9px] font-medium text-primary">Priority</span>
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[
                        { color: "bg-primary", size: "w-8 h-8", delay: 0 },
                        { color: "bg-emerald-500", size: "w-6 h-6", delay: 0.15 },
                        { color: "bg-amber-400", size: "w-5 h-5", delay: 0.3 },
                      ].map((dot, i) => (
                        <motion.div
                          key={i}
                          className={`${dot.size} ${dot.color} rounded-full opacity-60`}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.2 + dot.delay, type: "spring", stiffness: 200 }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <motion.div
                        className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center"
                        initial={{ opacity: 0, rotate: -90 }}
                        whileInView={{ opacity: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.5, duration: 0.6 }}
                      >
                        <span className="text-[9px] font-medium text-muted-foreground">Threats</span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default DashboardPreview;
