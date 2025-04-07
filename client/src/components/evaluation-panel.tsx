import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Participant, insertEvaluationSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { z } from "zod";

interface EvaluationPanelProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  requireComments?: boolean;
  allowEditEvaluations?: boolean;
  showScoresToParticipants?: boolean;
  autoLogout?: boolean;
}

export function EvaluationPanel({ participant, isOpen, onClose }: EvaluationPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get criteria and settings
  const { data: criteria } = useQuery({
    queryKey: ["/api/criteria"],
    enabled: isOpen,
  });
  
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    enabled: isOpen,
  });
  
  // Get existing evaluation if any
  const { data: existingEvaluations, isLoading: isLoadingEvaluations } = useQuery({
    queryKey: ["/api/evaluations/judge"],
    enabled: isOpen && !!participant,
  });
  
  // State for evaluation scores (1-100 scale)
  const [scores, setScores] = useState({
    projectDesign: 1,
    functionality: 1,
    presentation: 1,
    webDesign: 1,
    impact: 1,
  });
  
  const [comments, setComments] = useState("");
  
  // Reset form when participant changes
  useEffect(() => {
    if (participant && existingEvaluations && Array.isArray(existingEvaluations)) {
      // Check if there's an existing evaluation for this participant
      const existing = existingEvaluations.find(
        (e: any) => e.participantId === participant.id
      );
      
      if (existing) {
        setScores({
          projectDesign: existing.projectDesign,
          functionality: existing.functionality,
          presentation: existing.presentation,
          webDesign: existing.webDesign,
          impact: existing.impact,
        });
        setComments(existing.comments || "");
      } else {
        // Reset to defaults (1-100 scale)
        setScores({
          projectDesign: 1,
          functionality: 1,
          presentation: 1,
          webDesign: 1,
          impact: 1,
        });
        setComments("");
      }
    }
  }, [participant, existingEvaluations]);
  
  // Handle form submission
  const submitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertEvaluationSchema>) => {
      const res = await apiRequest("POST", "/api/evaluations", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Evaluation submitted",
        description: "Your evaluation has been successfully saved.",
      });
      
      // Reset comments field immediately after successful submission
      setComments("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations/judge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = () => {
    if (!participant || !user) return;
    
    // Validate comments if required
    if (settings?.requireComments && !comments.trim()) {
      toast({
        title: "Comments required",
        description: "Please provide comments for your evaluation.",
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate({
      participantId: participant.id,
      judgeId: user.id,
      ...scores,
      comments,
    });
  };
  
  if (!participant) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Evaluate Participant</DialogTitle>
          <DialogDescription>
            Use the sliders below to rate this participant's project across various criteria.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 py-4">
          {isLoadingEvaluations ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mr-4">
                    <span className="text-lg font-semibold">
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800">{participant.name}</h4>
                    <p className="text-slate-500">{participant.project}</p>
                  </div>
                </div>
                {/* Description removed as requested */}
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-black-900">Project Design</label>
                    <span className="text-lg font-semibold text-black">{scores.projectDesign.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-slate-800 w-8">1</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      step="1" 
                      value={scores.projectDesign} 
                      onChange={(e) => setScores({...scores, projectDesign: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full mx-2 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-xs text-slate-800 w-8">100</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluate the overall design quality, aesthetics, and structure of the project
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-black-900">Functionality</label>
                    <span className="text-lg font-semibold text-black">{scores.functionality.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-slate-800 w-8">1</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      step="1" 
                      value={scores.functionality} 
                      onChange={(e) => setScores({...scores, functionality: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full mx-2 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-xs text-slate-800 w-8">100</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Rate how well the project works and fulfills its intended purpose
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-black-900">Presentation</label>
                    <span className="text-lg font-semibold text-black">{scores.presentation.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-slate-800 w-8">1</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      step="1" 
                      value={scores.presentation} 
                      onChange={(e) => setScores({...scores, presentation: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full mx-2 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-xs text-slate-800 w-8">100</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluate the quality of the project presentation and documentation
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-black-900">Web Design</label>
                    <span className="text-lg font-semibold text-black">{scores.webDesign.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-slate-800 w-8">1</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      step="1" 
                      value={scores.webDesign} 
                      onChange={(e) => setScores({...scores, webDesign: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full mx-2 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-xs text-slate-800 w-8">100</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Rate the quality of any web interfaces or web components of the project
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Impact</label>
                    <span className="text-lg font-semibold text-black">{scores.impact.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-slate-800 w-8">1</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      step="1" 
                      value={scores.impact} 
                      onChange={(e) => setScores({...scores, impact: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-full mx-2 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <span className="text-xs text-slate-800 w-8">100</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluate the potential social, environmental, or economic impact of the project
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Comments {settings?.requireComments ? <span className="text-red-500">*</span> : null}
                  </label>
                  <Textarea 
                    rows={3} 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any additional comments or feedback for this participant..." 
                    className="resize-none bg-white text-black"
                  />
                  {settings?.requireComments && (
                    <p className="text-xs text-slate-500 mt-1">Comments are required before submission</p>
                  )}
                </div>

                {/* Judge Comments Section */}
                {existingEvaluations && existingEvaluations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-slate-800">Previous Judge Comments</h4>
                    <div className="space-y-2 mt-2">
                      {existingEvaluations
                        .filter((evaluation: any) => evaluation.participantId === participant.id)
                        .map((evaluation: any, index: number) => (
                          evaluation.comments ? (
                            <div key={index} className="border p-3 rounded-lg bg-gray-100">
                              <p className="text-sm text-slate-700">{evaluation.comments}</p>
                              <p className="text-xs text-slate-500 mt-1">— Judge {evaluation.judgeId}</p>
                            </div>
                          ) : null
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitMutation.isPending || isLoadingEvaluations}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Evaluation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
