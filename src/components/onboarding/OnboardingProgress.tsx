import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OnboardingProgressProps {
  steps: string[];
  current: number;
}

const OnboardingProgress = ({ steps, current }: OnboardingProgressProps) => (
  <div className="flex items-center justify-between gap-2">
    {steps.map((label, i) => (
      <div key={label} className="flex items-center gap-2 flex-1">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all",
            i < current && "bg-primary text-primary-foreground",
            i === current && "bg-primary/20 border-2 border-primary text-primary",
            i > current && "bg-card border border-border text-muted-foreground"
          )}
        >
          {i < current ? <Check className="h-4 w-4" /> : i + 1}
        </div>
        <span className={cn("text-xs font-medium hidden sm:block", i <= current ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </span>
        {i < steps.length - 1 && (
          <div className={cn("h-px flex-1", i < current ? "bg-primary" : "bg-border")} />
        )}
      </div>
    ))}
  </div>
);

export default OnboardingProgress;
