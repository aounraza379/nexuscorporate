import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  AlertCircle,
  Info,
  Star,
  Calendar,
  User,
} from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  created_at: string | null;
  expires_at: string | null;
  created_by: string | null;
}

export default function AnnouncementsPage() {
  const { userRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "normal",
  });

  const canCreate = userRole === "hr" || userRole === "manager";

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (announcement: typeof newAnnouncement) => {
      const { error } = await supabase.from("announcements").insert({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created successfully");
      setIsDialogOpen(false);
      setNewAnnouncement({ title: "", content: "", priority: "normal" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create announcement");
    },
  });

  const getPriorityIcon = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "important":
        return <Star className="w-4 h-4 text-primary" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "important":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Stay updated with company news and updates
          </p>
        </div>

        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Input
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Announcement content..."
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div>
                  <Select
                    value={newAnnouncement.priority}
                    onValueChange={(value) =>
                      setNewAnnouncement({ ...newAnnouncement, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => createMutation.mutate(newAnnouncement)}
                  disabled={!newAnnouncement.title || !newAnnouncement.content || createMutation.isPending}
                  className="w-full"
                >
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
            {canCreate
              ? "Create the first announcement to share with everyone."
              : "Check back later for company updates."}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {announcements?.map((announcement) => (
            <motion.div key={announcement.id} variants={itemVariants}>
              <GlassCard
                className={`border-l-4 ${
                  announcement.priority === "urgent"
                    ? "border-l-destructive"
                    : announcement.priority === "important"
                    ? "border-l-primary"
                    : "border-l-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPriorityIcon(announcement.priority)}
                      <h3 className="text-lg font-semibold">{announcement.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityBadge(
                          announcement.priority
                        )}`}
                      >
                        {announcement.priority || "normal"}
                      </span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {announcement.created_at
                          ? format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")
                          : "Unknown date"}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
