import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Zap, FileText } from "lucide-react";

interface AIIntroStepProps {
  onFinish: () => void;
  onBack: () => void;
}

const capabilities = [
  { icon: Brain, title: "Smart Task Generation", desc: "Paste rough notes or upload files — AI creates structured tasks automatically." },
  { icon: Zap, title: "Priority Suggestions", desc: "AI analyzes your workload and suggests optimal task prioritization." },
  { icon: FileText, title: "Daily Reports", desc: "Get AI-generated summaries of your team's progress every day." },
];

const AIIntroStep = ({ onFinish, onBack }: AIIntroStepProps) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">Meet your AI assistant</h2>
      <p className="text-muted-foreground text-sm mt-1">AIVA Flow uses AI to supercharge your workflow</p>
    </div>
    <div className="space-y-3">
      {capabilities.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="flex gap-3">
      <Button type="button" variant="ghost" onClick={onBack} className="flex-1">Back</Button>
      <Button onClick={onFinish} className="flex-1">Get started</Button>
    </div>
  </div>
);

export default AIIntroStep;
