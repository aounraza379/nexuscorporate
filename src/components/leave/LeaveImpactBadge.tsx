import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useLeaveImpact } from "@/hooks/useLeaveImpact";

interface Props {
  requestId: string;
  startDate: string;
  endDate: string;
  department: string;
}

export function LeaveImpactBadge({ requestId, startDate, endDate, department }: Props) {
  const { impact, isAnalyzing, analyzeImpact } = useLeaveImpact();

  useEffect(() => {
    if (department) {
      analyzeImpact({ start_date: startDate, end_date: endDate, department, request_id: requestId });
    }
  }, [requestId, startDate, endDate, department]);

  if (isAnalyzing) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing…
      </Badge>
    );
  }

  if (!impact) return null;

  const hasTaskConflict = impact.task_conflicts?.length > 0;
  const isRed = impact.risk === "high" || hasTaskConflict;
  const isYellow = impact.risk === "medium" && !hasTaskConflict;

  const colorClass = isRed
    ? "bg-nexus-error/20 text-nexus-error border-nexus-error/30"
    : isYellow
    ? "bg-nexus-warning/20 text-nexus-warning border-nexus-warning/30"
    : "bg-nexus-success/20 text-nexus-success border-nexus-success/30";

  const Icon = isRed ? ShieldAlert : isYellow ? AlertTriangle : CheckCircle2;
  const label = isRed ? "High Impact" : isYellow ? "Moderate" : "Low Impact";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`gap-1 text-xs cursor-help ${colorClass}`}>
            <Icon className="w-3 h-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-card border-border">
          <p className="text-sm">
            {impact.ai_summary || `${impact.available} of ${impact.total} team members available (${impact.percentage}% absent)`}
          </p>
          {hasTaskConflict && (
            <p className="text-xs text-nexus-error mt-1">
              ⚠ {impact.task_conflicts.length} task deadline conflict(s)
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
