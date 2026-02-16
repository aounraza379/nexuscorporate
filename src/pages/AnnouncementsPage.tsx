import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Megaphone, Plus, AlertCircle, Info, Star, Calendar, CheckCircle2, Shield, Sparkles, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

function wordCount(text: string) {
  return text.trim().split(/\s+/).length;
}

export default function AnnouncementsPage() {
  const { userRole, user } = useAuth();
  const queryClient = useQueryClient();
  const { announcements, isLoading, markAsRead } = useAnnouncements();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "", content: "", priority: "normal", is_mandatory: false,
  });
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const canCreate = userRole === "hr" || userRole === "manager";

  const createMutation = useMutation({
    mutationFn: async (announcement: typeof newAnnouncement) => {
      const { error } = await supabase.from("announcements").insert({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        is_mandatory: announcement.is_mandatory,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
      setIsDialogOpen(false);
      setNewAnnouncement({ title: "", content: "", priority: "normal", is_mandatory: false });
    },
    onError: (error: any) => toast.error(error.message || "Failed to create"),
  });

  const handleSummarize = async (id: string, title: string, content: string) => {
    setSummarizing((p) => ({ ...p, [id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("summarize-announcement", {
        body: { content, title },
      });
      if (error) throw error;
      setSummaries((p) => ({ ...p, [id]: data.summary }));
    } catch (e: any) {
      toast.error("Failed to summarize");
    } finally {
      setSummarizing((p) => ({ ...p, [id]: false }));
    }
  };

  const handleAcknowledge = async (id: string) => {
    await markAsRead(id);
    toast.success("Acknowledged");
  };

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "urgent": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "important": return <Star className="w-4 h-4 text-primary" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "bg-destructive/10 text-destructive border-destructive/20";
      case "important": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground">Stay updated with company news and updates</p>
        </div>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />New Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Announcement title" value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
                <Textarea placeholder="Announcement content..." value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} rows={4} />
                <Select value={newAnnouncement.priority}
                  onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="mandatory" className="text-sm font-medium flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-destructive" /> Mandatory Compliance
                    </Label>
                    <p className="text-xs text-muted-foreground">Employees must acknowledge this announcement</p>
                  </div>
                  <Switch id="mandatory" checked={newAnnouncement.is_mandatory}
                    onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, is_mandatory: checked })} />
                </div>
                <Button onClick={() => createMutation.mutate(newAnnouncement)}
                  disabled={!newAnnouncement.title || !newAnnouncement.content || createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Creating..." : "Create Announcement"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-full mb-1" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </GlassCard>
          ))}
        </div>
      ) : announcements?.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Announcements Yet</h3>
          <p className="text-muted-foreground">
            {canCreate ? "Create the first announcement to share with everyone." : "Check back later for company updates."}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {announcements?.map((announcement) => {
            const isRead = announcement.read_by?.includes(user?.id || "");
            const isLong = wordCount(announcement.content) > 200;
            const hasSummary = !!summaries[announcement.id];
            const isExpanded = !!expanded[announcement.id];

            return (
              <motion.div key={announcement.id} variants={itemVariants}>
                <GlassCard className={`border-l-4 ${
                  announcement.priority === "urgent" ? "border-l-destructive"
                    : announcement.priority === "important" ? "border-l-primary" : "border-l-muted"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getPriorityIcon(announcement.priority)}
                        <h3 className="text-lg font-semibold">{announcement.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityBadge(announcement.priority)}`}>
                          {announcement.priority || "normal"}
                        </span>
                        {announcement.is_mandatory && (
                          <span className="px-2 py-0.5 text-xs rounded-full border bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Mandatory
                          </span>
                        )}
                        {announcement.is_mandatory && isRead && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Acknowledged
                          </span>
                        )}
                      </div>

                      {hasSummary ? (
                        <div className="text-sm space-y-1 bg-secondary/30 rounded-lg p-3 border border-border/50 mb-2">
                          <p className="font-medium flex items-center gap-1.5 text-foreground">
                            <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Summary
                          </p>
                          <div className="whitespace-pre-line text-muted-foreground">{summaries[announcement.id]}</div>
                        </div>
                      ) : (
                        <p className={`text-muted-foreground whitespace-pre-wrap ${!isExpanded && isLong ? "line-clamp-3" : ""}`}>
                          {announcement.content}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {isLong && !hasSummary && (
                          <>
                            <button onClick={() => setExpanded((p) => ({ ...p, [announcement.id]: !isExpanded }))}
                              className="text-xs text-primary flex items-center gap-1 hover:underline">
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? "Show less" : "Read full"}
                            </button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => handleSummarize(announcement.id, announcement.title, announcement.content)}
                              disabled={!!summarizing[announcement.id]}>
                              {summarizing[announcement.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              Summarize
                            </Button>
                          </>
                        )}
                        {announcement.is_mandatory && !isRead && (
                          <Button size="sm" variant="default" className="h-7 text-xs gap-1"
                            onClick={() => handleAcknowledge(announcement.id)}>
                            <CheckCircle2 className="w-3 h-3" /> Acknowledge
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {announcement.created_at ? format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                        </span>
                        {announcement.is_mandatory && (
                          <span className="text-xs text-muted-foreground">
                            {announcement.read_by?.length || 0} acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
