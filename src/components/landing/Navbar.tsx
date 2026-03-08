import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, LayoutDashboard, Globe, FolderKanban } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang, dir } = useLanguage();

  const navLinks = [
    { label: t("footerFeatures"), href: "#features" },
    { label: t("footerHow"), href: "#how-it-works" },
  ];

  const initials = user
    ? (user.user_metadata?.display_name || user.email || "U")
        .split(/[\s@]/)
        .slice(0, 2)
        .map((s: string) => s[0]?.toUpperCase())
        .join("")
    : "";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/20" dir={dir}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">AIVA <span className="text-primary">Flow</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground" onClick={toggleLang} title={lang === "en" ? "العربية" : "English"}>
            <Globe className="h-4 w-4" />
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground border border-border/40 rounded-full px-5" asChild>
                <Link to="/dashboard">{t("dashboard")}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 me-2" />{t("dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <User className="h-4 w-4 me-2" />{t("profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 me-2" />{t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground border border-border/40 rounded-full px-5" asChild>
                <Link to="/login">{t("signIn")}</Link>
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 glow-blue-sm" asChild>
                <Link to="/signup">{t("getStarted")}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground" onClick={toggleLang}>
            <Globe className="h-4 w-4" />
          </Button>
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden relative bg-card/95 backdrop-blur-xl border-b border-border/20 px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="border border-border/40 rounded-full" asChild>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>{t("dashboard")}</Link>
                </Button>
                <Button size="sm" variant="destructive" className="rounded-full" onClick={handleSignOut}>
                  {t("signOut")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="border border-border/40 rounded-full" asChild>
                  <Link to="/login">{t("signIn")}</Link>
                </Button>
                <Button size="sm" className="bg-primary rounded-full" asChild>
                  <Link to="/signup">{t("getStarted")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
