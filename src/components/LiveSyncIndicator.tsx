import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wifi } from "lucide-react";

interface LiveSyncIndicatorProps {
  isSyncing: boolean;
  isConnected?: boolean;
}

/**
 * Visual indicator for AI-driven sync operations.
 * Shows when the agent is moving data or navigating.
 */
export function LiveSyncIndicator({ isSyncing, isConnected = true }: LiveSyncIndicatorProps) {
  return (
    <>
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            key="sync-indicator"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium shadow-lg backdrop-blur-sm"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Live Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Connection status dot */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.2, 1] : 1,
            opacity: isConnected ? 1 : 0.5,
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            isConnected
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          <Wifi className="w-3 h-3" />
          <span>{isConnected ? "Live" : "Offline"}</span>
        </motion.div>
      </div>
    </>
  );
}
