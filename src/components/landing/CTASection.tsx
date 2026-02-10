import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="pricing" className="relative py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="glass-strong p-12 rounded-3xl relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to transform your workflow?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join teams already using AI to manage projects smarter. Start free, upgrade when you're ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base glow-blue group"
                asChild
              >
                <Link to="/signup">
                  Get started for free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border border-border/40 text-foreground rounded-full px-8 h-12 text-base"
              >
                Talk to sales
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTASection;
