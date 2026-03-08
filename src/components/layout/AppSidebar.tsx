import {
  LayoutDashboard, ListTodo, Lightbulb, FileBarChart, Settings, FolderKanban, Users, MessageSquare, Calendar, BarChart3, Crosshair, Activity, GanttChart, Target, Zap, Heart, TrendingUp, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Ideas", url: "/ideas", icon: Lightbulb },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Team", url: "/team", icon: Users },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Focus", url: "/focus", icon: Crosshair },
  { title: "Gantt", url: "/gantt", icon: GanttChart },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Automations", url: "/automations", icon: Zap },
  { title: "TeamMood", url: "/team-mood", icon: Heart },
  { title: "MyStats", url: "/my-stats", icon: TrendingUp },
  { title: "Activity", url: "/activity", icon: Activity },
  
  { title: "Settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const { lang, t } = useLanguage();
  const collapsed = state === "collapsed";
  const isRtl = lang === "ar";

  return (
    <Sidebar 
      collapsible="icon" 
      side={isRtl ? "right" : "left"}
      className={isRtl ? "border-l border-border/40" : "border-r border-border/40"}
    >
      <Link to="/" className="p-4 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <FolderKanban className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-display text-lg font-bold text-foreground">
            AIVA <span className="text-primary">Flow</span>
          </span>
        )}
      </Link>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={t(item.title.toLowerCase() as any)}>
                    <NavLink to={item.url} end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title.toLowerCase() as any)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
