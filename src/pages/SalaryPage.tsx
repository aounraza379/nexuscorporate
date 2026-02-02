import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import {
  Wallet,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock salary data - in production this would come from Supabase
const salaryHistory = [
  { month: "January 2026", gross: 5500, deductions: 1100, net: 4400, status: "paid" },
  { month: "December 2025", gross: 5500, deductions: 1100, net: 4400, status: "paid" },
  { month: "November 2025", gross: 5500, deductions: 1100, net: 4400, status: "paid" },
  { month: "October 2025", gross: 5200, deductions: 1040, net: 4160, status: "paid" },
];

const currentPayslip = {
  basicSalary: 4000,
  allowances: 1500,
  overtime: 0,
  grossSalary: 5500,
  tax: 825,
  insurance: 275,
  deductions: 1100,
  netSalary: 4400,
};

export default function SalaryPage() {
  const { profile } = useAuth();

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
            Salary & Payslips
          </h1>
          <p className="text-muted-foreground">
            View your salary details and download payslips
          </p>
        </div>
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
                <p className="text-sm text-muted-foreground">Net Salary</p>
                <p className="text-2xl font-bold">${currentPayslip.netSalary.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">${currentPayslip.grossSalary.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-2xl font-bold">${currentPayslip.deductions.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">Feb 28</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Payslip Breakdown */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Current Payslip - February 2026
              </h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Basic Salary</span>
                <span className="font-medium">${currentPayslip.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Allowances</span>
                <span className="font-medium text-green-500">+${currentPayslip.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Overtime</span>
                <span className="font-medium">${currentPayslip.overtime.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50 font-semibold">
                <span>Gross Salary</span>
                <span>${currentPayslip.grossSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium text-destructive">-${currentPayslip.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Insurance</span>
                <span className="font-medium text-destructive">-${currentPayslip.insurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3 font-bold text-lg">
                <span>Net Salary</span>
                <span className="text-primary">${currentPayslip.netSalary.toLocaleString()}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Salary History */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              Salary History
            </h3>

            <div className="space-y-3">
              {salaryHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{entry.month}</p>
                    <p className="text-sm text-muted-foreground">
                      Gross: ${entry.gross.toLocaleString()} | Deductions: ${entry.deductions.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${entry.net.toLocaleString()}</p>
                    <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" className="w-full mt-4">
              View All History
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
