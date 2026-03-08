import { motion } from "framer-motion";
import { Upload, Cpu, CheckCircle } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useLanguage } from "@/hooks/useLanguage";

const HowItWorks = () => {
  const { t, dir } = useLanguage();

  const steps = [
    { icon: Upload, step: t("step01"), title: t("stepTitle1"), description: t("stepDesc1") },
    { icon: Cpu, step: t("step02"), title: t("stepTitle2"), description: t("stepDesc2") },
    { icon: CheckCircle, step: t("step03"), title: t("stepTitle3"), description: t("stepDesc3") },
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-6 cosmic-bg" dir={dir}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <p className="text-sm text-primary font-medium mb-3 tracking-wide uppercase">{t("howItWorksLabel")}</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("howItWorksTitle1")}<span className="italic text-gradient-blue">{t("howItWorksTitleHighlight")}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((step, i) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center relative">
              <div className="relative rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-8">
                <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
                <div className="relative z-10">
                  <div className="relative mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 glow-blue-sm">
                    <step.icon className="w-7 h-7 text-primary" />
                    <span className="absolute -top-2 -right-2 text-xs font-display font-bold text-primary bg-background px-2 py-0.5 rounded-full border border-primary/30">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
