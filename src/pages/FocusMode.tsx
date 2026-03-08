import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play, Pause, RotateCcw, Coffee, Brain, Flame, Timer, Trophy, Target, Volume2, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
const CYCLES_BEFORE_LONG_BREAK = 4;

const FocusMode = () => {
  const { t, lang, dir } = useLanguage();
  const isRtl = lang === "ar";
  const [mode, setMode] = useState<"work" | "break" | "longBreak">("work");
  const [seconds, setSeconds] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);
  const [sessionLog, setSessionLog] = useState<{ type: string; duration: number; time: Date }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevRunning = useRef(false);

  const getModeMinutes = (m: typeof mode) =>
    m === "work" ? WORK_MINUTES : m === "break" ? BREAK_MINUTES : LONG_BREAK_MINUTES;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (soundEnabled) {
            try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1iZmlubHBuc2x0b3V2eH18f4GBgoODhIOEhIODg4OCgoGAf359fHp5eHZ1dHNycXBvbm1sa2ppZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQA=").play().catch(() => {}); } catch {}
          }
          if (mode === "work") {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            setSessionLog(prev => [...prev, { type: "work", duration: WORK_MINUTES, time: new Date() }]);
            if (newCycles % CYCLES_BEFORE_LONG_BREAK === 0) {
              setMode("longBreak");
              return LONG_BREAK_MINUTES * 60;
            }
            setMode("break");
            return BREAK_MINUTES * 60;
          } else {
            setSessionLog(prev => [...prev, { type: mode, duration: getModeMinutes(mode), time: new Date() }]);
            setMode("work");
            return WORK_MINUTES * 60;
          }
        }
        return prev - 1;
      });
      if (mode === "work") setTotalFocusSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running, mode, cycles, soundEnabled]);

  const reset = () => {
    setRunning(false);
    setMode("work");
    setSeconds(WORK_MINUTES * 60);
  };

  const fullReset = () => {
    reset();
    setCycles(0);
    setTotalFocusSeconds(0);
    setSessionLog([]);
  };

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setSeconds(getModeMinutes(m) * 60);
    setRunning(false);
  };

  const totalSeconds = getModeMinutes(mode) * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const focusMins = Math.floor(totalFocusSeconds / 60);
  const circumference = 2 * Math.PI * 45;

  const modeConfig = {
    work: { color: "hsl(var(--primary))", glow: "hsl(var(--primary) / 0.3)", icon: Brain, label: isRtl ? "تركيز" : "Focus" },
    break: { color: "hsl(145, 60%, 45%)", glow: "hsla(145, 60%, 45%, 0.3)", icon: Coffee, label: isRtl ? "استراحة" : "Break" },
    longBreak: { color: "hsl(260, 60%, 55%)", glow: "hsla(260, 60%, 55%, 0.3)", icon: Coffee, label: isRtl ? "استراحة طويلة" : "Long Break" },
  };

  const current = modeConfig[mode];

  return (
    <div className="space-y-8" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            {t("focusMode")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("focusModeDesc")}</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center justify-center gap-2">
        {(["work", "break", "longBreak"] as const).map((m) => {
          const cfg = modeConfig[m];
          const Icon = cfg.icon;
          return (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              className={`rounded-full gap-1.5 ${mode === m ? "" : "text-muted-foreground"}`}
              style={mode === m ? { backgroundColor: modeConfig[m].color } : {}}
              onClick={() => switchMode(m)}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </Button>
          );
        })}
      </div>

      {/* Timer Ring */}
      <div className="flex justify-center">
        <motion.div
          className="relative w-64 h-64 sm:w-72 sm:h-72"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Glow effect */}
          {running && (
            <motion.div
              className="absolute inset-0 rounded-full blur-[40px] opacity-20"
              style={{ backgroundColor: current.color }}
              animate={{ opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" opacity={0.4} />
            {/* Progress track dots */}
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (i / 60) * 2 * Math.PI;
              const x = 50 + 45 * Math.cos(angle);
              const y = 50 + 45 * Math.sin(angle);
              const filled = (i / 60) * 100 <= progress;
              return i % 5 === 0 ? (
                <circle key={i} cx={x} cy={y} r={filled ? 1.2 : 0.8} fill={filled ? current.color : "hsl(var(--muted))"} opacity={filled ? 1 : 0.3} />
              ) : null;
            })}
            {/* Main arc */}
            <motion.circle
              cx="50" cy="50" r="45" fill="none"
              stroke={current.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span
                  className="text-5xl sm:text-6xl font-display font-bold tabular-nums tracking-tight"
                  style={{ color: running ? current.color : undefined }}
                >
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </span>
                <span className="text-xs font-medium mt-2 uppercase tracking-widest" style={{ color: current.color }}>
                  {current.label}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          size="lg"
          className="rounded-full px-8 h-12 text-base gap-2 shadow-lg"
          style={{ backgroundColor: current.color }}
          onClick={() => setRunning(!running)}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? (isRtl ? "إيقاف" : "Pause") : (isRtl ? "ابدأ" : "Start")}
        </Button>
        <Button variant="outline" size="lg" className="rounded-full h-12" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Cycle indicators */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: CYCLES_BEFORE_LONG_BREAK }).map((_, i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full border-2"
            style={{
              borderColor: current.color,
              backgroundColor: i < (cycles % CYCLES_BEFORE_LONG_BREAK) ? current.color : "transparent",
            }}
            animate={i === (cycles % CYCLES_BEFORE_LONG_BREAK) && running && mode === "work" ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        ))}
        <span className="text-xs text-muted-foreground ms-2">
          {cycles}/{CYCLES_BEFORE_LONG_BREAK}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: isRtl ? "الجلسات" : "Sessions", value: cycles, color: "text-orange-500" },
          { icon: Timer, label: isRtl ? "وقت التركيز" : "Focus Time", value: `${focusMins}m`, color: "text-primary" },
          { icon: Trophy, label: isRtl ? "أفضل سلسلة" : "Best Streak", value: cycles, color: "text-amber-500" },
          { icon: Target, label: isRtl ? "الهدف اليومي" : "Daily Goal", value: `${Math.min(Math.round((cycles / 8) * 100), 100)}%`, color: "text-emerald-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-card ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Session Log */}
      {sessionLog.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{isRtl ? "سجل الجلسات" : "Session Log"}</h3>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={fullReset}>
                  {isRtl ? "مسح الكل" : "Clear All"}
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...sessionLog].reverse().map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/20">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.type === "work" ? "hsl(var(--primary))" : "hsl(145, 60%, 45%)" }}
                    />
                    <span className="text-foreground font-medium">
                      {s.type === "work" ? (isRtl ? "تركيز" : "Focus") : (isRtl ? "استراحة" : "Break")}
                    </span>
                    <span className="text-muted-foreground">{s.duration}m</span>
                    <span className="text-xs text-muted-foreground ms-auto">
                      {s.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default FocusMode;
