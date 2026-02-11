import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { ShaderCanvas } from "@/components/ui/animated-shader-hero";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* WebGL Shader Background */}
      <ShaderCanvas className="z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="animate-fade-in-down">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-8 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            AI-Powered Project Management
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            <span className="text-foreground">From </span>
            <span className="italic text-gradient-blue">idea to execution</span>
            <br />
            <span className="text-foreground">powered by </span>
            <span className="text-primary">AI</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            Transform how your team manages projects. AIVA Flow uses artificial intelligence to
            analyze files, generate tasks, track progress, and deliver automated reports.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base glow-blue group"
              asChild
            >
              <Link to="/signup">
                Book a demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="border border-border/40 text-foreground hover:bg-card/50 rounded-full px-8 h-12 text-base"
              asChild
            >
              <Link to="/signup">
                <Play className="mr-2 h-4 w-4" />
                Try it free
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
