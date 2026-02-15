import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";

interface InviteStepProps {
  onNext: () => void;
  onBack: () => void;
  projectId: string | null;
}

const InviteStep = ({ onNext, onBack, projectId }: InviteStepProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !emails.includes(trimmed)) {
      setEmails([...emails, trimmed]);
      setEmail("");
    }
  };

  const removeEmail = (e: string) => setEmails(emails.filter((x) => x !== e));

  const handleSubmit = async () => {
    if (!user || !projectId || emails.length === 0) {
      onNext();
      return;
    }
    setLoading(true);
    const invites = emails.map((invited_email) => ({
      project_id: projectId,
      invited_by: user.id,
      invited_email,
      role: "member",
    }));
    const { error } = await supabase.from("invitations").insert(invites);
    setLoading(false);
    if (error) {
      toast.error("Failed to send invitations");
      return;
    }
    toast.success(`${emails.length} invitation(s) sent`);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Invite your team</h2>
        <p className="text-muted-foreground text-sm mt-1">Collaborate with others on your project</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inviteEmail">Email address</Label>
          <div className="flex gap-2">
            <Input id="inviteEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
              placeholder="teammate@company.com" className="bg-background/50 border-border/50" />
            <Button type="button" variant="secondary" onClick={addEmail} disabled={!email.trim()}>Add</Button>
          </div>
        </div>
        {emails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {emails.map((e) => (
              <span key={e} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">
                {e}
                <button onClick={() => removeEmail(e)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
          {emails.length === 0 ? "Skip" : loading ? "Sending…" : `Send ${emails.length} invite(s)`}
        </Button>
      </div>
    </div>
  );
};

export default InviteStep;
