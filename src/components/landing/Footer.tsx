import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t, dir } = useLanguage();

  return (
    <footer className="border-t border-border/20 py-12 px-6" dir={dir}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-xs">A</span>
          </div>
          <span className="font-display font-semibold text-foreground">AIVA Flow</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">{t("footerFeatures")}</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">{t("footerHow")}</a>
          <Link to="/login" className="hover:text-foreground transition-colors">{t("footerLogin")}</Link>
        </div>

        <p className="text-xs text-muted-foreground opacity-60">
          {t("footerRights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
