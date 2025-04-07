import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { z } from "zod";
import { insertParticipantSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminParticipants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteParticipantId, setDeleteParticipantId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;
  if (user.role !== "admin") {
    return <Redirect to="/judge/evaluate" />;
  }

  // Fetch participants
  const { data: participants, isLoading } = useQuery({
    queryKey: ["/api/participants"],
  });

  // Form validation schema
  const formSchema = insertParticipantSchema.extend({
    participantId: z.string()
      .min(3, "Participant ID must be at least 3 characters")
      .regex(/^[A-Za-z0-9\-]+$/, "Participant ID must only contain letters, numbers, and hyphens"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    project: z.string().min(3, "Project title must be at least 3 characters"),
    // Description will still be included but set to a default value
    description: z.string().default(""),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participantId: "",
      name: "",
      project: "",
      description: "", // This will be set to a default value when submitting
    },
  });

  // Create participant mutation
  const createParticipantMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/participants", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      toast({
        title: "Participant added",
        description: "The participant has been successfully added.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add participant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete participant mutation
  const deleteParticipantMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/participants/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({
        title: "Participant deleted",
        description: "The participant has been successfully removed.",
      });
      setDeleteParticipantId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete participant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    createParticipantMutation.mutate(values);
  }

  // Filter participants by search query
  const filteredParticipants = Array.isArray(participants)
    ? participants.filter(
        (participant: any) =>
          participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.participantId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="admin" />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header
          onAddNew={() => setIsAddDialogOpen(true)}
          addNewLabel="New Participant"
          onSearch={setSearchQuery}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Participants</h1>
            <p className="text-slate-500">
              Manage participants for the Arduino Innovator Challenge
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredParticipants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant: any) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{participant.participantId}</TableCell>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.project}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {participant.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteParticipantId(participant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-slate-500">
                  {searchQuery
                    ? "No participants match your search criteria"
                    : "No participants have been added yet"}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Participant
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Participant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Participant</DialogTitle>
            <DialogDescription>
              Enter the details for the new participant
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="participantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participant ID</FormLabel>
                    <FormControl>
                      <Input placeholder="ARDC-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for this participant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Smart Irrigation System" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Project Description field removed as requested */}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createParticipantMutation.isPending}
                >
                  {createParticipantMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                    </>
                  ) : (
                    "Add Participant"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteParticipantId !== null}
        onOpenChange={(open) => !open && setDeleteParticipantId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the participant and all associated
              evaluation data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteParticipantId !== null) {
                  deleteParticipantMutation.mutate(deleteParticipantId);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteParticipantMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
