import { motion } from "framer-motion";
import { AlertTriangle, Clock, Moon, TrendingUp, Shield, ChevronRight } from "lucide-react";

const tabs = ["Summary", "Incidents", "Vulnerability", "Assets"];

const stats = [
  { icon: AlertTriangle, label: "Critical", value: "38", color: "text-red-400", bg: "bg-red-400/10" },
  { icon: Clock, label: "Days Open", value: "26", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Moon, label: "Overnight", value: "103", color: "text-blue-400", bg: "bg-blue-400/10" },
];

const progressBars = [
  { label: "Resolved", pct: 67, color: "bg-emerald-500" },
  { label: "In Progress", pct: 21, color: "bg-primary" },
  { label: "Critical", pct: 12, color: "bg-rose-500" },
];

const DashboardPreview = () => {
  return (
    <section className="relative z-10 -mt-20 px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="glass-strong p-1 rounded-3xl glow-blue">
          <div className="bg-card rounded-[22px] p-6 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    i === 0
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Stats + Progress */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="glass p-4 rounded-xl">
                      <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bars */}
                <div className="glass p-5 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-4">Task Status Overview</h4>
                  <div className="space-y-3">
                    {progressBars.map((bar) => (
                      <div key={bar.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20">{bar.label}</span>
                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bar.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{bar.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock chart area */}
                <div className="glass p-5 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-4">Incident Frequency</h4>
                  <div className="h-32 flex items-end gap-1.5">
                    {[35, 50, 40, 65, 45, 70, 55, 80, 60, 75, 50, 85, 65, 70, 55, 90, 70, 60, 75, 80].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-primary/30 rounded-t hover:bg-primary/50 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">
                {/* AI Recommendations */}
                <div className="glass p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">AI Insights</h4>
                  </div>
                  <div className="space-y-3">
                    {["3 tasks at risk of delay", "Team velocity up 12%", "Sprint goal 78% complete"].map((insight) => (
                      <div key={insight} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ChevronRight className="w-3 h-3 text-primary" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vulnerability card */}
                <div className="glass p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-medium text-foreground">Risk Summary</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">High Priority</span>
                      <span className="text-red-400 font-medium">5</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Medium Priority</span>
                      <span className="text-amber-400 font-medium">12</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Low Priority</span>
                      <span className="text-emerald-400 font-medium">24</span>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="glass p-5 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    {["Generate Report", "Analyze Files", "View Standup"].map((action) => (
                      <button
                        key={action}
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
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
