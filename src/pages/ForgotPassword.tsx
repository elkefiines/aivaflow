import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="relative w-full max-w-md text-center glass-strong p-10 space-y-4">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("checkYourEmail") || "Check your email"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("resetLinkSent") || "We've sent a password reset link to"}{" "}
            <span className="text-foreground font-medium">{email}</span>
          </p>
          <Link to="/login">
            <Button variant="ghost" className="mt-4 text-primary hover:text-primary/80">
              {t("backToLogin") || "Back to login"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="font-display text-2xl font-bold text-foreground">
              AIVA <span className="text-primary">Flow</span>
            </h1>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("forgotPasswordDesc") || "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="glass-strong p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground text-sm">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 h-11"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-11 text-sm font-medium glow-blue"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                t("sendResetLink") || "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
              <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
              {t("backToLogin") || "Back to login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;