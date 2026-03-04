import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, Trash2, Sparkles } from "lucide-react";
import { useChat, ChatMessage } from "@/hooks/useChat";
import { useActiveProject } from "@/hooks/useActiveProject";
import ReactMarkdown from "react-markdown";

const quickPrompts = [
  "Summarize my tasks",
  "What should I focus on?",
  "Break down my latest idea",
  "Show overdue items",
];

const ChatPanel = () => {
  const { projectId } = useActiveProject();
  const { messages, isLoading, send, clear } = useChat(projectId);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <MessageSquare className="h-5 w-5" />
          {messages.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[420px] p-0 flex flex-col bg-card border-border/40">
        <SheetHeader className="p-4 border-b border-border/30 flex-row items-center justify-between space-y-0">
          <SheetTitle className="font-display flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AIVA Assistant
          </SheetTitle>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={clear}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-3 pt-8">
              <p className="text-sm text-muted-foreground text-center mb-6">
                Ask AIVA anything about your project
              </p>
              <div className="grid gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="text-left text-sm p-3 rounded-lg border border-border/30 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-foreground/80"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border/30">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AIVA…"
              className="bg-background/50 border-border/50 text-sm"
              disabled={isLoading}
            />
            <Button size="icon" type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-background/80 border border-border/30 rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-xs [&_pre]:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
