import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useLanguage } from "@/hooks/useLanguage";

const CTASection = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <section id="pricing" className="relative py-16 sm:py-24 px-4 sm:px-6" dir={dir}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
        <div className="relative rounded-2xl sm:rounded-3xl border border-border/30 bg-card/80 backdrop-blur-2xl p-6 sm:p-12 overflow-hidden">
          <GlowingEffect spread={60} glow disabled={false} proximity={80} inactiveZone={0.01} borderWidth={2} blur={4} />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("ctaTitle")}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto text-sm sm:text-base">
              {t("ctaSubtitle")}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-11 sm:h-12 text-sm sm:text-base glow-blue group" asChild>
                <Link to="/signup">
                  {t("ctaButton")}
                  <ArrowRight className={`ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180" : ""}`} />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto border border-border/40 text-foreground rounded-full px-8 h-11 sm:h-12 text-sm sm:text-base">
                {t("ctaTalk")}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
