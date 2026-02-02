import { motion } from "framer-motion";
import { NexusLogo } from "./NexusLogo";

export function LoadingScreen() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8"
      >
        <NexusLogo size="lg" animate />
        
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        
        <p className="text-muted-foreground text-sm">
          Initializing NexusAI...
        </p>
      </motion.div>
    </div>
  );
}
