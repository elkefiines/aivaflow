import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Sparkles } from "lucide-react";
import ProjectSwitcher from "@/components/layout/ProjectSwitcher";
import ChatPanel from "@/components/chat/ChatPanel";
import NotificationBell from "@/components/notifications/NotificationBell";

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join("");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm" dir={dir}>
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <ProjectSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <ChatPanel />
        <NotificationBell />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-medium hidden sm:block">{t("aiReady")}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="h-4 w-4 me-2" />{t("profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 me-2" />{t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;