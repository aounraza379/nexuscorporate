import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNexusChat } from "@/hooks/useNexusChat";
import { useAgentToolbox } from "@/hooks/useAgentToolbox";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  X,
  Sparkles,
  User,
  Briefcase,
  Shield,
  Loader2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Navigation,
  Activity,
} from "lucide-react";

interface NexusAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleConfig = {
  employee: {
    icon: <User className="w-4 h-4" />,
    greeting: "I can check tasks, leave, policies. What do you need?",
    suggestions: ["My pending tasks", "Leave balance", "Go to wellness"],
  },
  manager: {
    icon: <Briefcase className="w-4 h-4" />,
    greeting: "Ready to execute. Pending leaves, approvals, analytics?",
    suggestions: ["Pending approvals", "Approve all leaves", "Show analytics"],
  },
  hr: {
    icon: <Shield className="w-4 h-4" />,
    greeting: "Full org access. What action should I take?",
    suggestions: ["Org headcount", "Pending leaves", "Create announcement"],
  },
};

// Navigation intent detection
const NAVIGATION_PATTERNS = [
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(analytics|reports|stats)/i, route: "analytics" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(tasks?|my tasks)/i, route: "tasks" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(leave|leave requests)/i, route: "leave" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(announcements?|news)/i, route: "announcements" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(team|my team)/i, route: "team" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(employees?|staff)/i, route: "employees" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(settings?|preferences)/i, route: "settings" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(policies?)/i, route: "policies" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(dashboard|home|overview)/i, route: "dashboard" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(salary|pay)/i, route: "salary" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(wellness|health)/i, route: "wellness" },
  { pattern: /\b(show|go to|open|navigate to|take me to)\s+(payroll)/i, route: "payroll" },
];

export function NexusAssistant({ isOpen, onClose }: NexusAssistantProps) {
  const { userRole } = useAuth();
  const { messages, isLoading, isExecutingActions, sendMessage, clearMessages } = useNexusChat();
  const { 
    approveLeave, 
    rejectLeave, 
    triggerNavigation, 
    canExecuteActions, 
    isSyncing,
    currentRoute 
  } = useAgentToolbox();
  const { leaveRequests } = useLeaveRequests();
  const [input, setInput] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = roleConfig[userRole || "employee"];
  const pendingLeaves = leaveRequests?.filter(l => l.status === "pending") || [];

  // Show syncing indicator when AI is executing actions
  const showSyncing = isSyncing || isExecutingActions;

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle message - let the AI + action parser handle everything
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleQuickApprove = async (leaveId: string) => {
    setProcessingAction(leaveId);
    try {
      await approveLeave(leaveId);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleQuickReject = async (leaveId: string) => {
    setProcessingAction(leaveId);
    try {
      await rejectLeave(leaveId);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleQuickNav = (route: string) => {
    triggerNavigation(route);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 flex flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl"
        >
          {/* Header with sync indicator */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center relative">
                <Bot className="w-4 h-4 text-white" />
                {showSyncing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm">Nexus</h3>
                  {showSyncing && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary flex items-center gap-1"
                    >
                      <Activity className="w-2.5 h-2.5 animate-pulse" />
                      {isExecutingActions ? "Executing..." : "Syncing..."}
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {config.icon}
                  <span className="capitalize">{userRole}</span>
                  {canExecuteActions && (
                    <span className="ml-1 px-1 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                      <Zap className="w-2 h-2 inline mr-0.5" />Actions
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pending Actions Bar */}
          {canExecuteActions && pendingLeaves.length > 0 && (
            <div className="p-2 bg-primary/5 border-b border-primary/20">
              <div className="flex items-center gap-2 text-xs mb-2">
                <AlertTriangle className="w-3 h-3 text-primary" />
                <span className="font-medium">{pendingLeaves.length} pending approval(s)</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {pendingLeaves.slice(0, 3).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between bg-background/50 rounded p-1.5 text-xs"
                  >
                    <span className="truncate flex-1">
                      {leave.leave_type} • {leave.start_date}
                    </span>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-green-600 hover:bg-green-600/10"
                        onClick={() => handleQuickApprove(leave.id)}
                        disabled={processingAction === leave.id}
                      >
                        {processingAction === leave.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-600 hover:bg-red-600/10"
                        onClick={() => handleQuickReject(leave.id)}
                        disabled={processingAction === leave.id}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Nav (always visible) */}
          <div className="p-2 border-b border-border flex gap-1 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={() => handleQuickNav("dashboard")}
            >
              <Navigation className="w-3 h-3" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => handleQuickNav("tasks")}
            >
              Tasks
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => handleQuickNav("leave")}
            >
              Leave
            </Button>
            {(userRole === "manager" || userRole === "hr") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => handleQuickNav("analytics")}
              >
                Analytics
              </Button>
            )}
          </div>

          {/* Chat Area */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="space-y-3">
              {/* Initial greeting */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-secondary/50 rounded-lg rounded-tl-sm p-2.5 max-w-[85%]">
                      <p className="text-sm">{config.greeting}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 pl-9">
                    {config.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(suggestion)}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-secondary"
                        : "bg-gradient-to-br from-primary to-accent"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div
                      className={`rounded-lg p-2.5 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-secondary/50 rounded-tl-sm"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-sm prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ul]:pl-4">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    {/* Executed Actions Indicator */}
                    {message.role === "assistant" && message.executedActions && message.executedActions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex flex-wrap gap-1 pl-1"
                      >
                        {message.executedActions.map((executed, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              executed.result.success 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {executed.result.success ? (
                              <CheckCircle className="w-2.5 h-2.5" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5" />
                            )}
                            {executed.action.type.replace("_", " ")}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-secondary/50 rounded-lg rounded-tl-sm p-2.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask or command Nexus..."
                className="flex-1 h-9 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                variant="glow"
                size="icon"
                className="h-9 w-9"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
