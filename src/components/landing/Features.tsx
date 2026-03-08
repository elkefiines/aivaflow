import { motion } from "framer-motion";
import { Brain, FileSearch, LayoutDashboard, Users, BarChart3, Zap } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { useLanguage } from "@/hooks/useLanguage";

const Features = () => {
  const { t, dir } = useLanguage();

  const features = [
    { id: 1, title: t("featureAiTask"), date: t("coreFeature"), content: t("featureAiTaskDesc"), category: "AI", icon: Brain, relatedIds: [2, 6], status: "completed" as const, energy: 95 },
    { id: 2, title: t("featureFileAnalysis"), date: t("coreFeature"), content: t("featureFileAnalysisDesc"), category: "Analysis", icon: FileSearch, relatedIds: [1, 3], status: "completed" as const, energy: 90 },
    { id: 3, title: t("featureSmartDashboard"), date: t("coreFeature"), content: t("featureSmartDashboardDesc"), category: "Dashboard", icon: LayoutDashboard, relatedIds: [2, 4], status: "in-progress" as const, energy: 75 },
    { id: 4, title: t("featureTeamInsights"), date: t("coreFeature"), content: t("featureTeamInsightsDesc"), category: "Team", icon: Users, relatedIds: [3, 5], status: "in-progress" as const, energy: 60 },
    { id: 5, title: t("featureAutoReports"), date: t("coreFeature"), content: t("featureAutoReportsDesc"), category: "Reports", icon: BarChart3, relatedIds: [4, 6], status: "pending" as const, energy: 40 },
    { id: 6, title: t("featureIdeaExec"), date: t("coreFeature"), content: t("featureIdeaExecDesc"), category: "AI", icon: Zap, relatedIds: [1, 5], status: "pending" as const, energy: 25 },
  ];

  return (
    <section id="features" className="relative py-24 px-6" dir={dir}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <p className="text-sm text-primary font-medium mb-3 tracking-wide uppercase">{t("featuresLabel")}</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("featuresTitle1")}<span className="text-gradient-blue">{t("featuresTitleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("featuresSubtitle")}</p>
        </motion.div>
        <RadialOrbitalTimeline timelineData={features} />
      </div>
    </section>
  );
};

export default Features;
