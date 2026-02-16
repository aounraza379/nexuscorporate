import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnnouncements, Announcement } from "@/hooks/useAnnouncements";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

function wordCount(text: string) {
  return text.trim().split(/\s+/).length;
}

function AnnouncementItem({
  announcement,
  onAcknowledge,
}: {
  announcement: Announcement;
  onAcknowledge: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const isLong = wordCount(announcement.content) > 200;

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-announcement", {
        body: { content: announcement.content, title: announcement.title },
      });
      if (error) throw error;
      setSummary(data.summary);
    } catch (e: any) {
      toast.error("Failed to summarize: " + (e.message || "Unknown error"));
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{announcement.title}</span>
        <span className="text-xs font-normal bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
          Mandatory
        </span>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        {summary ? (
          <div className="text-sm space-y-1 bg-background/50 rounded-lg p-3 border border-border/50">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              AI Summary
            </p>
            <div className="whitespace-pre-line text-muted-foreground">{summary}</div>
          </div>
        ) : (
          <>
            <p className={`text-sm ${!expanded && isLong ? "line-clamp-3" : ""}`}>
              {announcement.content}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Show less" : "Read full announcement"}
              </button>
            )}
          </>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="default" onClick={() => onAcknowledge(announcement.id)} className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Acknowledge
          </Button>
          {isLong && !summary && (
            <Button size="sm" variant="outline" onClick={handleSummarize} disabled={summarizing} className="gap-1.5">
              {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Summarize
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function MandatoryAnnouncementsBanner() {
  const { unreadMandatory, markAsRead } = useAnnouncements();

  const handleAcknowledge = async (id: string) => {
    await markAsRead(id);
    toast.success("Announcement acknowledged");
  };

  if (!unreadMandatory || unreadMandatory.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {unreadMandatory.length} Critical Compliance Task{unreadMandatory.length > 1 ? "s" : ""}
      </h3>
      <AnimatePresence>
        {unreadMandatory.map((a) => (
          <motion.div
            key={a.id}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnnouncementItem announcement={a} onAcknowledge={handleAcknowledge} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
