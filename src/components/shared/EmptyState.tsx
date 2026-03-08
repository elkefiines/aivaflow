import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center text-center py-16 px-4"
  >
    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-primary/40" />
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
    {actionLabel && onAction && (
      <Button size="sm" className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
