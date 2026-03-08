import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, CalendarCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  company: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const BookDemo = () => {
  const { lang, dir } = useLanguage();
  const isRtl = lang === "ar";
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_submissions" as any).insert({
      name: result.data.name,
      email: result.data.email,
      company: result.data.company || null,
      message: result.data.message,
      type: "demo",
    } as any);

    setLoading(false);
    if (error) {
      toast.error(isRtl ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
      return;
    }
    setSubmitted(true);
    toast.success(isRtl ? "تم إرسال طلبك بنجاح!" : "Your request has been submitted!");
  };

  if (submitted) {
    return (
      <section id="contact" className="py-24 px-6" dir={dir}>
        <div className="max-w-lg mx-auto text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">
            {isRtl ? "شكراً لك!" : "Thank you!"}
          </h3>
          <p className="text-muted-foreground">
            {isRtl ? "سنتواصل معك في أقرب وقت ممكن." : "We'll get back to you as soon as possible."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 px-6 relative" dir={dir}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Info */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{isRtl ? "احجز عرضاً تجريبياً" : "Book a Demo"}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {isRtl ? (
                <>اكتشف كيف يمكن لـ <span className="text-primary">AIVA Flow</span> تحسين إنتاجية فريقك</>
              ) : (
                <>See how <span className="text-primary">AIVA Flow</span> can boost your team's productivity</>
              )}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isRtl
                ? "احصل على عرض مخصص لاحتياجات فريقك. سيتواصل معك أحد خبرائنا لتوضيح كيف يمكن لـ AIVA Flow مساعدتك."
                : "Get a personalized walkthrough tailored to your team's needs. One of our experts will show you how AIVA Flow can help."}
            </p>
            <div className="space-y-4 pt-2">
              {[
                isRtl ? "عرض مخصص لفريقك" : "Personalized demo for your team",
                isRtl ? "إجابة على جميع أسئلتك" : "All your questions answered",
                isRtl ? "بدون التزام" : "No commitment required",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Form */}
          <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">
              {isRtl ? "تواصل معنا" : "Get in Touch"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder={isRtl ? "الاسم الكامل *" : "Full Name *"}
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="bg-background/50 border-border/40"
                  maxLength={100}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder={isRtl ? "البريد الإلكتروني *" : "Email Address *"}
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-background/50 border-border/40"
                  maxLength={255}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Input
                  placeholder={isRtl ? "اسم الشركة (اختياري)" : "Company (optional)"}
                  value={form.company}
                  onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))}
                  className="bg-background/50 border-border/40"
                  maxLength={100}
                />
              </div>
              <div>
                <Textarea
                  placeholder={isRtl ? "رسالتك *" : "Your Message *"}
                  value={form.message}
                  onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                  className="bg-background/50 border-border/40 min-h-[100px] resize-none"
                  maxLength={2000}
                />
                {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full rounded-xl glow-blue-sm" disabled={loading}>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {isRtl ? "إرسال الطلب" : "Send Request"}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookDemo;
