import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartPie, Sliders, History, Star, UserPlus, Cog } from "lucide-react";

export function PerformanceStats() {
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
  });
  
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["/api/participants"],
  });
  
  const { data: judges, isLoading: isLoadingJudges } = useQuery({
    queryKey: ["/api/judges"],
  });
  
  const { data: criteria, isLoading: isLoadingCriteria } = useQuery({
    queryKey: ["/api/criteria"],
  });
  
  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!participants || !judges || !leaderboard) return 0;
    
    const totalEvaluations = participants.length * judges.length;
    // Count evaluations by checking how many participants have been evaluated
    const evaluatedParticipants = leaderboard.length;
    
    return totalEvaluations > 0 
      ? Math.round((evaluatedParticipants / participants.length) * 100) 
      : 0;
  };
  
  if (isLoadingLeaderboard || isLoadingParticipants || isLoadingJudges || isLoadingCriteria) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Overall Statistics</CardTitle>
            <div className="bg-primary/10 text-primary p-1.5 rounded">
              <ChartPie className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Participants</span>
                <span className="font-medium text-slate-800">{participants?.length || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min(100, participants?.length * 5 || 0)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Judges</span>
                <span className="font-medium text-slate-800">{judges?.length || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div 
                  className="h-full bg-secondary rounded-full"
                  style={{ width: `${Math.min(100, judges?.length * 10 || 0)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Evaluations Completed</span>
                <span className="font-medium text-slate-800">{getCompletionPercentage()}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${getCompletionPercentage()}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Criteria Weightage</CardTitle>
            <div className="bg-secondary/10 text-secondary p-1.5 rounded">
              <Sliders className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criteria && criteria.map((criterion: any) => (
              <div key={criterion.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{criterion.name}</span>
                  <span className="font-medium text-slate-800">{criterion.weight}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div 
                    className={`h-full rounded-full ${
                      criterion.name === "Project Design" ? "bg-blue-500" :
                      criterion.name === "Functionality" ? "bg-purple-500" :
                      criterion.name === "Presentation" ? "bg-amber-500" :
                      criterion.name === "Web Design" ? "bg-green-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${criterion.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <div className="bg-amber-100/60 text-amber-800 p-1.5 rounded">
              <History className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard && leaderboard.length > 0 ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Star className="text-blue-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      New evaluation submitted for <span className="font-medium">{leaderboard[0].name}</span>
                    </p>
                    <p className="text-xs text-slate-500">Just now</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="text-green-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      {participants && participants.length > 0 ? (
                        <>New participant <span className="font-medium">{participants[participants.length - 1]?.name}</span> was added</>
                      ) : (
                        <>New participant was added</>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Cog className="text-purple-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      Evaluation criteria weights were updated
                    </p>
                    <p className="text-xs text-slate-500">3 hours ago</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">
                No activity recorded yet. Start by adding participants and having judges submit evaluations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
