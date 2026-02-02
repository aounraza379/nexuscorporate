import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNexusChat } from "@/hooks/useNexusChat";
import { useNexusNotifications } from "@/hooks/useNexusNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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
  Bell,
  CheckCircle,
  XCircle,
  Calendar,
  ListTodo,
  Megaphone,
  ChevronRight,
} from "lucide-react";

interface NexusAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const rolePersonas = {
  employee: {
    icon: <User className="w-4 h-4" />,
    greeting: "Hello! I'm NEXUS, your personal HR Assistant. I have access to your tasks, leave history, and all company policies. Ask me about:",
    suggestions: [
      "What are my pending tasks?",
      "What's the leave policy?",
      "How many leaves have I taken?",
      "What's my task workload?",
    ],
  },
  manager: {
    icon: <Briefcase className="w-4 h-4" />,
    greeting: "Welcome, Manager! I'm NEXUS, your management assistant. I can see all team leave requests, tasks, and policies. Ask me about:",
    suggestions: [
      "Show pending leave approvals",
      "Team workload summary",
      "Any burnout risks?",
      "Policy for remote work",
    ],
  },
  hr: {
    icon: <Shield className="w-4 h-4" />,
    greeting: "HR Admin access granted. I'm NEXUS, your HR analytics assistant with full access to employee data, policies, and organization metrics. Ask me about:",
    suggestions: [
      "Organization headcount",
      "Leave request analytics",
      "Policy recommendations",
      "Employee workload analysis",
    ],
  },
};

export function NexusAssistant({ isOpen, onClose }: NexusAssistantProps) {
  const { userRole } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages } = useNexusChat();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    executeLeaveAction 
  } = useNexusNotifications();
  const [input, setInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const persona = rolePersonas[userRole || "employee"];

  // Auto-show notifications panel when new notification arrives
  useEffect(() => {
    if (unreadCount > 0 && isOpen) {
      // Show a toast for the latest notification
      const latest = notifications[0];
      if (latest && !latest.read) {
        toast.info(latest.title, {
          description: latest.message,
          action: latest.actionable ? {
            label: "View",
            onClick: () => setShowNotifications(true),
          } : undefined,
        });
      }
    }
  }, [unreadCount]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleLeaveAction = async (notificationId: string, leaveId: string, action: "approved" | "rejected") => {
    setProcessingAction(notificationId);
    try {
      const result = await executeLeaveAction(leaveId, action);
      if (result.success) {
        toast.success(result.message);
        markAsRead(notificationId);
      } else {
        toast.error(result.message);
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave_request":
        return <Calendar className="w-4 h-4 text-primary" />;
      case "task_assigned":
      case "task_completed":
        return <ListTodo className="w-4 h-4 text-accent" />;
      case "announcement":
        return <Megaphone className="w-4 h-4 text-destructive" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
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
            <div className="flex items-center gap-1">
              {/* Notification Bell */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearMessages} title="Clear chat">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {showNotifications ? (
              /* Notifications Panel */
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between p-3 border-b border-border/50">
                  <h4 className="font-medium text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="flex-1 p-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg border ${
                            notification.read 
                              ? "bg-secondary/30 border-border/50" 
                              : "bg-primary/5 border-primary/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{notification.title}</p>
                                {!notification.read && (
                                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>

                              {/* Action Buttons for Leave Requests */}
                              {notification.actionable && notification.actionType === "approve_reject" && notification.entityId && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 text-green-600 border-green-600/30 hover:bg-green-600/10"
                                    onClick={() => handleLeaveAction(notification.id, notification.entityId!, "approved")}
                                    disabled={processingAction === notification.id}
                                  >
                                    {processingAction === notification.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 text-red-600 border-red-600/30 hover:bg-red-600/10"
                                    onClick={() => handleLeaveAction(notification.id, notification.entityId!, "rejected")}
                                    disabled={processingAction === notification.id}
                                  >
                                    {processingAction === notification.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {/* View button for other actionable notifications */}
                              {notification.actionable && notification.actionType === "view" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1 mt-2"
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    setShowNotifications(false);
                                  }}
                                >
                                  <ChevronRight className="w-3 h-3" />
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t border-border/50">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNotifications(false)}
                  >
                    Back to Chat
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Chat Panel */
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Greeting */}
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="glass-card rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                            <p className="text-sm font-medium">{persona.greeting}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              I only answer questions about company data and your work - nothing else!
                            </p>
                            {(userRole === "manager" || userRole === "hr") && (
                              <p className="text-xs text-primary mt-2">
                                💡 Tip: You can ask me to approve or reject leave requests!
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Quick suggestion buttons */}
                        <div className="flex flex-wrap gap-2 pl-11">
                          {persona.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setInput(suggestion);
                              }}
                              className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-foreground transition-colors border border-border/50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Chat messages */}
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
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
                          {message.role === "assistant" ? (
                            <div className="text-sm prose prose-sm prose-invert max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
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
                    NEXUS RAG System • Company Data Only
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
