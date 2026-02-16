import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { LeaveImpact } from "@/hooks/useLeaveImpact";

interface Props {
  impact: LeaveImpact;
}

export function LeaveCapacityWarning({ impact }: Props) {
  if (impact.risk === "low") {
    return (
      <Alert className="border-nexus-success/40 bg-nexus-success/10">
        <CheckCircle2 className="h-4 w-4 text-nexus-success" />
        <AlertTitle className="text-nexus-success">Low Operational Risk</AlertTitle>
        <AlertDescription className="text-muted-foreground text-sm">
          Only {impact.percentage}% of your department is away. Safe to proceed.
        </AlertDescription>
      </Alert>
    );
  }

  if (impact.risk === "medium") {
    return (
      <Alert className="border-nexus-warning/40 bg-nexus-warning/10">
        <AlertTriangle className="h-4 w-4 text-nexus-warning" />
        <AlertTitle className="text-nexus-warning">Moderate Operational Risk</AlertTitle>
        <AlertDescription className="text-muted-foreground text-sm">
          {impact.percentage}% of your department ({impact.absent_count}/{impact.total}) is already on leave during these dates. Consider alternative dates.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-nexus-error/40 bg-nexus-error/10">
      <ShieldAlert className="h-4 w-4 text-nexus-error" />
      <AlertTitle className="text-nexus-error">High Operational Risk</AlertTitle>
      <AlertDescription className="text-muted-foreground text-sm">
        {impact.percentage}% of your department ({impact.absent_count}/{impact.total}) is already on approved leave. This could significantly impact operations.
      </AlertDescription>
    </Alert>
  );
}
