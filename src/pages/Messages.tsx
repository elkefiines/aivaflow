import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageSquare, SmilePlus } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "👀", "🔥", "✅", "💯"];

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
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileColorMap = useRef<Record<string, number>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
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
    setError(false);
    try {
      const [msgsRes, reactionsRes] = await Promise.all([
        supabase.from("messages").select("*").eq("project_id", projectId).order("created_at", { ascending: true }).limit(200),
        supabase.from("message_reactions" as any).select("*"),
      ]);
      if (msgsRes.error) throw msgsRes.error;
      const msgs = (msgsRes.data || []) as Message[];
      setMessages(msgs);
      setReactions((reactionsRes.data as any) || []);

      const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
      if (senderIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", senderIds);
        const map: Record<string, string> = {};
        profs?.forEach((p) => { map[p.user_id] = p.display_name || p.user_id.slice(0, 8); });
        setProfiles(map);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { loadMessages(); }, [projectId]);

  // Realtime messages + reactions
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`chat-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (!profiles[newMsg.sender_id]) {
            const { data } = await supabase.from("profiles").select("user_id, display_name").eq("user_id", newMsg.sender_id).single();
            if (data) setProfiles((prev) => ({ ...prev, [data.user_id]: data.display_name || data.user_id.slice(0, 8) }));
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" },
        () => { loadReactions(); })
      .subscribe();

    // Typing indicator channel
    const presenceChannel = supabase.channel(`typing-${projectId}`);
    presenceChannel.on("broadcast", { event: "typing" }, (payload: any) => {
      const senderId = payload.payload?.user_id;
      if (senderId && senderId !== user?.id) {
        setTypingUsers(prev => new Set(prev).add(senderId));
        setTimeout(() => {
          setTypingUsers(prev => { const n = new Set(prev); n.delete(senderId); return n; });
        }, 3000);
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(presenceChannel); };
  }, [projectId]);

  const loadReactions = async () => {
    const { data } = await supabase.from("message_reactions" as any).select("*");
    setReactions((data as any) || []);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const broadcastTyping = useCallback(() => {
    if (!projectId || !user) return;
    supabase.channel(`typing-${projectId}`).send({ type: "broadcast", event: "typing", payload: { user_id: user.id } });
  }, [projectId, user]);

  const handleInput = (val: string) => {
    setContent(val);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    broadcastTyping();
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const sendMessage = async () => {
    if (!user || !projectId || !content.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ project_id: projectId, sender_id: user.id, content: content.trim() } as any);
    setSending(false);
    if (error) { toast.error(t("failedToSendMessage")); return; }
    setContent("");
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions.find(r => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await (supabase.from("message_reactions" as any) as any).delete().eq("id", existing.id);
    } else {
      await (supabase.from("message_reactions" as any) as any).insert({ message_id: messageId, user_id: user.id, emoji });
    }
    loadReactions();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (dateStr: string) => format(new Date(dateStr), "hh:mm a", { locale: lang === "ar" ? ar : undefined });
  const getInitials = (name: string) => name.split(/\s/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  const getMessageReactions = (msgId: string) => {
    const msgReactions = reactions.filter(r => r.message_id === msgId);
    const grouped: Record<string, string[]> = {};
    msgReactions.forEach(r => { if (!grouped[r.emoji]) grouped[r.emoji] = []; grouped[r.emoji].push(r.user_id); });
    return grouped;
  };

  const typingNames = Array.from(typingUsers).map(id => profiles[id] || "...").filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]" dir={dir}>
      <div className="mb-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("messages")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("messagesSubtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-3 sm:p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-10 w-3/4 rounded-lg" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadMessages} />}

        {!loading && !error && messages.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title={t("noMessages")}
            description={t("startConversation")}
          />
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          const senderName = profiles[msg.sender_id] || "...";
          const initials = getInitials(senderName);
          const msgReactions = getMessageReactions(msg.id);

          return (
            <div key={msg.id} className={`flex items-end gap-2.5 group ${isMe ? (isRtl ? "flex-row" : "flex-row-reverse") : ""}`}>
              {!isMe && (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className={`text-[10px] font-semibold ${getColor(msg.sender_id)}`}>{initials}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {!isMe && <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{senderName}</span>}
                <div className="relative">
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/50 text-foreground rounded-bl-sm"}`}>
                    {msg.content}
                  </div>
                  {/* Reaction button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="absolute -bottom-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-full p-0.5 shadow-sm">
                        <SmilePlus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1.5 flex gap-1" side="top">
                      {QUICK_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)} className="text-base hover:scale-125 transition-transform p-0.5">
                          {emoji}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Reactions display */}
                {Object.keys(msgReactions).length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {Object.entries(msgReactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className={`text-xs px-1.5 py-0.5 rounded-full border transition-colors ${users.includes(user?.id || "") ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/30"}`}
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="text-xs text-muted-foreground px-2 pt-1 animate-pulse">
          {typingNames.join(", ")} {isRtl ? "يكتب..." : "typing..."}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Input value={content} onChange={(e) => handleInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t("typeMessage")} className="bg-card/50 border-border/40 rounded-full flex-1" disabled={sending} />
        <Button size="icon" className="rounded-full h-10 w-10 shrink-0" onClick={sendMessage} disabled={sending || !content.trim()}>
          <Send className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
        </Button>
      </div>
    </div>
  );
};

export default Messages;
