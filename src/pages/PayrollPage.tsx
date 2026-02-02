import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Users,
  DollarSign,
  Download,
  Search,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

// Mock payroll data
const payrollSummary = {
  totalPayroll: 425000,
  employeeCount: 142,
  avgSalary: 2993,
  pendingPayments: 12,
};

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("february-2026");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all-profiles-payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department, salary_info");

      if (error) throw error;
      return data;
    },
  });

  const filteredProfiles = profiles?.filter((p) =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
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
        <Button className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">${payrollSummary.totalPayroll.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{payrollSummary.employeeCount}</p>
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
                <p className="text-sm text-muted-foreground">Avg Salary</p>
                <p className="text-2xl font-bold">${payrollSummary.avgSalary.toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <Calendar className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{payrollSummary.pendingPayments}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Filters */}
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
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="february-2026">February 2026</SelectItem>
                <SelectItem value="january-2026">January 2026</SelectItem>
                <SelectItem value="december-2025">December 2025</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download All
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Employee Payroll Table */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Employee Payroll</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Base Salary</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Allowances</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Deductions</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Pay</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles?.map((profile, index) => {
                    // Mock salary data
                    const baseSalary = 3000 + (index * 200);
                    const allowances = 500;
                    const deductions = Math.round(baseSalary * 0.2);
                    const netPay = baseSalary + allowances - deductions;

                    return (
                      <tr key={profile.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {profile.full_name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span className="font-medium">{profile.full_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {profile.department || "Unassigned"}
                        </td>
                        <td className="py-3 px-4 text-right">${baseSalary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-green-500">+${allowances.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-destructive">-${deductions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold">${netPay.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            index % 3 === 0 
                              ? "bg-yellow-500/10 text-yellow-500" 
                              : "bg-green-500/10 text-green-500"
                          }`}>
                            {index % 3 === 0 ? "Pending" : "Paid"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
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
