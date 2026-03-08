import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const { lang } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-destructive/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {lang === "ar" ? "حدث خطأ" : "Something went wrong"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        {message || (lang === "ar" ? "تعذر تحميل البيانات. حاول مرة أخرى." : "Failed to load data. Please try again.")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          {lang === "ar" ? "إعادة المحاولة" : "Retry"}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
