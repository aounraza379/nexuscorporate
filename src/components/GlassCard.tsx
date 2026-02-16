import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  delay?: number;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hover = false, glow = false, delay = 0 }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
        className={cn(
          "glass-card rounded-xl p-6",
          glow && "glow-primary",
          hover && "cursor-pointer transition-shadow hover:shadow-2xl",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
