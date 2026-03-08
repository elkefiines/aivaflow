import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import ProfileStep from "@/components/onboarding/ProfileStep";
import ProjectStep from "@/components/onboarding/ProjectStep";
import InviteStep from "@/components/onboarding/InviteStep";
import AIIntroStep from "@/components/onboarding/AIIntroStep";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const STEPS = [
    t("profile") || "Profile",
    t("project") || "Project",
    t("inviteTeam") || "Invite",
    t("aiIntro") || "AI Intro",
  ];

  const [hasProject, setHasProject] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      // Check if onboarding already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.onboarding_completed) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Check if user already belongs to a project (invited member)
      const { data: memberships } = await supabase
        .from("project_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1);

      const alreadyHasProject = (memberships && memberships.length > 0) || (ownedProjects && ownedProjects.length > 0);
      setHasProject(alreadyHasProject);
    };
    checkOnboarding();
  }, [user, navigate]);

  // If user already has a project, only show Profile + AI Intro
  const FILTERED_STEPS = hasProject
    ? [STEPS[0], STEPS[3]]
    : STEPS;

  const next = () => setStep((s) => Math.min(s + 1, FILTERED_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
    navigate("/dashboard", { replace: true });
  };

  if (hasProject === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderStep = () => {
    if (hasProject) {
      // Simplified flow: Profile → AI Intro
      if (step === 0) return <ProfileStep onNext={next} />;
      if (step === 1) return <AIIntroStep onFinish={finish} onBack={back} />;
    } else {
      // Full flow: Profile → Project → Invite → AI Intro
      if (step === 0) return <ProfileStep onNext={next} />;
      if (step === 1) return <ProjectStep onNext={next} onBack={back} onProjectCreated={setProjectId} />;
      if (step === 2) return <InviteStep onNext={next} onBack={back} projectId={projectId} />;
      if (step === 3) return <AIIntroStep onFinish={finish} onBack={back} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center p-4" dir={dir}>
      <div className="w-full max-w-lg">
        <OnboardingProgress steps={FILTERED_STEPS} current={step} />
        <div className="glass-strong p-8 mt-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;