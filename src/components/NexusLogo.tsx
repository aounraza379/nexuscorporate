import { motion } from "framer-motion";

interface NexusLogoProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function NexusLogo({ size = "md", animate = true }: NexusLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
        
        {/* Inner hexagon-like shape */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(187, 100%, 42%)" />
              <stop offset="100%" stopColor="hsl(270, 60%, 50%)" />
            </linearGradient>
          </defs>
          
          {/* Hexagon */}
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            stroke="url(#nexusGradient)"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Inner triangle */}
          <polygon
            points="50,25 75,65 25,65"
            fill="url(#nexusGradient)"
            opacity="0.3"
          />
          
          {/* Center dot */}
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="url(#nexusGradient)"
          />
        </svg>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10" />
      </motion.div>
      
      <div className="flex flex-col">
        <span 
          className={`${textSizes[size]} font-bold tracking-tight`}
          style={{
            background: "linear-gradient(135deg, hsl(187, 100%, 42%) 0%, hsl(270, 60%, 50%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          NexusAI
        </span>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Corporate OS
        </span>
      </div>
    </div>
  );
}
