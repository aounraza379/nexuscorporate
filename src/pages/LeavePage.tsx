import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useLeaveImpact } from "@/hooks/useLeaveImpact";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LeaveCapacityWarning } from "@/components/leave/LeaveCapacityWarning";
import { LeaveImpactBadge } from "@/components/leave/LeaveImpactBadge";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";

const leaveTypes = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "personal", label: "Personal Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

const statusConfig = {
  pending: { color: "bg-nexus-warning/20 text-nexus-warning", icon: Clock },
  approved: { color: "bg-nexus-success/20 text-nexus-success", icon: CheckCircle2 },
  rejected: { color: "bg-nexus-error/20 text-nexus-error", icon: XCircle },
};

export default function LeavePage() {
  const { userRole, user, profile } = useAuth();
  const { leaveRequests, isLoading, createLeaveRequest, updateLeaveRequest } = useLeaveRequests();
  const { impact, isAnalyzing, analyzeImpact, clearImpact } = useLeaveImpact();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leave_type: "annual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  // Analyze impact when dates change in creation form
  useEffect(() => {
    if (newRequest.start_date && newRequest.end_date && profile?.department) {
      analyzeImpact({
        start_date: newRequest.start_date,
        end_date: newRequest.end_date,
        department: profile.department,
      });
    } else {
      clearImpact();
    }
  }, [newRequest.start_date, newRequest.end_date, profile?.department]);

  const handleSubmit = async () => {
    if (!newRequest.start_date || !newRequest.end_date) return;
    await createLeaveRequest.mutateAsync(newRequest);
    setNewRequest({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
    clearImpact();
    setIsCreateOpen(false);
  };

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    await updateLeaveRequest.mutateAsync({ id, status });
  };

  const displayedRequests = userRole === "employee"
    ? leaveRequests.filter((r) => r.user_id === user?.id)
    : leaveRequests;

  const pendingCount = displayedRequests.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {userRole === "employee" ? "My Leave Requests" : "Leave Management"}
          </h1>
          <p className="text-muted-foreground">
            {displayedRequests.length} total requests • {pendingCount} pending
          </p>
        </div>

        {userRole === "employee" && (
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) clearImpact(); }}>
            <DialogTrigger asChild>
              <Button variant="glow" className="gap-2">
                <Plus className="w-4 h-4" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border">
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Select
                  value={newRequest.leave_type}
                  onValueChange={(value) => setNewRequest({ ...newRequest, leave_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Start Date</label>
                    <Input
                      type="date"
                      value={newRequest.start_date}
                      onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">End Date</label>
                    <Input
                      type="date"
                      value={newRequest.end_date}
                      onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Capacity Warning */}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing department capacity…
                  </div>
                )}
                {impact && !isAnalyzing && <LeaveCapacityWarning impact={impact} />}

                <Textarea
                  placeholder="Reason (optional)"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!newRequest.start_date || !newRequest.end_date || createLeaveRequest.isPending}
                  className="w-full"
                >
                  {createLeaveRequest.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {displayedRequests.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No leave requests</h3>
            <p className="text-sm text-muted-foreground">
              {userRole === "employee"
                ? "Click 'Request Leave' to submit your first request"
                : "No pending leave requests to review"}
            </p>
          </GlassCard>
        ) : (
          displayedRequests.map((request) => {
            const statusInfo = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = statusInfo.icon;
            const isManagerView = (userRole === "manager" || userRole === "hr");

            return (
              <motion.div
                key={request.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status}
                        </Badge>
                        <Badge variant="outline">
                          {leaveTypes.find((t) => t.value === request.leave_type)?.label || request.leave_type}
                        </Badge>
                        {/* Impact Analysis Badge for managers on pending requests */}
                        {isManagerView && request.status === "pending" && profile?.department && (
                          <LeaveImpactBadge
                            requestId={request.id}
                            startDate={request.start_date}
                            endDate={request.end_date}
                            department={profile.department}
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </span>
                      </div>

                      {request.reason && (
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Manager/HR Actions */}
                    {isManagerView && request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApproval(request.id, "approved")}
                          disabled={updateLeaveRequest.isPending}
                          className="bg-nexus-success/20 hover:bg-nexus-success/30 text-nexus-success"
                        >
                          {updateLeaveRequest.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApproval(request.id, "rejected")}
                          disabled={updateLeaveRequest.isPending}
                          className="bg-nexus-error/20 hover:bg-nexus-error/30 text-nexus-error"
                        >
                          {updateLeaveRequest.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
