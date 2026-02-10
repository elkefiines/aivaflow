import { motion } from "framer-motion";
import { Brain, FileSearch, LayoutDashboard, Users, BarChart3, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Task Generation",
    description: "Convert ideas and uploaded files into structured tasks with priorities, estimates, and dependencies — automatically.",
  },
  {
    icon: FileSearch,
    title: "File Analysis",
    description: "Upload project documents and let AI extract milestones, deliverables, and action items in seconds.",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description: "Real-time health scores, risk summaries, and AI-powered recommendations at a glance.",
  },
  {
    icon: Users,
    title: "Team Insights",
    description: "Monitor workload, detect burnout risk, and balance task distribution across your team.",
  },
  {
    icon: BarChart3,
    title: "Automated Reports",
    description: "Daily and weekly reports generated automatically with velocity metrics, blockers, and predictions.",
  },
  {
    icon: Zap,
    title: "Idea to Execution",
    description: "Type a rough idea, and AIVA converts it into epics, tasks, and subtasks with AI confidence scores.",
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
          className="text-center mb-16"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl group hover:border-primary/30 transition-all duration-300 hover:glow-blue-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
