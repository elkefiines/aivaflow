import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUp } = useAuth();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t("passwordTooShort") || "Password too short", description: t("passwordMinLength") || "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, displayName);
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        title: t("signupFailed") || "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          <h2 className="font-display text-xl font-bold text-foreground">{t("checkEmail") || "Check your email"}</h2>
          <p className="text-muted-foreground text-sm">
            {t("verificationSent") || "We've sent a verification link to"} <span className="text-foreground font-medium">{email}</span>.
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
          <p className="text-muted-foreground mt-2 text-sm">{t("createAccount") || "Create your account to get started."}</p>
        </div>

        <div className="glass-strong p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground text-sm">{t("fullName") || "Full name"}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("fullNamePlaceholder") || "John Doe"}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 h-11"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm">{t("password")}</Label>
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-11 text-sm font-medium glow-blue group"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t("createAccountBtn") || "Create account"}
                  <ArrowRight className={`ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 ${isRtl ? "rotate-180" : ""}`} />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {t("haveAccount") || "Already have an account?"}{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              {t("signIn") || "Sign in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;