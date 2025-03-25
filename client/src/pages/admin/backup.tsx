import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw, 
  AlertTriangle, 
  Loader2,
  CheckCircle,
  Database
} from "lucide-react";
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

export default function AdminBackup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  if (!user) return null;
  if (user.role !== "admin") {
    return <Redirect to="/judge/evaluate" />;
  }
  
  // Fetch export data
  const { data: exportData, isLoading: isLoadingExport, refetch: refetchExport } = useQuery({
    queryKey: ["/api/export"],
    enabled: true,
  });
  
  // Reset data mutation
  const resetDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reset");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Data reset complete",
        description: "All evaluation data has been reset successfully.",
      });
      // Close the dialog
      setIsResetDialogOpen(false);
      // Refetch the export data
      refetchExport();
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle export to PDF
  const handleExportPDF = () => {
    if (!exportData) return;
    
    toast({
      title: "Export to PDF",
      description: "This would generate a PDF report in a production environment.",
    });
    
    // In a real application, this would use a library like jsPDF to generate a PDF
    // and download it to the user's device
  };
  
  // Handle export to Excel
  const handleExportExcel = () => {
    if (!exportData) return;
    
    toast({
      title: "Export to Excel",
      description: "This would generate an Excel spreadsheet in a production environment.",
    });
    
    // In a real application, this would use a library like xlsx to generate a spreadsheet
    // and download it to the user's device
  };
  
  // Handle data reset
  const handleResetData = () => {
    setIsResetDialogOpen(true);
  };
  
  const confirmReset = () => {
    resetDataMutation.mutate();
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Backup & Reset</h1>
            <p className="text-slate-500">
              Export evaluation data or reset the system
            </p>
          </div>
          
          <Tabs defaultValue="export" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="export">Export Data</TabsTrigger>
              <TabsTrigger value="reset">Reset Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="export">
              <Card>
                <CardHeader>
                  <CardTitle>Export Evaluation Reports</CardTitle>
                  <CardDescription>
                    Download all evaluation data in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingExport ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold mb-2">Data Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                            <p className="text-sm text-blue-700 font-medium mb-1">Participants</p>
                            <p className="text-xl font-bold text-blue-900">
                              {exportData?.participants?.length || 0}
                            </p>
                          </div>
                          <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                            <p className="text-sm text-green-700 font-medium mb-1">Evaluations</p>
                            <p className="text-xl font-bold text-green-900">
                              {exportData?.evaluations?.length || 0}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 border border-purple-100 rounded-md">
                            <p className="text-sm text-purple-700 font-medium mb-1">Criteria</p>
                            <p className="text-xl font-bold text-purple-900">
                              {exportData?.criteria?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex items-center justify-center gap-2"
                          onClick={handleExportPDF}
                          disabled={!exportData}
                        >
                          <FileText className="h-5 w-5 text-red-500" />
                          <div className="text-left">
                            <div className="font-medium">Export as PDF</div>
                            <div className="text-xs text-slate-500">Detailed evaluation report</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex items-center justify-center gap-2"
                          onClick={handleExportExcel}
                          disabled={!exportData}
                        >
                          <FileSpreadsheet className="h-5 w-5 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Export as Excel</div>
                            <div className="text-xs text-slate-500">Raw data in spreadsheet format</div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="default"
                          size="lg"
                          className="flex items-center justify-center gap-2"
                          onClick={() => refetchExport()}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">Refresh Data</div>
                            <div className="text-xs text-slate-300">Get the latest information</div>
                          </div>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reset">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Reset System Data
                  </CardTitle>
                  <CardDescription>
                    This action will delete all evaluation data and cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
                    <h3 className="text-red-800 font-medium mb-2">Warning: Destructive Action</h3>
                    <p className="text-sm text-red-700 mb-2">
                      Resetting the data will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 list-disc pl-5 mb-2 space-y-1">
                      <li>All participant evaluation data</li>
                      <li>All leaderboard information</li>
                      <li>All calculated scores and rankings</li>
                    </ul>
                    <p className="text-sm text-red-700">
                      <strong>User accounts and evaluation criteria settings will be preserved.</strong>
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={handleResetData}
                      disabled={resetDataMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {resetDataMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" /> Reset All Data
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                This action will permanently delete all evaluation data. This cannot be undone.
              </p>
              <p className="font-medium">
                Are you absolutely sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-red-500 hover:bg-red-600"
            >
              {resetDataMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                </>
              ) : (
                "Yes, Reset All Data"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
