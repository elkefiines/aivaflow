import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { ShaderCanvas } from "@/components/ui/animated-shader-hero";
import { useLanguage } from "@/hooks/useLanguage";

const Hero = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" dir={dir}>
      <ShaderCanvas className="z-0" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="animate-fade-in-down">
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-8 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            {t("landingBadge")}
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            <span className="text-foreground">{t("landingHeadline1")}</span>
            <span className="italic text-gradient-blue">{t("landingHeadlineHighlight")}</span>
            <br />
            <span className="text-foreground">{t("landingHeadline2")}</span>
            <span className="text-primary">AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            {t("landingSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base glow-blue group" asChild>
              <Link to="/signup">
                {t("bookDemo")}
                <ArrowRight className={`ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180" : ""}`} />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="border border-border/40 text-foreground hover:bg-card/50 rounded-full px-8 h-12 text-base" asChild>
              <Link to="/signup">
                <Play className="me-2 h-4 w-4" />
                {t("tryFree")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
