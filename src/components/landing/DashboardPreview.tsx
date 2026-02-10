import { motion } from "framer-motion";
import { AlertTriangle, Clock, Moon, TrendingUp, Shield, ChevronRight, Search, Bell } from "lucide-react";

const tabs = ["Overview", "Incidents", "Metrics", "History", "Teams"];

const stats = [
  { icon: AlertTriangle, label: "Critical Issues", value: "38", color: "text-red-400", bg: "bg-red-400/10" },
  { icon: Clock, label: "Days open", value: "26", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Moon, label: "Overnight work", value: "103", color: "text-blue-400", bg: "bg-blue-400/10" },
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

const DashboardPreview = () => {
  // Generate fake chart data points for the line chart
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

  return (
    <section className="relative z-10 -mt-24 px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="glass-strong p-1 rounded-3xl glow-blue">
          <div className="bg-card rounded-[22px] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/20">
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
            </div>

            <div className="p-6">
              {/* Welcome line */}
              <h3 className="font-display text-xl font-bold text-foreground mb-5">
                Welcome in, <span className="font-normal text-muted-foreground">Caroline</span>
              </h3>

              {/* Status bars row + stat numbers */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 flex-1">
                  {statusBars.map((bar) => (
                    <div key={bar.label} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground">{bar.label}</span>
                      </div>
                      <div className="h-6 bg-background rounded-lg overflow-hidden flex items-center px-2">
                        <div
                          className={`h-3 ${bar.color} rounded-full transition-all`}
                          style={{ width: `${bar.pct * 2.5}%` }}
                        />
                        <span className="ml-2 text-[10px] text-muted-foreground">{bar.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right stats */}
                <div className="flex items-center gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xl font-display font-bold text-foreground leading-none">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                {/* Left: Summary */}
                <div className="col-span-2 glass p-4 rounded-xl">
                  <h4 className="text-xs font-medium text-foreground mb-3">Summary</h4>
                  <div className="space-y-3">
                    {summaryItems.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground">{item.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full`}
                              style={{ width: `${item.pct * 5}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center: Incident frequency chart */}
                <div className="col-span-7 glass p-4 rounded-xl">
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

                  {/* SVG Line Chart */}
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
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                      {/* Green line */}
                      <polyline
                        points={toPath(chartPoints.green)}
                        fill="none"
                        stroke="hsl(142 71% 45%)"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                      {/* Blue line */}
                      <polyline
                        points={toPath(chartPoints.blue)}
                        fill="none"
                        stroke="hsl(233 90% 60%)"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                      {/* Pink line */}
                      <polyline
                        points={toPath(chartPoints.pink)}
                        fill="none"
                        stroke="hsl(330 80% 60%)"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                      {/* Tooltip dot */}
                      <circle cx="63.6" cy="24.4" r="1.2" fill="hsl(233 90% 60%)" />
                    </svg>

                    {/* Tooltip */}
                    <div className="absolute top-4 right-[30%] glass px-2 py-1 rounded-lg text-[9px] text-foreground pointer-events-none">
                      <span className="text-muted-foreground">7 September</span>
                      <br />
                      <span>5 incidents</span>
                    </div>

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-1">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <span key={m} className="text-[7px] text-muted-foreground/40">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Vulnerability */}
                <div className="col-span-3 glass p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-medium text-foreground">Vulnerability</h4>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">
                    Encryption ensures customer data remains completely secure from breaches.
                  </p>

                  {/* Priority circles */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                        <span className="text-[9px] font-medium text-primary">Priority</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[
                        { color: "bg-primary", size: "w-8 h-8" },
                        { color: "bg-emerald-500", size: "w-6 h-6" },
                        { color: "bg-amber-400", size: "w-5 h-5" },
                      ].map((dot, i) => (
                        <div key={i} className={`${dot.size} ${dot.color} rounded-full opacity-60`} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                        <span className="text-[9px] font-medium text-muted-foreground">Threats</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default DashboardPreview;
