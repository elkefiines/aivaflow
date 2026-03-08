import { motion, useInView } from "framer-motion";
import { AlertTriangle, Clock, Moon, Shield, ChevronRight, Search, Bell } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Logos3 } from "@/components/ui/logos3";

const tabs = ["Overview", "Projects", "Tasks", "Reports", "Teams"];

const stats = [
  { icon: AlertTriangle, label: "Overdue Tasks", value: 38, color: "text-red-400", bg: "bg-red-400/10" },
  { icon: Clock, label: "Days saved", value: 26, color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Moon, label: "AI Actions", value: 103, color: "text-blue-400", bg: "bg-blue-400/10" },
];

const statusBars = [
  { label: "Projects", pct: 20, color: "bg-emerald-500" },
  { label: "Tasks done", pct: 25, color: "bg-primary" },
  { label: "AI usage", pct: 40, color: "bg-rose-400" },
  { label: "Reports", pct: 15, color: "bg-amber-400" },
];

const summaryItems = [
  { label: "In Progress", pct: 12, color: "bg-emerald-500" },
  { label: "Review", pct: 8, color: "bg-primary" },
  { label: "Backlog", pct: 2, color: "bg-amber-400" },
];

const trustedLogos = [
  { id: "logo-1", description: "Acme Corp", image: "https://img.logoipsum.com/243.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-2", description: "Globex", image: "https://img.logoipsum.com/244.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-3", description: "Initech", image: "https://img.logoipsum.com/245.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-4", description: "Umbrella", image: "https://img.logoipsum.com/246.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-5", description: "Hooli", image: "https://img.logoipsum.com/247.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-6", description: "Pied Piper", image: "https://img.logoipsum.com/248.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-7", description: "Massive Dynamic", image: "https://img.logoipsum.com/249.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
  { id: "logo-8", description: "Soylent", image: "https://img.logoipsum.com/250.svg", className: "h-7 w-auto brightness-0 invert opacity-60" },
];

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
        if (current >= value) { setCount(value); clearInterval(interval); }
        else setCount(Math.floor(current));
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [inView, value, delay]);

  return <span ref={ref}>{count}</span>;
};

const AnimatedBar = ({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="h-3 bg-background rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{ width: inView ? `${pct * 2.5}%` : "0%", transitionDelay: `${delay}ms` }}
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
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  } as const;

  const chartLine = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (delay: number) => ({
      pathLength: 1, opacity: 1,
      transition: { duration: 1.8, delay, ease: [0.37, 0, 0.63, 1] as const },
    }),
  };

  return (
    <section className="relative z-10 -mt-24 px-4 sm:px-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto"
      >
        <div className="glass-strong p-1 rounded-2xl sm:rounded-3xl glow-blue">
          <div className="bg-card rounded-[18px] sm:rounded-[22px] overflow-hidden">
            {/* Top bar */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border/20"
            >
              <span className="font-display font-bold text-foreground text-sm">AIVA Flow</span>
              <div className="hidden sm:flex items-center gap-1">
                {tabs.map((tab, i) => (
                  <button key={tab} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
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

            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="p-3 sm:p-6">
              <motion.h3 variants={item} className="font-display text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-5">
                Welcome in, <span className="font-normal text-muted-foreground">Caroline</span>
              </motion.h3>

              {/* Status bars + stats */}
              <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                  {statusBars.map((bar, i) => (
                    <div key={bar.label}>
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
                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  {stats.map((stat, i) => (
                    <motion.div key={stat.label} variants={item} className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-display font-bold text-foreground leading-none">
                          <AnimatedNumber value={stat.value} delay={600 + i * 200} />
                        </p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Main grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
                <motion.div variants={item} className="xl:col-span-2 glass p-4 rounded-xl">
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

                <motion.div variants={item} className="xl:col-span-7 glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-foreground">Task completion</h4>
                    <div className="hidden sm:flex items-center gap-3">
                      {["12 months", "30 days", "1 week"].map((period, i) => (
                        <button key={period} className={`text-[10px] px-2 py-0.5 rounded ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-28 sm:h-36 relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[400, 300, 200].map((v) => (
                        <div key={v} className="flex items-center gap-2">
                          <span className="text-[8px] text-muted-foreground/40 w-6 text-right">{v}</span>
                          <div className="flex-1 h-px bg-border/10" />
                        </div>
                      ))}
                    </div>
                    <motion.svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none" initial="hidden" whileInView="show" viewport={{ once: true }}>
                      <motion.polyline points={toPath(chartPoints.green)} fill="none" stroke="hsl(142 71% 45%)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" variants={chartLine} custom={0.3} />
                      <motion.polyline points={toPath(chartPoints.blue)} fill="none" stroke="hsl(233 90% 60%)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" variants={chartLine} custom={0.5} />
                      <motion.polyline points={toPath(chartPoints.pink)} fill="none" stroke="hsl(330 80% 60%)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" variants={chartLine} custom={0.7} />
                      <motion.circle cx="63.6" cy="24.4" r="1.2" fill="hsl(233 90% 60%)" initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2, duration: 0.4, type: "spring" }} />
                    </motion.svg>
                    <motion.div initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 2.2, duration: 0.4 }} className="absolute top-4 right-[30%] glass px-2 py-1 rounded-lg text-[9px] text-foreground pointer-events-none hidden sm:block">
                      <span className="text-muted-foreground">7 September</span><br /><span>5 incidents</span>
                    </motion.div>
                    <div className="flex justify-between mt-1">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <span key={m} className="text-[7px] text-muted-foreground/40">{m}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="xl:col-span-3 glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-medium text-foreground">Vulnerability</h4>
                    </div>
                    <motion.div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center" animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </motion.div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">AI-powered analysis keeps your projects secure and on track.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <motion.div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center" animate={{ boxShadow: ["0 0 0px hsl(233 90% 47% / 0)", "0 0 12px hsl(233 90% 47% / 0.4)", "0 0 0px hsl(233 90% 47% / 0)"] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                        <span className="text-[9px] font-medium text-primary">Priority</span>
                      </motion.div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[{ color: "bg-primary", size: "w-8 h-8", delay: 0 }, { color: "bg-emerald-500", size: "w-6 h-6", delay: 0.15 }, { color: "bg-amber-400", size: "w-5 h-5", delay: 0.3 }].map((dot, i) => (
                        <motion.div key={i} className={`${dot.size} ${dot.color} rounded-full opacity-60`} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 + dot.delay, type: "spring", stiffness: 200 }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <motion.div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center" initial={{ opacity: 0, rotate: -90 }} whileInView={{ opacity: 1, rotate: 0 }} viewport={{ once: true }} transition={{ delay: 1.5, duration: 0.6 }}>
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

      {/* Trusted by */}
      <Logos3 heading="Trusted by teams at" logos={trustedLogos} />
    </section>
  );
};

export default DashboardPreview;
