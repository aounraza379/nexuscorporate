import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Progress } from "@/components/ui/progress";
import { useEmployeeBenefits } from "@/hooks/useEmployeeBenefits";
import { ShieldCheck, Heart, Users, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  standard: "bg-primary/20 text-primary",
  premium: "bg-accent/20 text-accent-foreground",
};

export function MyBenefitsCard() {
  const { benefits, isLoading, spentPercentage, remaining } = useEmployeeBenefits();

  if (isLoading) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading benefits...</span>
        </div>
      </GlassCard>
    );
  }

  if (!benefits) {
    return (
      <GlassCard>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">My Benefits</h3>
            <p className="text-xs text-muted-foreground">
              No benefits plan assigned yet. Contact HR for enrollment.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  const progressColor =
    spentPercentage >= 90
      ? "bg-destructive"
      : spentPercentage >= 70
      ? "bg-[hsl(var(--nexus-warning))]"
      : "bg-primary";

  const dependents = Array.isArray(benefits.dependents) ? benefits.dependents : [];
  const coverage = benefits.coverage_details || {};

  return (
    <GlassCard hover>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">My Benefits</h3>
              <p className="text-xs text-muted-foreground">Insurance & Coverage</p>
            </div>
          </div>
          <Badge className={`capitalize ${tierColors[benefits.insurance_tier] || tierColors.basic}`}>
            {benefits.insurance_tier}
          </Badge>
        </div>

        {/* Insurance Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Insurance Used</span>
            <span className="font-mono-data font-medium">
              {spentPercentage}%
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${progressColor}`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              ₹{benefits.amount_spent.toLocaleString()} spent
            </span>
            <span>
              ₹{remaining.toLocaleString()} remaining
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-secondary/50 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Total Limit</p>
              <p className="text-xs font-semibold font-mono-data">
                ₹{benefits.total_limit.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Dependents</p>
              <p className="text-xs font-semibold">{dependents.length}</p>
            </div>
          </div>
        </div>

        {/* Coverage highlights */}
        {Object.keys(coverage).length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coverage</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(coverage).slice(0, 4).map(([key, value]) => (
                <span
                  key={key}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/70 text-muted-foreground capitalize"
                >
                  {key.replace(/_/g, " ")}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <AlertCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Ask <span className="text-primary font-medium">Nexus Agent</span> about your coverage — e.g. "Is my spouse covered?" or "What's my dental limit?"
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
