import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { AlertTriangle, Clock, Moon, Shield, ChevronRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Task = Tables<"tasks">;

const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const timeout = setTimeout(() => {
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) { setCount(value); clearInterval(interval); }
        else setCount(Math.floor(current));
      }, 1200 / steps);
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
    <div ref={ref} className="h-3 bg-background rounded-full overflow-hidden flex-1">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{ width: inView ? `${Math.min(pct * 2.5, 100)}%` : "0%", transitionDelay: `${delay}ms` }}
      />
    </div>
  );
};

const statusBadgeColors: Record<string, string> = {
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  todo: "bg-primary/15 text-primary border-primary/30",
  backlog: "bg-muted/20 text-muted-foreground border-muted/30",
};

const statusLabels: Record<string, string> = {
  done: "Done", in_progress: "In Progress", review: "Review", todo: "To Do", backlog: "Backlog",
};

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-purple-500/20 text-purple-400",
  "bg-rose-500/20 text-rose-400",
];

const Dashboard = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideaCount, setIdeaCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [teamMembers, setTeamMembers] = useState<{ user_id: string; display_name: string }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
      .then(({ data }) => setDisplayName(data?.display_name || user.email?.split("@")[0] || ""));
  }, [user]);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      supabase.from("tasks").select("*").eq("project_id", projectId),
      supabase.from("ideas").select("id", { count: "exact" }).eq("project_id", projectId),
      supabase.from("reports").select("id", { count: "exact" }).eq("project_id", projectId),
      supabase.from("project_members").select("user_id").eq("project_id", projectId),
    ]).then(async ([tasksRes, ideasRes, reportsRes, membersRes]) => {
      setTasks(tasksRes.data || []);
      setIdeaCount(ideasRes.count || 0);
      setReportCount(reportsRes.count || 0);

      const userIds = (membersRes.data || []).map(m => m.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
        setTeamMembers((profiles || []).map(p => ({ user_id: p.user_id, display_name: p.display_name || "Unknown" })));
      }
    });
  }, [projectId]);

  const total = tasks.length || 1;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const review = tasks.filter(t => t.status === "review").length;
  const backlog = tasks.filter(t => t.status === "backlog").length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;
  const recentTasks = [...tasks].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);

  const statusBars = [
    { label: "Projects", pct: Math.round((done / total) * 100), color: "bg-emerald-500", route: "/tasks" },
    { label: "Tasks done", pct: Math.round((done / total) * 100), color: "bg-primary", route: "/tasks" },
    { label: "AI usage", pct: Math.round((ideaCount / Math.max(total, 1)) * 100), color: "bg-rose-400", route: "/ideas" },
    { label: "Reports", pct: Math.min(reportCount * 10, 100), color: "bg-amber-400", route: "/reports" },
  ];

  const stats = [
    { icon: AlertTriangle, label: "Overdue Tasks", value: overdue, color: "text-red-400", bg: "bg-red-400/10" },
    { icon: Clock, label: "Days saved", value: done, color: "text-amber-400", bg: "bg-amber-400/10" },
    { icon: Moon, label: "AI Actions", value: ideaCount, color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  const summaryItems = [
    { label: "In Progress", pct: Math.round((inProgress / total) * 100), color: "bg-emerald-500" },
    { label: "Review", pct: Math.round((review / total) * 100), color: "bg-primary" },
    { label: "Backlog", pct: Math.round((backlog / total) * 100), color: "bg-amber-400" },
  ];

  const now = new Date();
  const monthCounts = Array(12).fill(0);
  tasks.filter(t => t.status === "done").forEach(t => {
    const d = new Date(t.updated_at);
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (diff >= 0 && diff < 12) monthCounts[11 - diff]++;
  });
  const maxVal = Math.max(...monthCounts, 1);
  const chartPath = monthCounts.map((v, i) => `${(i / 11) * 100},${100 - (v / maxVal) * 80}`).join(" ");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthLabels = Array(12).fill(0).map((_, i) => months[(now.getMonth() - 11 + i + 12) % 12]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  } as const;
  const chartLine = {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: 1.8, delay: 0.3, ease: [0.37, 0, 0.63, 1] as const } },
  } as const;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.h3 variants={item} className="font-display text-xl font-bold text-foreground">
        Welcome in, <span className="font-normal text-muted-foreground">{displayName}</span>
      </motion.h3>

      <motion.div variants={item} className="flex items-center gap-6">
        <div className="flex items-center gap-2 flex-1">
          {statusBars.map((bar, i) => (
            <div key={bar.label} className="flex-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(bar.route)}>
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
        <div className="flex items-center gap-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} variants={item} className="flex items-center gap-2">
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
        <motion.div variants={item} className="col-span-2 glass p-4 rounded-xl">
          <h4 className="text-xs font-medium text-foreground mb-3">Summary</h4>
          <div className="space-y-3">
            {summaryItems.map((si, i) => (
              <div key={si.label} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/tasks")}>
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

        <motion.div variants={item} className="col-span-7 glass p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-foreground">Task completion</h4>
            <div className="flex items-center gap-3">
              {["12 months", "30 days", "1 week"].map((period, i) => (
                <button key={period} className={`text-[10px] px-2 py-0.5 rounded ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-36 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33)].map(v => (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-[8px] text-muted-foreground/40 w-6 text-right">{v}</span>
                  <div className="flex-1 h-px bg-border/10" />
                </div>
              ))}
            </div>
            <motion.svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none" initial="hidden" animate="show">
              <motion.polyline points={chartPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" variants={chartLine} />
            </motion.svg>
            <div className="flex justify-between mt-1">
              {monthLabels.map((m, i) => (
                <span key={i} className="text-[7px] text-muted-foreground/40">{m}</span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="col-span-3 glass p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-medium text-foreground">AI Insights</h4>
            </div>
            <motion.div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center" animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
              <ChevronRight className="w-3 h-3 text-primary" />
            </motion.div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">AI-powered analysis keeps your projects secure and on track.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <motion.div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center" animate={{ boxShadow: ["0 0 0px hsl(var(--primary) / 0)", "0 0 12px hsl(var(--primary) / 0.4)", "0 0 0px hsl(var(--primary) / 0)"] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                <span className="text-[9px] font-medium text-primary">Priority</span>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              {[{ color: "bg-primary", size: "w-8 h-8", delay: 0 }, { color: "bg-emerald-500", size: "w-6 h-6", delay: 0.15 }, { color: "bg-amber-400", size: "w-5 h-5", delay: 0.3 }].map((dot, i) => (
                <motion.div key={i} className={`${dot.size} ${dot.color} rounded-full opacity-60`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 + dot.delay, type: "spring", stiffness: 200 }} />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <motion.div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 1.5, duration: 0.6 }}>
                <span className="text-[9px] font-medium text-muted-foreground">Threats</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Tasks & Team */}
      <div className="grid grid-cols-12 gap-4">
        <motion.div variants={item} className="col-span-8 glass p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-foreground">Recent Tasks</h4>
            <button className="text-[10px] text-primary hover:underline" onClick={() => navigate("/tasks")}>View all</button>
          </div>
          <div className="space-y-2">
            {recentTasks.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No tasks yet</p>}
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/20 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate("/tasks")}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === "critical" ? "bg-destructive" : task.priority === "high" ? "bg-amber-400" : task.priority === "medium" ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <span className="text-sm text-foreground truncate">{task.title}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${statusBadgeColors[task.status || "backlog"]}`}>
                  {statusLabels[task.status || "backlog"]}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="col-span-4 glass p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-medium text-foreground">Team</h4>
            </div>
            <button className="text-[10px] text-primary hover:underline" onClick={() => navigate("/team")}>Manage</button>
          </div>
          <div className="space-y-2">
            {teamMembers.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No members yet</p>}
            {teamMembers.map((member, i) => {
              const initials = (member.display_name || "U").split(/\s/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
              return (
                <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/50 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={`text-[10px] font-semibold ${avatarColors[i % avatarColors.length]}`}>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground truncate">{member.display_name}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
