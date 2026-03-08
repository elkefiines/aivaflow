import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const typeIcons: Record<string, string> = {
  task_assigned: "📋",
  idea_converted: "💡",
  info: "ℹ️",
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const isRtl = dir === "rtl";

  const handleClick = (n: { id: string; link: string | null; is_read: boolean }) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={isRtl ? "start" : "end"} className="w-80 p-0" dir={dir}>
        <div className={`flex items-center justify-between px-4 py-3 border-b border-border/30 ${isRtl ? "flex-row-reverse" : ""}`}>
          <h4 className="text-sm font-semibold text-foreground">{t("notifications")}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className={`h-7 text-xs gap-1 ${isRtl ? "flex-row-reverse" : ""}`} onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5" /> {t("markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("noNotifications")}</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full px-4 py-3 border-b border-border/10 hover:bg-primary/5 transition-colors flex gap-3 items-start ${!n.is_read ? "bg-primary/5" : ""} ${isRtl ? "flex-row-reverse text-end" : "text-left"}`}
              >
                <span className="text-base mt-0.5">{typeIcons[n.type] || "ℹ️"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {n.title}
                  </p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: lang === "ar" ? ar : enUS })}
                  </p>
                </div>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
