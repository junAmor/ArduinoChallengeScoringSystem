
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { LeaderboardEntry } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export function TopPerformers() {
  const [animateRankings, setAnimateRankings] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<LeaderboardEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleParticipantClick = (participant: LeaderboardEntry) => {
    setSelectedParticipant(participant);
    setDetailsOpen(true);
  };

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 3000,
  });

  const handleExportPDF = () => {
    const input = document.getElementById("top-performers");
    if (!input) {
      toast({
        title: "Error",
        description: "Content not found",
        variant: "destructive",
      });
      return;
    }

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add a title
      pdf.setFontSize(18);
      pdf.text("Arduino Challenge - Top Performers", 105, 15, { align: 'center' });
      
      // Add the image below the title
      pdf.addImage(imgData, "PNG", 10, 25, imgWidth - 20, imgHeight);
      pdf.save("arduino-challenge-top-performers.pdf");
      toast({
        title: "Export Success", 
        description: "Top performers have been exported as PDF file",
      });
    });
  };

  const handleExportExcel = () => {
    if (!leaderboard || leaderboard.length === 0) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    // Convert data directly instead of using table
    const worksheet = XLSX.utils.json_to_sheet(
      topThree.map(entry => ({
        Rank: entry.rank,
        Name: entry.name,
        ID: entry.participantCode,
        Project: entry.project,
        "Project Design": entry.projectDesign.toFixed(1),
        Functionality: entry.functionality.toFixed(1),
        Presentation: entry.presentation.toFixed(1),
        "Web Design": entry.webDesign.toFixed(1),
        Impact: entry.impact.toFixed(1),
        "Total Score": entry.total.toFixed(1)
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Top Performers");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    
    saveAs(data, "arduino-challenge-top-performers.xlsx");
    toast({
      title: "Export Success",
      description: "Top performers have been exported as Excel file",
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateRankings(true);
      setTimeout(() => setAnimateRankings(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const topThree = leaderboard.slice(0, 3);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Performers</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="default" size="sm" onClick={() => setLocation("/leaderboard/fullscreen")}>
              View Full
            </Button>
          </div>
        </div>

        <div id="top-performers" className="space-y-4">
          <AnimatePresence>
            {topThree.map((entry: LeaderboardEntry, index: number) => (
              <motion.div
                key={entry.participantId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1.2 }}
                onClick={() => handleParticipantClick(entry)}
                className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-slate-50 cursor-pointer"
                whileHover={{ 
                  backgroundColor: "rgba(241, 245, 249, 0.6)",
                  scale: 1.01 
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    index === 0 ? "bg-yellow-500" :
                    index === 1 ? "bg-blue-300" :
                    "bg-amber-600"
                  }`}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-muted-foreground max-w-[200px] truncate" title={entry.project}>{entry.project}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xl font-bold text-primary">{entry.total.toFixed(1)}</div>
                  <Info className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Participant Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              {selectedParticipant && (
                <>
                  {selectedParticipant.rank <= 3 ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedParticipant.rank === 1 ? "bg-yellow-500" :
                      selectedParticipant.rank === 2 ? "bg-gray-300" :
                      "bg-amber-600"
                    }`}>
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                      {selectedParticipant.rank}
                    </div>
                  )}
                  <div>
                    <span className="text-xl">{selectedParticipant.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">({selectedParticipant.participantCode})</span>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedParticipant && (
                <div className="mt-2">
                  <h3 className="text-lg font-semibold mb-1">Project</h3>
                  <p className="text-base mb-4">{selectedParticipant.project}</p>
                  
                  <h3 className="text-lg font-semibold mb-2">Evaluation Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Project Design</span>
                          <span className="text-sm font-bold">{selectedParticipant.projectDesign.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              selectedParticipant.projectDesign >= 90 ? "bg-green-500" :
                              selectedParticipant.projectDesign >= 70 ? "bg-blue-500" :
                              selectedParticipant.projectDesign >= 50 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`} 
                            style={{ width: `${selectedParticipant.projectDesign}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Functionality</span>
                          <span className="text-sm font-bold">{selectedParticipant.functionality.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              selectedParticipant.functionality >= 90 ? "bg-green-500" :
                              selectedParticipant.functionality >= 70 ? "bg-blue-500" :
                              selectedParticipant.functionality >= 50 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`} 
                            style={{ width: `${selectedParticipant.functionality}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Presentation</span>
                          <span className="text-sm font-bold">{selectedParticipant.presentation.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              selectedParticipant.presentation >= 90 ? "bg-green-500" :
                              selectedParticipant.presentation >= 70 ? "bg-blue-500" :
                              selectedParticipant.presentation >= 50 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`} 
                            style={{ width: `${selectedParticipant.presentation}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Web Design</span>
                          <span className="text-sm font-bold">{selectedParticipant.webDesign.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              selectedParticipant.webDesign >= 90 ? "bg-green-500" :
                              selectedParticipant.webDesign >= 70 ? "bg-blue-500" :
                              selectedParticipant.webDesign >= 50 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`} 
                            style={{ width: `${selectedParticipant.webDesign}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Impact</span>
                          <span className="text-sm font-bold">{selectedParticipant.impact.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              selectedParticipant.impact >= 90 ? "bg-green-500" :
                              selectedParticipant.impact >= 70 ? "bg-blue-500" :
                              selectedParticipant.impact >= 50 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`} 
                            style={{ width: `${selectedParticipant.impact}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="pt-6">
                        <div className="flex justify-between mb-1">
                          <span className="text-lg font-bold">Total Score</span>
                          <span className="text-lg font-bold text-primary">{selectedParticipant.total.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
