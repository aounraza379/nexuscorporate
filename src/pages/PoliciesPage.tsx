import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePolicies, Policy } from "@/hooks/usePolicies";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Plus,
  FileText,
  Edit2,
  Archive,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";

const categories = [
  { value: "general", label: "General" },
  { value: "leave", label: "Leave & PTO" },
  { value: "remote", label: "Remote Work" },
  { value: "conduct", label: "Code of Conduct" },
  { value: "expense", label: "Expense" },
  { value: "security", label: "Security" },
];

export default function PoliciesPage() {
  const { userRole } = useAuth();
  const { policies, isLoading, createPolicy, updatePolicy, deletePolicy, isHR } = usePolicies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    content: "",
    category: "general",
  });

  const handleCreate = async () => {
    if (!newPolicy.title.trim() || !newPolicy.content.trim()) return;
    await createPolicy.mutateAsync(newPolicy);
    setNewPolicy({ title: "", content: "", category: "general" });
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingPolicy) return;
    await updatePolicy.mutateAsync({
      id: editingPolicy.id,
      updates: {
        title: editingPolicy.title,
        content: editingPolicy.content,
        category: editingPolicy.category,
      },
    });
    setEditingPolicy(null);
  };

  const handleArchive = async (id: string) => {
    await deletePolicy.mutateAsync(id);
  };

  // Group policies by category
  const groupedPolicies = policies.reduce((acc, policy) => {
    const cat = policy.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(policy);
    return acc;
  }, {} as Record<string, Policy[]>);

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
          <h1 className="text-2xl font-bold">Company Policies</h1>
          <p className="text-muted-foreground">
            {policies.length} active policies
          </p>
        </div>
        
        {isHR && (
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="glow" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Policy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Policy title"
                    value={newPolicy.title}
                    onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                  />
                  <Select
                    value={newPolicy.category}
                    onValueChange={(value) => setNewPolicy({ ...newPolicy, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Policy content... (Supports Markdown)"
                    value={newPolicy.content}
                    onChange={(e) => setNewPolicy({ ...newPolicy, content: e.target.value })}
                    rows={10}
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={!newPolicy.title.trim() || !newPolicy.content.trim() || createPolicy.isPending}
                    className="w-full"
                  >
                    {createPolicy.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Policy"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Train AI
            </Button>
          </div>
        )}
      </div>

      {/* Policies by Category */}
      {policies.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No policies yet</h3>
          <p className="text-sm text-muted-foreground">
            {isHR
              ? "Click 'Add Policy' to create your first company policy"
              : "Company policies will appear here"}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPolicies).map(([category, categoryPolicies]) => (
            <GlassCard key={category}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {categories.find((c) => c.value === category)?.label || category}
                </h2>
                <Badge variant="secondary">{categoryPolicies.length}</Badge>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                {categoryPolicies.map((policy) => (
                  <AccordionItem key={policy.id} value={policy.id} className="border-none">
                    <AccordionTrigger className="hover:no-underline py-3 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{policy.title}</span>
                        <span className="text-xs text-muted-foreground">
                          Updated {new Date(policy.updated_at || policy.created_at || "").toLocaleDateString()}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 bg-secondary/20 rounded-b-lg">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-muted-foreground">{policy.content}</p>
                      </div>
                      
                      {isHR && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingPolicy(policy)}
                            className="gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleArchive(policy.id)}
                            disabled={deletePolicy.isPending}
                            className="gap-1 text-nexus-warning"
                          >
                            <Archive className="w-3 h-3" />
                            Archive
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Edit Policy Dialog */}
      <Dialog open={!!editingPolicy} onOpenChange={() => setEditingPolicy(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
          </DialogHeader>
          {editingPolicy && (
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Policy title"
                value={editingPolicy.title}
                onChange={(e) => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
              />
              <Select
                value={editingPolicy.category || "general"}
                onValueChange={(value) => setEditingPolicy({ ...editingPolicy, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Policy content..."
                value={editingPolicy.content}
                onChange={(e) => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
                rows={10}
              />
              <Button
                onClick={handleUpdate}
                disabled={!editingPolicy.title.trim() || !editingPolicy.content.trim() || updatePolicy.isPending}
                className="w-full"
              >
                {updatePolicy.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
