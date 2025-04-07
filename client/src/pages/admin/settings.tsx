import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { updateSettingsSchema } from "@shared/schema";
import { z } from "zod";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for criteria weights
  const [weights, setWeights] = useState([
    { id: 1, name: "Project Design", weight: 25, description: "Evaluate the overall design quality, aesthetics, and structure of the project" },
    { id: 2, name: "Functionality", weight: 30, description: "Rate how well the project works and fulfills its intended purpose" },
    { id: 3, name: "Presentation", weight: 15, description: "Evaluate the quality of the project presentation and documentation" },
    { id: 4, name: "Web Design", weight: 15, description: "Rate the quality of any web interfaces or web components of the project" },
    { id: 5, name: "Impact", weight: 15, description: "Evaluate the potential social, environmental, or economic impact of the project" }
  ]);
  
  // State for system settings
  const [systemSettings, setSystemSettings] = useState({
    allowEditEvaluations: true,
    showScoresToParticipants: false,
    requireComments: true,
    autoLogout: false
  });
  
  // Calculate total weight (should equal 100%)
  const totalWeight = weights.reduce((sum, criterion) => sum + criterion.weight, 0);
  
  if (!user) return null;
  if (user.role !== "admin") {
    return <Redirect to="/judge/evaluate" />;
  }
  
  // Fetch criteria and settings
  const { data: criteria, isLoading: isLoadingCriteria } = useQuery({
    queryKey: ["/api/criteria"],
  });
  
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
  });
  
  // Update state when data is loaded
  useEffect(() => {
    if (criteria) {
      setWeights(criteria);
    }
  }, [criteria]);
  
  useEffect(() => {
    if (settings) {
      setSystemSettings(settings);
    }
  }, [settings]);
  
  // Update criteria mutation
  const updateCriteriaMutation = useMutation({
    mutationFn: async (criteriaData: any[]) => {
      const res = await apiRequest("PUT", "/api/criteria", criteriaData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criteria"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({
        title: "Criteria updated",
        description: "Evaluation criteria weights have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update criteria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: z.infer<typeof updateSettingsSchema>) => {
      const res = await apiRequest("PUT", "/api/settings", settingsData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "System settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle weight change
  const handleWeightChange = (id: number, newWeight: number) => {
    const updatedWeights = weights.map(criterion => {
      if (criterion.id === id) {
        return { ...criterion, weight: newWeight };
      }
      return criterion;
    });
    setWeights(updatedWeights);
  };
  
  // Handle settings toggle
  const handleSettingToggle = (setting: keyof typeof systemSettings) => {
    setSystemSettings({
      ...systemSettings,
      [setting]: !systemSettings[setting]
    });
  };
  
  // Save all settings
  const saveAllSettings = () => {
    // Check if weights sum to 100%
    if (Math.abs(totalWeight - 100) > 0.001) {
      toast({
        title: "Invalid weights",
        description: "The total weight must equal 100%.",
        variant: "destructive",
      });
      return;
    }
    
    // Save criteria weights
    updateCriteriaMutation.mutate(weights);
    
    // Save system settings
    updateSettingsMutation.mutate(systemSettings);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Settings</h1>
            <p className="text-slate-500">
              Configure evaluation criteria and system preferences
            </p>
          </div>
          
          <div className="grid gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Criteria Weights</CardTitle>
                <CardDescription>
                  Adjust the importance of each evaluation criteria. The weights must total 100%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {weights.map((criterion) => (
                    <div key={criterion.id}>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium text-slate-700">{criterion.name}</Label>
                        <span className="text-sm font-semibold text-primary">{criterion.weight}%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-slate-500 w-6">0%</span>
                        <Slider
                          defaultValue={[criterion.weight]}
                          min={0}
                          max={100}
                          step={5}
                          value={[criterion.weight]}
                          onValueChange={(values) => handleWeightChange(criterion.id, values[0])}
                          className="mx-2"
                        />
                        <span className="text-xs text-slate-500 w-6">100%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{criterion.description}</p>
                    </div>
                  ))}
                  
                  <div className={`flex items-center justify-between py-2 px-4 rounded-md ${
                    Math.abs(totalWeight - 100) < 0.001 
                      ? "bg-blue-50 border border-blue-200" 
                      : "bg-red-50 border border-red-200"
                  }`}>
                    <span className={`text-sm ${
                      Math.abs(totalWeight - 100) < 0.001 
                        ? "text-blue-800" 
                        : "text-red-800"
                    }`}>
                      Total Weight:
                    </span>
                    <span className={`font-semibold ${
                      Math.abs(totalWeight - 100) < 0.001 
                        ? "text-blue-800" 
                        : "text-red-800"
                    }`}>
                      {totalWeight}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>
                  Configure general system settings and behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Allow Judges to Edit Evaluations</Label>
                      <p className="text-xs text-slate-500 mt-1">When enabled, judges can modify their evaluations after submission</p>
                    </div>
                    <Switch 
                      checked={systemSettings.allowEditEvaluations}
                      onCheckedChange={() => handleSettingToggle('allowEditEvaluations')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Show Scores to Participants</Label>
                      <p className="text-xs text-slate-500 mt-1">When enabled, participants can view their scores</p>
                    </div>
                    <Switch 
                      checked={systemSettings.showScoresToParticipants}
                      onCheckedChange={() => handleSettingToggle('showScoresToParticipants')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Require Comments from Judges</Label>
                      <p className="text-xs text-slate-500 mt-1">When enabled, judges must provide comments with their evaluations</p>
                    </div>
                    <Switch 
                      checked={systemSettings.requireComments}
                      onCheckedChange={() => handleSettingToggle('requireComments')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Auto-logout After Inactivity (30 min)</Label>
                      <p className="text-xs text-slate-500 mt-1">When enabled, users will be logged out after 30 minutes of inactivity</p>
                    </div>
                    <Switch 
                      checked={systemSettings.autoLogout}
                      onCheckedChange={() => handleSettingToggle('autoLogout')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={saveAllSettings}
              className="gap-2"
              disabled={updateCriteriaMutation.isPending || updateSettingsMutation.isPending || Math.abs(totalWeight - 100) > 0.001}
            >
              {(updateCriteriaMutation.isPending || updateSettingsMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
