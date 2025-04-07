import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EvaluationPanel } from "@/components/evaluation-panel";
import { Loader2, Search, Star, StarHalf, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function JudgeEvaluate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  // Fetch participants
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery<any[]>({
    queryKey: ["/api/participants"],
  });

  // Fetch judge's evaluations
  const { data: evaluations = [], isLoading: isLoadingEvaluations } = useQuery<any[]>({
    queryKey: ["/api/evaluations/judge"],
  });

  // Check if participant has been evaluated
  const hasEvaluated = (participantId: number) => {
    if (!evaluations) return false;
    return evaluations.some((evaluation: any) => evaluation.participantId === participantId);
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!participants || !evaluations) return 0;
    const totalParticipants = participants.length;
    const evaluatedCount = evaluations.length;
    return totalParticipants > 0 ? Math.round((evaluatedCount / totalParticipants) * 100) : 0;
  };

  // Handle opening evaluation panel
  const handleEvaluate = (participant: any) => {
    setSelectedParticipant(participant);
    setIsEvaluationOpen(true);
  };

  // Filter participants by search query
  const filteredParticipants = participants
    ? participants.filter(
        (participant: any) =>
          participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
          participant.participantId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="judge" />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onSearch={setSearchQuery} />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Evaluate Participants</h1>
            <p className="text-slate-500">
              Rate projects for the Arduino Innovator Challenge
            </p>
          </div>

          <div className="mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Your Evaluation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2">
                  <div className="flex-1">
                    <Progress value={getCompletionPercentage()} className="h-2" />
                  </div>
                  <span className="ml-4 text-sm font-medium">{getCompletionPercentage()}%</span>
                </div>
                <p className="text-sm text-slate-500">
                  {evaluations?.length || 0} of {participants?.length || 0} participants evaluated
                </p>

                {participants && evaluations && participants.length > 0 && evaluations.length === participants.length && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">All evaluations completed!</p>
                      <p className="text-sm text-green-700">You've successfully evaluated all {participants.length} participants. Thank you for your contribution.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingParticipants || isLoadingEvaluations ? (
              <>
                <Card className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
                <Card className="h-64 md:flex items-center justify-center hidden">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
                <Card className="h-64 lg:flex items-center justify-center hidden">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
              </>
            ) : filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant: any) => (
                <Card key={participant.id} className="overflow-hidden bg-white"> {/* Changed background color here */}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                          <span>{participant.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{participant.name}</h3>
                          <p className="text-xs text-slate-500">ID: {participant.participantId}</p>
                        </div>
                      </div>
                      {hasEvaluated(participant.id) ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Evaluated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                          <StarHalf className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-primary">{participant.project}</h4>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {participant.description}
                    </p>
                    <Button 
                      onClick={() => handleEvaluate(participant)}
                      variant={hasEvaluated(participant.id) ? "outline" : "default"}
                      className="w-full"
                    >
                      {hasEvaluated(participant.id) ? (
                        <>
                          <Star className="h-4 w-4 mr-2" /> Edit Evaluation
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" /> Evaluate
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full p-8 text-center bg-white rounded-lg shadow-sm border border-slate-200">
                <p className="text-slate-500">
                  {searchQuery
                    ? "No participants match your search criteria"
                    : "No participants have been added yet"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Evaluation Panel */}
      <EvaluationPanel
        participant={selectedParticipant}
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
      />
    </div>
  );
}