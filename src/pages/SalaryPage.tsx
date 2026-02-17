// ============================================================
// Salary & Payslips Page
// Shows personal salary breakdown and history from profiles.salary_info
// Only accessible to the logged-in employee for their own data
// ============================================================

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToCsv } from "@/lib/exportCsv";
import {
  Wallet,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CreditCard,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Salary info shape stored in profiles.salary_info JSONB
interface SalaryInfo {
  basic: number;
  hra: number;
  special_allowance: number;
  pf_deduction: number;
  tax: number;
  insurance: number;
  gross: number;
  net: number;
  currency: string;
}

export default function SalaryPage() {
  const { user, profile } = useAuth();

  // Fetch salary from profiles table
  const { data: salaryInfo, isLoading } = useQuery({
    queryKey: ["my-salary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("salary_info")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      const s = data?.salary_info as Record<string, any> | null;
      if (!s || !s.basic) return null;
      return {
        basic: Number(s.basic),
        hra: Number(s.hra || 0),
        special_allowance: Number(s.special_allowance || 0),
        pf_deduction: Number(s.pf_deduction || 0),
        tax: Number(s.tax || 0),
        insurance: Number(s.insurance || 0),
        gross: Number(s.gross || 0),
        net: Number(s.net || 0),
        currency: String(s.currency || "INR"),
      } as SalaryInfo;
    },
    enabled: !!user?.id,
  });

  // Fetch claims history for spend breakdown
  const { data: claims } = useQuery({
    queryKey: ["my-claims-salary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("claim_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Format currency
  const fmt = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  // Current month name
  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate next payday (last day of current month)
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const nextPayday = lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!salaryInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Wallet className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No salary data available</p>
        <p className="text-sm">Contact HR for your compensation details.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          Salary & Payslips
        </h1>
        <p className="text-muted-foreground">
          View your salary details and download payslips
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Salary</p>
                <p className="text-2xl font-bold">{fmt(salaryInfo.net)}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Salary</p>
                <p className="text-2xl font-bold">{fmt(salaryInfo.gross)}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <CreditCard className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold">
                  {fmt(salaryInfo.pf_deduction + salaryInfo.tax + salaryInfo.insurance)}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payday</p>
                <p className="text-2xl font-bold">{nextPayday}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payslip breakdown */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Current Payslip — {currentMonth}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  exportToCsv(`payslip-${currentMonth.replace(" ", "-").toLowerCase()}`, [{
                    "Basic Salary": salaryInfo.basic,
                    HRA: salaryInfo.hra,
                    "Special Allowance": salaryInfo.special_allowance,
                    "Gross Salary": salaryInfo.gross,
                    "PF Deduction": salaryInfo.pf_deduction,
                    Tax: salaryInfo.tax,
                    Insurance: salaryInfo.insurance,
                    "Net Salary": salaryInfo.net,
                  }]);
                }}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            <div className="space-y-3">
              {/* Earnings */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Basic Salary</span>
                <span className="font-medium">{fmt(salaryInfo.basic)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">HRA</span>
                <span className="font-medium text-green-500">+{fmt(salaryInfo.hra)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Special Allowance</span>
                <span className="font-medium text-green-500">+{fmt(salaryInfo.special_allowance)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50 font-semibold">
                <span>Gross Salary</span>
                <span>{fmt(salaryInfo.gross)}</span>
              </div>

              {/* Deductions */}
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">PF Deduction</span>
                <span className="font-medium text-destructive">-{fmt(salaryInfo.pf_deduction)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-destructive">-{fmt(salaryInfo.tax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Insurance</span>
                <span className="font-medium text-destructive">-{fmt(salaryInfo.insurance)}</span>
              </div>

              {/* Net */}
              <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3 font-bold text-lg">
                <span>Net Salary</span>
                <span className="text-primary">{fmt(salaryInfo.net)}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Claims history as spending record */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              Insurance Claims
            </h3>

            {claims && claims.length > 0 ? (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium capitalize">{claim.category.replace("_", " ")}</p>
                      <p className="text-sm text-muted-foreground">
                        {claim.provider} • {claim.claim_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{fmt(Number(claim.amount))}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          claim.status === "approved"
                            ? "bg-green-500/10 text-green-500"
                            : claim.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No claims recorded yet.</p>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
