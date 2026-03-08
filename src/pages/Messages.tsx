import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-purple-500/20 text-purple-400",
  "bg-rose-500/20 text-rose-400",
];

const Messages = () => {
  const { user } = useAuth();
  const { projectId } = useActiveProject();
  const { t, dir, lang } = useLanguage();
  const isRtl = dir === "rtl";
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileColorMap = useRef<Record<string, number>>({});
  let colorIdx = 0;

  const getColor = (userId: string) => {
    if (!(userId in profileColorMap.current)) {
      profileColorMap.current[userId] = colorIdx++;
    }
    return avatarColors[profileColorMap.current[userId] % avatarColors.length];
  };

  const loadMessages = async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(200);
    const msgs = (data || []) as Message[];
    setMessages(msgs);

    // Load profiles for senders
    const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", senderIds);
      const map: Record<string, string> = {};
      profs?.forEach((p) => {
        map[p.user_id] = p.display_name || p.user_id.slice(0, 8);
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [projectId]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          // Load profile if unknown
          if (!profiles[newMsg.sender_id]) {
            const { data } = await supabase
              .from("profiles")
              .select("user_id, display_name")
              .eq("user_id", newMsg.sender_id)
              .single();
            if (data) {
              setProfiles((prev) => ({
                ...prev,
                [data.user_id]: data.display_name || data.user_id.slice(0, 8),
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !projectId || !content.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      project_id: projectId,
      sender_id: user.id,
      content: content.trim(),
    } as any);
    setSending(false);
    if (error) {
      toast.error(t("failedToSendMessage"));
      return;
    }
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "hh:mm a", {
      locale: lang === "ar" ? ar : undefined,
    });
  };

  const getInitials = (name: string) =>
    name
      .split(/\s/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]" dir={dir}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          {t("messages")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("messagesSubtitle")}
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-3 sm:p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-3/4 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">{t("noMessages")}</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              {t("startConversation")}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const senderName = profiles[msg.sender_id] || "...";
          const initials = getInitials(senderName);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${
                isMe ? (isRtl ? "flex-row" : "flex-row-reverse") : ""
              }`}
            >
              {!isMe && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={`text-[10px] font-semibold ${getColor(
                      msg.sender_id
                    )}`}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] sm:max-w-[60%] ${
                  isMe ? "items-end" : "items-start"
                } flex flex-col`}
              >
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                    {senderName}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/50 text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("typeMessage")}
          className="bg-card/50 border-border/40 rounded-full flex-1"
          disabled={sending}
        />
        <Button
          size="icon"
          className="rounded-full h-10 w-10 shrink-0"
          onClick={sendMessage}
          disabled={sending || !content.trim()}
        >
          <Send className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
        </Button>
      </div>
    </div>
  );
};

export default Messages;
