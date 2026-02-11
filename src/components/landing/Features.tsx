import { motion } from "framer-motion";
import { Brain, FileSearch, LayoutDashboard, Users, BarChart3, Zap } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const features = [
  {
    id: 1,
    title: "AI Task Generation",
    date: "Core Feature",
    content: "Convert ideas and uploaded files into structured tasks with priorities, estimates, and dependencies — automatically.",
    category: "AI",
    icon: Brain,
    relatedIds: [2, 6],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 2,
    title: "File Analysis",
    date: "Core Feature",
    content: "Upload project documents and let AI extract milestones, deliverables, and action items in seconds.",
    category: "Analysis",
    icon: FileSearch,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Smart Dashboard",
    date: "Core Feature",
    content: "Real-time health scores, risk summaries, and AI-powered recommendations at a glance.",
    category: "Dashboard",
    icon: LayoutDashboard,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 75,
  },
  {
    id: 4,
    title: "Team Insights",
    date: "Core Feature",
    content: "Monitor workload, detect burnout risk, and balance task distribution across your team.",
    category: "Team",
    icon: Users,
    relatedIds: [3, 5],
    status: "in-progress" as const,
    energy: 60,
  },
  {
    id: 5,
    title: "Automated Reports",
    date: "Core Feature",
    content: "Daily and weekly reports generated automatically with velocity metrics, blockers, and predictions.",
    category: "Reports",
    icon: BarChart3,
    relatedIds: [4, 6],
    status: "pending" as const,
    energy: 40,
  },
  {
    id: 6,
    title: "Idea to Execution",
    date: "Core Feature",
    content: "Type a rough idea, and AIVA converts it into epics, tasks, and subtasks with AI confidence scores.",
    category: "AI",
    icon: Zap,
    relatedIds: [1, 5],
    status: "pending" as const,
    energy: 25,
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-sm text-primary font-medium mb-3 tracking-wide uppercase">Features</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything you need to{" "}
            <span className="text-gradient-blue">ship faster</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for modern teams who want AI to handle the busywork while they focus on building.
          </p>
        </motion.div>

        <RadialOrbitalTimeline timelineData={features} />
      </div>
    </section>
  );
};

export default Features;
