import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface InviteStepProps {
  onNext: () => void;
  onBack: () => void;
  projectId: string | null;
}

interface TeamMember {
  email: string;
  password: string;
}

const InviteStep = ({ onNext, onBack, projectId }: InviteStepProps) => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const addMember = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error(t("invalidEmail"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordMinLength"));
      return;
    }
    if (members.some(m => m.email === trimmedEmail)) {
      toast.error(t("emailAlreadyAdded"));
      return;
    }
    
    setAddingMember(true);
    
    // Create the user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password,
      options: {
        data: { display_name: trimmedEmail.split("@")[0] }
      }
    });
    
    if (signUpError) {
      toast.error(signUpError.message);
      setAddingMember(false);
      return;
    }
    
    if (signUpData.user && projectId) {
      // Add user to project members
      const { error: memberError } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: signUpData.user.id,
        role: "member"
      });
      
      if (memberError) {
        console.error("Failed to add to project:", memberError);
      }
    }
    
    setMembers([...members, { email: trimmedEmail, password }]);
    setEmail("");
    setPassword("");
    toast.success(t("memberAdded"));
    setAddingMember(false);
  };

  const removeMember = (e: string) => setMembers(members.filter((m) => m.email !== e));

  const handleSubmit = () => {
    if (members.length > 0) {
      toast.success(`${members.length} ${t("membersCreated")}`);
    }
    onNext();
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">{t("inviteTeam")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("inviteTeamDesc")}</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inviteEmail">{t("emailAddress")}</Label>
          <Input 
            id="inviteEmail" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com" 
            className="bg-background/50 border-border/50"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitePassword">{t("password")}</Label>
          <div className={`flex gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className="relative flex-1">
              <Input 
                id="invitePassword" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMember())}
                placeholder={t("minSixChars")} 
                className={`bg-background/50 border-border/50 ${isRtl ? "pe-10" : "pr-10"}`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${isRtl ? "start-3" : "right-3"}`}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={addMember} 
              disabled={!email.trim() || !password.trim() || addingMember}
              className={isRtl ? "flex-row-reverse" : ""}
            >
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : t("add")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        </div>
        {members.length > 0 && (
          <div className="space-y-2">
            <Label>{t("addedMembers")}</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <span key={m.email} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20 ${isRtl ? "flex-row-reverse" : ""}`}>
                  {m.email}
                  <button onClick={() => removeMember(m.email)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">{t("back")}</Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
          {members.length === 0 ? t("skip") : `${t("continue")} (${members.length})`}
        </Button>
      </div>
    </div>
  );
};

export default InviteStep;
