import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Save, Upload, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Profile = Tables<"profiles">;
type Project = Tables<"projects">;

const Settings = () => {
  const { user } = useAuth();
  const { lang, setLang, t, dir } = useLanguage();
  const { projectId } = useActiveProject();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectColor, setProjectColor] = useState("#0A26E6");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    });
  }, [user]);

  useEffect(() => {
    if (!projectId) return;
    supabase.from("projects").select("*").eq("id", projectId).single().then(({ data }) => {
      if (data) {
        setProject(data);
        setProjectName(data.name);
        setProjectDesc(data.description || "");
        setProjectColor(data.color || "#0A26E6");
      }
    });
  }, [projectId]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save profile"); return; }
    toast.success("Profile updated");
  };

  const saveProject = async () => {
    if (!projectId) return;
    setSaving(true);
    const { error } = await supabase.from("projects").update({
      name: projectName.trim(),
      description: projectDesc.trim(),
      color: projectColor,
    }).eq("id", projectId);
    setSaving(false);
    if (error) { toast.error("Failed to save project"); return; }
    toast.success("Project updated");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2 MB"); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); return; }

    const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    toast.success("Avatar uploaded");
  };

  const initials = (displayName || user?.email || "U")
    .split(/[\s@]/).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("");

  return (
    <div className="space-y-6 max-w-2xl" dir={dir}>
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("settingsTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settingsSubtitle")}</p>
      </div>

      <Tabs defaultValue="profile" dir={dir}>
        <TabsList className="bg-card/60 border border-border/30">
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
          <TabsTrigger value="project">{t("project")}</TabsTrigger>
          <TabsTrigger value="language">{t("language")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display">{t("yourProfile")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Upload className="h-3.5 w-3.5" /> {t("changeAvatar")}
                  </Label>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG — max 2 MB</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("displayName")}</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>{t("bio")}</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="bg-background/50 border-border/50 resize-none" placeholder="..." />
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input value={user?.email || ""} disabled className="bg-background/30 border-border/30 text-muted-foreground" dir="ltr" />
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                {t("saveProfile")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display">{t("projectSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!projectId ? (
                <p className="text-sm text-muted-foreground">{t("selectProjectFirst")}</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>{t("projectName")}</Label>
                    <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="bg-background/50 border-border/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("description")}</Label>
                    <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} rows={3} className="bg-background/50 border-border/50 resize-none" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("color")}</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={projectColor} onChange={(e) => setProjectColor(e.target.value)} className="h-9 w-9 rounded border-0 cursor-pointer" />
                      <Input value={projectColor} onChange={(e) => setProjectColor(e.target.value)} className="bg-background/50 border-border/50 w-28 font-mono text-sm" dir="ltr" />
                    </div>
                  </div>
                  <Button onClick={saveProject} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                    {t("saveProject")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="mt-4">
          <Card className="border-border/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Globe className="h-4 w-4" /> {t("language")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("language")}</Label>
                <Select value={lang} onValueChange={(v) => setLang(v as "en" | "ar")}>
                  <SelectTrigger className="w-48 bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;