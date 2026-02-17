// =============================================
// BenefitsPage — Employee insurance overview
// Shows plan details, coverage breakdown, dependents list,
// and full claims history in a responsive layout
// =============================================

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { useEmployeeBenefits } from "@/hooks/useEmployeeBenefits";
import { useClaimsHistory } from "@/hooks/useClaimsHistory";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Heart,
  Users,
  Loader2,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

// ── Tier badge color map ──
const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  standard: "bg-primary/20 text-primary",
  premium: "bg-accent/20 text-accent-foreground",
};

// ── Claim status badge styles ──
const statusStyles: Record<string, string> = {
  approved: "bg-[hsl(var(--nexus-success))]/20 text-[hsl(var(--nexus-success))]",
  pending: "bg-[hsl(var(--nexus-warning))]/20 text-[hsl(var(--nexus-warning))]",
  rejected: "bg-destructive/20 text-destructive",
};

export default function BenefitsPage() {
  const { benefits, isLoading: loadingBenefits, spentPercentage, remaining } =
    useEmployeeBenefits();
  const { data: claims = [], isLoading: loadingClaims } = useClaimsHistory();

  // ── Loading state ──
  if (loadingBenefits) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading benefits…</span>
      </div>
    );
  }

  // ── No plan assigned ──
  if (!benefits) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">No Benefits Plan</h2>
        <p className="text-muted-foreground">
          You don't have an insurance plan assigned yet. Please contact HR for
          enrollment.
        </p>
      </div>
    );
  }

  const dependents = Array.isArray(benefits.dependents) ? benefits.dependents : [];
  const coverage = benefits.coverage_details || {};

  // ── Progress bar color based on usage ──
  const progressColor =
    spentPercentage >= 90
      ? "bg-destructive"
      : spentPercentage >= 70
      ? "bg-[hsl(var(--nexus-warning))]"
      : "bg-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-headline">Benefits & Insurance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View your plan details, coverage, dependents, and claims history.
        </p>
      </div>

      {/* ── Top Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plan tier */}
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Insurance Tier</p>
              <Badge className={`capitalize mt-1 ${tierColors[benefits.insurance_tier] || tierColors.basic}`}>
                {benefits.insurance_tier}
              </Badge>
            </div>
          </div>
        </GlassCard>

        {/* Total limit */}
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Limit</p>
              <p className="text-lg font-semibold font-mono-data">
                ₹{benefits.total_limit.toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Remaining */}
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold font-mono-data">
                ₹{remaining.toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Dependents count */}
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dependents</p>
              <p className="text-lg font-semibold">{dependents.length}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Usage Progress ── */}
      <GlassCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Insurance Utilisation</h3>
            <span className="font-mono-data text-sm font-medium">{spentPercentage}%</span>
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
            <span>₹{benefits.amount_spent.toLocaleString()} spent</span>
            <span>₹{remaining.toLocaleString()} remaining</span>
          </div>
          {/* Plan period */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Plan period: {format(new Date(benefits.plan_start_date), "dd MMM yyyy")}
              {benefits.plan_end_date
                ? ` — ${format(new Date(benefits.plan_end_date), "dd MMM yyyy")}`
                : " — Ongoing"}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* ── Tabs: Coverage / Dependents / Claims ── */}
      <Tabs defaultValue="coverage" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="coverage" className="gap-1.5">
            <FileText className="w-3.5 h-3.5 hidden sm:inline" />
            Coverage
          </TabsTrigger>
          <TabsTrigger value="dependents" className="gap-1.5">
            <Users className="w-3.5 h-3.5 hidden sm:inline" />
            Dependents
          </TabsTrigger>
          <TabsTrigger value="claims" className="gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 hidden sm:inline" />
            Claims
          </TabsTrigger>
        </TabsList>

        {/* ── Coverage Tab ── */}
        <TabsContent value="coverage">
          <GlassCard>
            {Object.keys(coverage).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No coverage details available. Contact HR for more information.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(coverage).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 rounded-lg bg-secondary/50 border border-border/50 space-y-1"
                  >
                    <p className="text-xs text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* ── Dependents Tab ── */}
        <TabsContent value="dependents">
          <GlassCard>
            {dependents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No dependents registered. Contact HR to add dependents to your plan.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dependents.map((dep: Record<string, any>, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-2"
                  >
                    {Object.entries(dep).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* ── Claims History Tab ── */}
        <TabsContent value="claims">
          <GlassCard>
            {loadingClaims ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading claims…</span>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">No claims found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                     <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-mono-data text-xs whitespace-nowrap">
                          {format(new Date(claim.claim_date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {claim.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono-data text-xs">
                          ₹{claim.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`capitalize text-xs ${
                              statusStyles[claim.status] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {claim.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>

          {/* Layered Disclosure — direct to AI for sensitive deep-dive */}
          <div className="flex items-start gap-3 p-4 mt-4 rounded-lg bg-primary/5 border border-primary/10">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Need details on a specific claim?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For privacy, detailed descriptions and provider info are available through
                the <span className="text-primary font-medium">Nexus Agent</span>. Try asking:
                <span className="italic"> "Why was my claim on Jan 15 denied?"</span> or
                <span className="italic"> "Show my dental claims this year."</span>
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
