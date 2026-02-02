import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  X,
  Sparkles,
  User,
  Briefcase,
  Shield,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface NexusAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const rolePersonas = {
  employee: {
    icon: <User className="w-4 h-4" />,
    greeting: "Hello! I'm your Nexus Career Coach. I can help you with tasks, company policies, and career guidance.",
    systemPrompt: "You are a helpful career coach and policy guide for employees.",
  },
  manager: {
    icon: <Briefcase className="w-4 h-4" />,
    greeting: "Welcome, Manager! I can assist with team analytics, task approvals, and burnout detection insights.",
    systemPrompt: "You are a management assistant helping with team oversight and analytics.",
  },
  hr: {
    icon: <Shield className="w-4 h-4" />,
    greeting: "HR Admin access granted. I'm ready to help with policies, payroll queries, and organizational insights.",
    systemPrompt: "You are an HR analytics and policy enforcement assistant.",
  },
};

export function NexusAssistant({ isOpen, onClose }: NexusAssistantProps) {
  const { userRole, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const persona = rolePersonas[userRole || "employee"];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (to be replaced with actual Lovable AI integration)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(input.trim(), userRole || "employee"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 flex flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-nexus-success border-2 border-card"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Nexus Assistant</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {persona.icon}
                  <span className="capitalize">{userRole} Mode</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Greeting */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-card rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                    <p className="text-sm">{persona.greeting}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ask me anything about policies, tasks, or your workspace.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Chat messages */}
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-secondary"
                        : "bg-gradient-to-br from-primary to-accent"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl p-3 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "glass-card rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-card rounded-2xl rounded-tl-sm p-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask Nexus anything..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                variant="glow"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Powered by NexusAI • Context-aware responses
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Simulated responses (to be replaced with actual AI)
function getSimulatedResponse(input: string, role: string): string {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes("policy") || lowerInput.includes("policies")) {
    return "Based on our company policies, I can help you with:\n\n• Remote Work Policy\n• Leave & PTO Guidelines\n• Code of Conduct\n• Expense Reimbursement\n\nWhich policy would you like to know more about?";
  }
  
  if (lowerInput.includes("task") || lowerInput.includes("tasks")) {
    return "I can see you have 3 pending tasks this week. Would you like me to:\n\n1. Prioritize them by urgency\n2. Show task details\n3. Suggest optimal completion order\n\nJust let me know!";
  }
  
  if (lowerInput.includes("salary") || lowerInput.includes("pay")) {
    if (role === "hr") {
      return "As HR, you have access to payroll analytics. The current payroll cycle closes on the 25th. Would you like to see department-wise salary distribution or pending approvals?";
    }
    return "Your salary information is available in the Salary section. For any discrepancies or questions, please contact HR through the official channel.";
  }
  
  if (lowerInput.includes("burnout") || lowerInput.includes("wellness")) {
    if (role === "manager" || role === "hr") {
      return "Based on recent sentiment analysis, 2 team members show potential burnout indicators. I recommend reviewing their task load and scheduling 1-on-1 check-ins this week.";
    }
    return "Your wellness score this week is 78/100. I notice you've been working late. Consider taking short breaks and using your wellness benefits. Would you like to see available wellness resources?";
  }
  
  return `I understand you're asking about "${input}". As your ${role === "employee" ? "career coach" : role === "manager" ? "management assistant" : "HR assistant"}, I'm here to help. Could you provide more details about what you'd like to know?`;
}
