import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulse: Record<number, boolean> = {};
        relatedItems.forEach((relId) => { newPulse[relId] = true; });
        setPulseEffect(newPulse);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (autoRotate) {
      timer = setInterval(() => {
        setRotationAngle((prev) => Number(((prev + 0.3) % 360).toFixed(3)));
      }, 50);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed": return "text-foreground bg-card border-foreground";
      case "in-progress": return "text-background bg-foreground border-background";
      case "pending": return "text-foreground bg-card/40 border-muted-foreground/50";
      default: return "text-foreground bg-card/40 border-muted-foreground/50";
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex items-center justify-center py-10"
      style={{ minHeight: "520px" }}
      onClick={handleContainerClick}
    >
      <div className="relative" style={{ width: "500px", height: "500px" }}>
        {/* Orbit rings */}
        <div
          ref={orbitRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="absolute w-[400px] h-[400px] rounded-full border border-border/20" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-border/10 opacity-50" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-border/5 opacity-30" />
        </div>

        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full glow-blue-sm" />

        {/* Nodes */}
        {timelineData.map((item, index) => {
          const position = calculateNodePosition(index, timelineData.length);
          const isExpanded = expandedItems[item.id];
          const isRelated = isRelatedToActive(item.id);
          const isPulsing = pulseEffect[item.id];
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              ref={(el) => (nodeRefs.current[item.id] = el)}
              className="absolute transition-all duration-700 cursor-pointer"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                zIndex: isExpanded ? 200 : position.zIndex,
                opacity: isExpanded ? 1 : position.opacity,
              }}
              onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
            >
              {/* Pulse ring */}
              {(isPulsing || isRelated) && (
                <div className="absolute inset-0 -m-2 rounded-full border-2 border-primary animate-ping opacity-30" />
              )}

              {/* Node circle */}
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-lg transition-all duration-300 ${
                isExpanded ? "scale-125 border-primary bg-primary/20" : isRelated ? "border-primary bg-card/80" : "border-border/40 bg-card/60"
              }`}>
                <Icon className="w-5 h-5 text-primary" />
              </div>

              {/* Label */}
              <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-muted-foreground">
                {item.title}
              </div>

              {/* Expanded card */}
              {isExpanded && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-72 z-50">
                  <Card className="glass-strong border-border/30 backdrop-blur-xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusStyles(item.status)}>
                          {item.status === "completed" ? "COMPLETE" : item.status === "in-progress" ? "IN PROGRESS" : "PENDING"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <CardTitle className="text-sm text-foreground">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3">{item.content}</p>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="w-3 h-3" /> Energy Level
                        </span>
                        <span className="text-foreground">{item.energy}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${item.energy}%` }} />
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Link className="w-3 h-3" /> Connected Nodes
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find((i) => i.id === relatedId);
                              return (
                                <Button
                                  key={relatedId}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs border border-border/30"
                                  onClick={(e) => { e.stopPropagation(); toggleItem(relatedId); }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
