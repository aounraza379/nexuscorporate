import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { NexusLogo } from "@/components/NexusLogo";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import {
  Bot,
  Shield,
  Zap,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Assistant",
    description: "Role-aware Nexus AI that adapts to Employee, Manager, or HR contexts.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure dashboards with permissions tailored to each role.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Burnout detection, sentiment analysis, and productivity insights.",
  },
  {
    icon: Zap,
    title: "Instant Actions",
    description: "Quick task management, policy access, and announcements.",
  },
];

const benefits = [
  "AI-driven employee wellness tracking",
  "Automated policy compliance checks",
  "Real-time team sentiment analysis",
  "Seamless salary and payroll management",
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh grid-pattern relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "-10%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "-10%", right: "-10%" }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <NexusLogo size="md" animate={false} />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button variant="hero" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-First Employee Management</span>
          </motion.div>

          <h1 className="text-display mb-6">
            The Future of{" "}
            <span className="text-nexus-gradient">Corporate Intelligence</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            NexusAI transforms workforce management with role-based AI assistance,
            smart analytics, and a beautiful glassmorphism interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl" className="gap-2">
              <Bot className="w-5 h-5" />
              Meet Nexus AI
            </Button>
          </div>
        </motion.div>

        {/* Floating cards preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card rounded-2xl p-1 max-w-5xl mx-auto overflow-hidden">
            <div className="bg-card/80 rounded-xl p-6">
              {/* Mock dashboard preview */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-nexus-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-nexus-success/60" />
                </div>
                <div className="flex-1 h-4 bg-secondary/50 rounded-full max-w-xs" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="h-24 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-border/30"
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="col-span-2 h-40 rounded-lg bg-secondary/30" />
                <div className="h-40 rounded-lg bg-secondary/30" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-headline mb-4">Intelligent Features</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for the modern workplace with AI at its core
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <GlassCard key={feature.title} hover delay={index * 0.1}>
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-headline mb-6">
              Why Teams Choose{" "}
              <span className="text-nexus-gradient">NexusAI</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Experience the next generation of workforce management with AI-driven
              insights and a beautiful, intuitive interface.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-1 rounded-full bg-nexus-success/20">
                    <CheckCircle2 className="w-4 h-4 text-nexus-success" />
                  </div>
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </ul>
            <Button variant="hero" size="lg" className="mt-8 gap-2" onClick={() => navigate("/auth")}>
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <GlassCard glow className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Nexus Assistant</h4>
                  <p className="text-xs text-muted-foreground">HR Mode Active</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-secondary/50 rounded-lg rounded-tl-sm p-3 max-w-[80%]">
                  <p className="text-sm">
                    "Show me employees with potential burnout indicators"
                  </p>
                </div>
                <div className="bg-primary/10 rounded-lg rounded-tr-sm p-3 max-w-[90%] ml-auto">
                  <p className="text-sm">
                    I found 3 team members showing burnout signals. Alex has worked
                    overtime 5 days this week. Would you like me to draft a wellness
                    check email?
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <GlassCard glow className="text-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-headline mb-4">
              Ready to Transform Your Workplace?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join the future of employee management with AI-powered insights and
              beautiful interfaces.
            </p>
            <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
              Start Your Free Trial
            </Button>
          </motion.div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <NexusLogo size="sm" animate={false} />
          <p className="text-sm text-muted-foreground">
            © 2024 NexusAI. Corporate OS for the modern workforce.
          </p>
        </div>
      </footer>
    </div>
  );
}
