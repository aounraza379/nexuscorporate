// ============================================================
// Payroll Management Page (HR only)
// Displays real salary data from profiles.salary_info JSONB
// Dynamically calculates totals and allows CSV export
// ============================================================

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToCsv } from "@/lib/exportCsv";
import {
  Wallet,
  Users,
  DollarSign,
  Download,
  Search,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

// Helper to parse salary_info JSONB safely
function parseSalary(info: any): {
  basic: number;
  hra: number;
  special_allowance: number;
  pf_deduction: number;
  tax: number;
  insurance: number;
  gross: number;
  net: number;
} | null {
  if (!info || typeof info !== "object" || !info.basic) return null;
  return {
    basic: Number(info.basic || 0),
    hra: Number(info.hra || 0),
    special_allowance: Number(info.special_allowance || 0),
    pf_deduction: Number(info.pf_deduction || 0),
    tax: Number(info.tax || 0),
    insurance: Number(info.insurance || 0),
    gross: Number(info.gross || 0),
    net: Number(info.net || 0),
  };
}

// Currency formatter
const fmt = (val: number) => `₹${val.toLocaleString("en-IN")}`;

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all profiles with salary info
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all-profiles-payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department, salary_info, employment_status");
      if (error) throw error;
      return data;
    },
  });

  // Filter by search
  const filteredProfiles = profiles?.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute summary from real data
  const employeesWithSalary = profiles?.filter((p) => parseSalary(p.salary_info)) || [];
  const totalPayroll = employeesWithSalary.reduce(
    (sum, p) => sum + (parseSalary(p.salary_info)?.net || 0),
    0
  );
  const avgSalary =
    employeesWithSalary.length > 0
      ? Math.round(totalPayroll / employeesWithSalary.length)
      : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Build CSV export data from real salary info
  const buildExportData = (list: typeof profiles) =>
    (list || []).map((p) => {
      const s = parseSalary(p.salary_info);
      return {
        Employee: p.full_name || "Unknown",
        Department: p.department || "Unassigned",
        "Basic Salary": s?.basic || 0,
        HRA: s?.hra || 0,
        "Special Allowance": s?.special_allowance || 0,
        "PF Deduction": s?.pf_deduction || 0,
        Tax: s?.tax || 0,
        Insurance: s?.insurance || 0,
        "Gross Salary": s?.gross || 0,
        "Net Pay": s?.net || 0,
      };
    });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Payroll Management
          </h1>
          <p className="text-muted-foreground">
            Manage employee salaries and generate payroll reports
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => exportToCsv("payroll-report", buildExportData(profiles))}
          disabled={!profiles?.length}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary cards with real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">{fmt(totalPayroll)}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{profiles?.length || 0}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Net Salary</p>
                <p className="text-2xl font-bold">{fmt(avgSalary)}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Wallet className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Salary Data</p>
                <p className="text-2xl font-bold">{employeesWithSalary.length}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Search filter */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                exportToCsv("payroll-filtered", buildExportData(filteredProfiles))
              }
              disabled={!filteredProfiles?.length}
            >
              <Download className="w-4 h-4" />
              Download Filtered
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Employee payroll table */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Employee Payroll</h3>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Basic</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gross</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Deductions</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Pay</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles?.map((profile) => {
                    const s = parseSalary(profile.salary_info);
                    const totalDeductions = s
                      ? s.pf_deduction + s.tax + s.insurance
                      : 0;

                    return (
                      <tr
                        key={profile.id}
                        className="border-b border-border/50 hover:bg-secondary/30"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {profile.full_name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span className="font-medium">
                              {profile.full_name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {profile.department || "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {s ? fmt(s.basic) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {s ? fmt(s.gross) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right text-destructive">
                          {s ? `-${fmt(totalDeductions)}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          {s ? fmt(s.net) : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              s
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {s ? "Active" : "No Data"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
