import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      
      if (type === "recovery") {
        setIsValidSession(true);
      } else {
        // Check if user has an active session from recovery link
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidSession(true);
        }
      }
      setChecking(false);
    };

    checkSession();

    // Listen for auth state changes (when user clicks recovery link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("passwordMinLength") || "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch") || "Passwords do not match");
      return;
    }

    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      toast.error(t("failedToResetPassword") || "Failed to reset password");
    } else {
      setIsSuccess(true);
      toast.success(t("passwordResetSuccess") || "Password updated successfully");
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={dir}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="relative w-full max-w-md text-center glass-strong p-10 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("invalidResetLink") || "Invalid Reset Link"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("invalidResetLinkDesc") || "This password reset link is invalid or has expired. Please request a new one."}
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" dir={dir}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="relative w-full max-w-md text-center glass-strong p-10 space-y-4">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {t("passwordUpdated") || "Password Updated"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("passwordUpdatedDesc") || "Your password has been updated successfully. Redirecting to login..."}
          </p>
          <Link to="/login">
            <Button variant="ghost" className="mt-4 text-primary hover:text-primary/80">
              {t("goToLogin") || "Go to login"}
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
            {t("createNewPassword") || "Create a new password for your account"}
          </p>
        </div>

        <div className="glass-strong p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm">
                {t("newPassword") || "New Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("minChars") || "Min 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 h-11 pe-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground text-sm">
                {t("confirmPassword") || "Confirm Password"}
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder={t("confirmPasswordPlaceholder") || "Re-enter your password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 h-11"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-11 text-sm font-medium glow-blue"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                t("updatePassword") || "Update Password"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              {t("backToLogin") || "Back to login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;