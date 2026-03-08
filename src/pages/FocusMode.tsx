import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

const FocusMode = () => {
  const { t, dir } = useLanguage();
  const [isWork, setIsWork] = useState(true);
  const [seconds, setSeconds] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // Switch mode
          if (isWork) {
            setCycles((c) => c + 1);
            setIsWork(false);
            return BREAK_MINUTES * 60;
          } else {
            setIsWork(true);
            return WORK_MINUTES * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, isWork]);

  const reset = () => {
    setRunning(false);
    setIsWork(true);
    setSeconds(WORK_MINUTES * 60);
    setCycles(0);
  };

  const totalSeconds = isWork ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t("focusMode")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("focusModeDesc")}</p>
      </div>

      <div className="max-w-md mx-auto text-center space-y-8">
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={isWork ? "hsl(var(--primary))" : "hsl(145, 60%, 45%)"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-display font-bold tabular-nums">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className={`text-xs font-medium mt-1 ${isWork ? "text-primary" : "text-emerald-400"}`}>
              {isWork ? t("workSession") : t("breakSession")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => setRunning(!running)}
            className={isWork ? "" : "bg-emerald-500 hover:bg-emerald-600"}
          >
            {running ? <Pause className="h-5 w-5 me-2" /> : <Play className="h-5 w-5 me-2" />}
            {running ? t("pause") : t("start")}
          </Button>
          <Button variant="outline" size="lg" onClick={reset}>
            <RotateCcw className="h-5 w-5 me-2" />
            {t("reset")}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {t("completedCycles")}: <span className="font-bold text-foreground">{cycles}</span>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
