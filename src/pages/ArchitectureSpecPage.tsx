import React from "react";
import { motion } from "framer-motion";
import {
  Mic, MessageSquare, Brain, Shield, Database, Navigation,
  CheckCircle2, XCircle, ArrowRight, ArrowDown, User, Users,
  UserCog, Lock, Eye, EyeOff, Briefcase, Heart, Calendar,
  DollarSign, FileText, Bell, ChevronRight, Cpu, Layers,
  Server, Globe, Fingerprint, ShieldCheck, ShieldAlert,
  Activity, CircuitBoard
} from "lucide-react";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function FlowArrow({ vertical = false }: { vertical?: boolean }) {
  return vertical ? (
    <div className="flex justify-center py-1">
      <ArrowDown className="w-5 h-5 text-primary/60" />
    </div>
  ) : (
    <div className="flex items-center px-1 shrink-0">
      <ChevronRight className="w-5 h-5 text-primary/50" />
    </div>
  );
}

function FlowNode({
  icon: Icon,
  label,
  sublabel,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 min-w-[120px] text-center backdrop-blur-md",
        accent
          ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
          : "border-border/40 bg-card/50"
      )}
    >
      <div className={cn("p-2 rounded-lg", accent ? "bg-primary/20" : "bg-muted/60")}>
        <Icon className={cn("w-5 h-5", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
      <span className="text-xs font-semibold text-foreground leading-tight">{label}</span>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground leading-tight">{sublabel}</span>
      )}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function ERDEntity({
  name,
  icon: Icon,
  fields,
  color,
}: {
  name: string;
  icon: React.ElementType;
  fields: string[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-md overflow-hidden">
      <div className={cn("flex items-center gap-2 px-4 py-2.5 border-b border-border/30", color)}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-bold">{name}</span>
      </div>
      <div className="px-4 py-2.5 space-y-1">
        {fields.map((f) => (
          <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1 h-1 rounded-full bg-primary/50" />
            <span className="font-mono">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PermRow({
  label,
  allowed,
}: {
  label: string;
  allowed: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      {allowed ? (
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Allowed</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-400">
          <XCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Denied</span>
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  icon: Icon,
  color,
  perms,
}: {
  role: string;
  icon: React.ElementType;
  color: string;
  perms: { label: string; allowed: boolean }[];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-md overflow-hidden">
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-border/30", color)}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-bold">{role}</span>
      </div>
      <div className="px-4 py-2">
        {perms.map((p) => (
          <PermRow key={p.label} {...p} />
        ))}
      </div>
    </div>
  );
}

export default function ArchitectureSpecPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/15 border border-primary/25">
                <CircuitBoard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Nexus<span className="text-primary">AI</span> — System Architecture
                </h1>
                <p className="text-sm text-muted-foreground">
                  Technical specification &amp; security manifest
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {[
                { icon: Layers, label: "React + Vite" },
                { icon: Server, label: "Supabase (Postgres)" },
                { icon: Brain, label: "Groq LLM" },
                { icon: Shield, label: "Row-Level Security" },
                { icon: Globe, label: "Edge Functions" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-muted/30 text-xs text-muted-foreground"
                >
                  <t.icon className="w-3.5 h-3.5 text-primary/70" />
                  {t.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* ─── Section 1: System Flow ─── */}
        <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
          <SectionHeading
            icon={Activity}
            title="System Flow"
            subtitle="End-to-end request lifecycle from user input to action execution"
          />

          {/* Desktop flow — horizontal */}
          <div className="hidden md:flex items-center justify-between gap-1 overflow-x-auto pb-2">
            <FlowNode icon={MessageSquare} label="User Input" sublabel="Text / Voice" />
            <FlowArrow />
            <FlowNode icon={Mic} label="Voice Engine" sublabel="Web Speech API" />
            <FlowArrow />
            <FlowNode icon={Brain} label="Nexus Agent" sublabel="Groq LLM" accent />
            <FlowArrow />
            <FlowNode icon={Shield} label="RLS Layer" sublabel="Supabase Policies" />
            <FlowArrow />
            <FlowNode icon={Database} label="Data Retrieval" sublabel="Salary / Claims / Leaves" />
            <FlowArrow />
            <FlowNode icon={Navigation} label="Action Exec" sublabel="Navigate / Approve" />
          </div>

          {/* Mobile flow — vertical */}
          <div className="flex md:hidden flex-col items-center gap-0">
            <FlowNode icon={MessageSquare} label="User Input" sublabel="Text / Voice" />
            <FlowArrow vertical />
            <FlowNode icon={Mic} label="Voice Engine" sublabel="Web Speech API" />
            <FlowArrow vertical />
            <FlowNode icon={Brain} label="Nexus Agent" sublabel="Groq LLM" accent />
            <FlowArrow vertical />
            <FlowNode icon={Shield} label="RLS Layer" sublabel="Supabase Policies" />
            <FlowArrow vertical />
            <FlowNode icon={Database} label="Data Retrieval" sublabel="Salary / Claims / Leaves" />
            <FlowArrow vertical />
            <FlowNode icon={Navigation} label="Action Exec" sublabel="Navigate / Approve" />
          </div>
        </motion.section>

        {/* ─── Section 2: ERD ─── */}
        <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
          <SectionHeading
            icon={Database}
            title="Entity Relationship Diagram"
            subtitle="Simplified view — core entities linked via employee_id (user_id)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ERDEntity
              name="profiles"
              icon={User}
              color="bg-blue-500/10 text-blue-400"
              fields={["id (PK)", "full_name", "department", "salary_info (JSONB)", "employment_status", "reporting_manager"]}
            />
            <ERDEntity
              name="claims_history"
              icon={Heart}
              color="bg-rose-500/10 text-rose-400"
              fields={["id (PK)", "user_id → profiles.id", "category", "amount", "status", "claim_date", "provider"]}
            />
            <ERDEntity
              name="leave_requests"
              icon={Calendar}
              color="bg-amber-500/10 text-amber-400"
              fields={["id (PK)", "user_id → profiles.id", "leave_type", "start_date", "end_date", "status", "reviewed_by"]}
            />
            <ERDEntity
              name="employee_benefits"
              icon={ShieldCheck}
              color="bg-emerald-500/10 text-emerald-400"
              fields={["id (PK)", "user_id → profiles.id", "insurance_tier", "total_limit", "amount_spent", "dependents (JSONB)"]}
            />
          </div>

          {/* Relationship lines description */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              "profiles.id ← claims_history.user_id",
              "profiles.id ← leave_requests.user_id",
              "profiles.id ← employee_benefits.user_id",
              "profiles.salary_info (embedded JSONB)",
            ].map((rel) => (
              <div
                key={rel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 bg-muted/20 text-[11px] font-mono text-muted-foreground"
              >
                <ArrowRight className="w-3 h-3 text-primary/50" />
                {rel}
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── Section 3: Security Manifest ─── */}
        <motion.section {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }}>
          <SectionHeading
            icon={Fingerprint}
            title="Security Manifest"
            subtitle="Nexus Agent data access matrix — enforced by RLS at the database level"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RoleCard
              role="Employee"
              icon={User}
              color="bg-blue-500/10 text-blue-400"
              perms={[
                { label: "Own salary info", allowed: true },
                { label: "Own claims history", allowed: true },
                { label: "Own leave requests", allowed: true },
                { label: "Own benefits & dependents", allowed: true },
                { label: "Company policies", allowed: true },
                { label: "Announcements", allowed: true },
                { label: "Other employees' salary", allowed: false },
                { label: "Other employees' claims", allowed: false },
                { label: "Other employees' leave", allowed: false },
                { label: "Approve / deny requests", allowed: false },
              ]}
            />
            <RoleCard
              role="Manager"
              icon={Users}
              color="bg-amber-500/10 text-amber-400"
              perms={[
                { label: "Own salary info", allowed: true },
                { label: "Own claims history", allowed: true },
                { label: "Team leave requests", allowed: true },
                { label: "Team task management", allowed: true },
                { label: "Team benefits overview", allowed: true },
                { label: "Approve / deny leave", allowed: true },
                { label: "Create announcements", allowed: true },
                { label: "Other employees' salary", allowed: false },
                { label: "Edit employee profiles", allowed: false },
                { label: "Manage user roles", allowed: false },
              ]}
            />
            <RoleCard
              role="HR Admin"
              icon={UserCog}
              color="bg-emerald-500/10 text-emerald-400"
              perms={[
                { label: "All employee profiles", allowed: true },
                { label: "All salary information", allowed: true },
                { label: "All claims history", allowed: true },
                { label: "All leave requests", allowed: true },
                { label: "All benefits & dependents", allowed: true },
                { label: "Approve / deny leave", allowed: true },
                { label: "Manage user roles", allowed: true },
                { label: "Create policies", allowed: true },
                { label: "Audit logs", allowed: true },
                { label: "Delete employee profiles", allowed: false },
              ]}
            />
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center py-8 border-t border-border/20"
        >
          <p className="text-xs text-muted-foreground">
            NexusAI Corporate OS — Architecture Specification v1.0
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            Built with React · Supabase · Groq · Framer Motion
          </p>
        </motion.div>
      </div>
    </div>
  );
}
