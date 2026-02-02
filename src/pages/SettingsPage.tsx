import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    department: profile?.department || "",
    bio: profile?.bio || "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    leaveUpdates: true,
  });

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          department: formData.department,
          bio: formData.bio,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
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
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            Profile Settings
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
                {formData.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-medium">{formData.full_name || "Your Name"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter your department"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Notification Settings */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Task Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about upcoming deadlines</p>
              </div>
              <Switch
                checked={notifications.taskReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, taskReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Leave Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications about leave request status</p>
              </div>
              <Switch
                checked={notifications.leaveUpdates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, leaveUpdates: checked })}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Security Settings */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            Security
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
              <Button variant="outline">Change</Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
