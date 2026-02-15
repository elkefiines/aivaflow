import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User } from "lucide-react";

interface ProfileStepProps {
  onNext: () => void;
}

const ProfileStep = ({ onNext }: ProfileStepProps) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), bio: bio.trim() || null })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast.error("Failed to update profile");
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">Set up your profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Tell us a bit about yourself</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required className="bg-background/50 border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What do you do?" rows={3} className="bg-background/50 border-border/50 resize-none" />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading || !displayName.trim()}>
        {loading ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
};

export default ProfileStep;
