import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKey } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("language").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.language && (data.language === "en" || data.language === "ar")) {
        setLangState(data.language);
      }
    });
  }, [user]);

  const setLang = async (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    if (user) {
      await supabase.from("profiles").update({ language: newLang }).eq("user_id", user.id);
    }
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey): string => translations[lang][key] || translations.en[key] || key;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
