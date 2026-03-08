import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";

const NotFound = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative text-center max-w-md">
        <div className="mb-6">
          <span className="text-8xl font-display font-bold bg-gradient-to-br from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent">
            404
          </span>
        </div>
        
        <h1 className="font-display text-2xl font-bold text-foreground mb-3">
          {t("pageNotFound") || "Page Not Found"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("pageNotFoundDesc") || "The page you're looking for doesn't exist or has been moved."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="rounded-full glow-blue">
            <Link to="/">
              <Home className="h-4 w-4 me-2" />
              {t("backToHome") || "Back to Home"}
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/dashboard">
              {t("goToDashboard") || "Go to Dashboard"}
              <ArrowRight className={`h-4 w-4 ms-2 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;