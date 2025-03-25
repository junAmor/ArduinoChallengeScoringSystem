import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LeaderboardEntry } from "@shared/schema";
import { Download, Filter, Maximize2, X, Info, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import the autoTable library
import { toast } from "@/components/ui/toast";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardProps {
  onExport?: () => void;
}

export function Leaderboard({ onExport }: LeaderboardProps) {
  const { data: leaderboard, isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const [selectedParticipant, setSelectedParticipant] = useState<LeaderboardEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show 10 participants per page

  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard
    ? leaderboard.filter(entry =>
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.participantCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Paginate the filtered results
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeaderboard.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRowClick = (participant: LeaderboardEntry) => {
    setSelectedParticipant(participant);
    setDetailsOpen(true);
  };

  const handleExportPDF = () => {
    if (!leaderboard || leaderboard.length === 0) {
      toast({
        title: "Export Failed",
        description: "No leaderboard data available",
        variant: "destructive",
      });
      return;
    }
    exportLeaderboardPDF(leaderboard);
  };
  const exportLeaderboardPDF = (leaderboard: LeaderboardEntry[]) => {
    const doc = new jsPDF(); // Create a new jsPDF instance here

    // Set font to bold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    // Calculate center position
    const pageWidth = doc.internal.pageSize.getWidth();
    const text = "ARDUINO INNOVATOR CHALLENGE REPORT";
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;

    // Add centered bold text
    doc.text(text, x, 10);
    const header = ["Rank", "Participant", "Project Title", "Project Design", "Functionality", "Presentation", "Web Design", "Impact", "Total Score"];
    doc.setFontSize(12);
    autoTable(doc, {
      head: [header],
      body: leaderboard.map(entry => [
        entry.rank,
        entry.name,
        entry.project,
        entry.projectDesign.toFixed(1),
        entry.functionality.toFixed(1),
        entry.presentation.toFixed(1),
        entry.webDesign.toFixed(1),
        entry.impact.toFixed(1),
        entry.total.toFixed(1)
      ]),
      theme: 'grid',
      startY: 20
    });
    doc.save("arduino-challenge-leaderboard.pdf");
    toast({
      title: "Export Success",
      description: "Leaderboard has been exported as a PDF file",
    });
  };


  const handleExportExcel = () => {
    if (!leaderboard || leaderboard.length === 0) {
      toast({
        title: "Error",
        description: "No leaderboard data to export",
        variant: "destructive",
      });
      return;
    }

    // Convert data directly instead of using table
    const worksheet = XLSX.utils.json_to_sheet(
      leaderboard.map(entry => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });

    saveAs(data, "arduino-challenge-leaderboard.xlsx");
    toast({
      title: "Export Success",
      description: "Leaderboard has been exported as an Excel file",
    });
  };

  const handleFullScreen = () => {
    if (tableRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        tableRef.current.requestFullscreen();
      }
    }
  };

  // Function to get progress bar color based on score (1-100 scale)
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Function to get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-cyan-500"; // cyan
    if (rank === 2) return "bg-yellow-400"; // yellow
    if (rank === 3) return "bg-orange-450"; // orange
    return "bg-gray-300";
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Current Rankings</h3>
            <p className="text-sm text-slate-500">Updated in real-time as judges submit evaluations</p>
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-12 flex justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading leaderboard: {error.message}</div>;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Current Rankings</h3>
          <p className="text-sm text-slate-500">Updated in real-time as judges submit evaluations</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={handleFullScreen}>
            <Maximize2 className="h-4 w-4 mr-1.5" />
            Fullscreen
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* Search input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, project, or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={tableRef} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div id="leaderboard-table" className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Participant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Design</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Functionality</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Presentation</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Web Design</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Impact of the Project</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredLeaderboard.length === 0 && searchQuery ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No results found for "{searchQuery}". Try a different search term.
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((entry) => (
                  <motion.tr 
                    key={entry.participantId} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleRowClick(entry)}
                    whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.5)" }}
                    transition={{ duration: 1.2 }}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold ${getRankBadgeColor(entry.rank)}`}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                          <span>{entry.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-800">{entry.name}</div>
                          <div className="text-xs text-slate-500">ID: {entry.participantCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-800 max-w-[150px] truncate" title={entry.project}>
                        {entry.project}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-800">{entry.projectDesign.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-800">{entry.functionality.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-800">{entry.presentation.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-800">{entry.webDesign.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-800">{entry.impact.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-bold text-primary text-lg">{entry.total.toFixed(1)}</div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No evaluation data available yet. Judges need to submit evaluations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredLeaderboard.length > 0 && (
          <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-200">
            <div className="text-sm text-slate-500">
              {filteredLeaderboard.length > itemsPerPage ? (
                <>
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {indexOfLastItem > filteredLeaderboard.length ? filteredLeaderboard.length : indexOfLastItem}
                  </span>{" "}
                  of <span className="font-medium">{filteredLeaderboard.length}</span> participants
                </>
              ) : (
                <>
                  Showing <span className="font-medium">{filteredLeaderboard.length}</span> participants
                  {searchQuery && <> (filtered from {leaderboard?.length || 0} total)</>}
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center px-2">
                <span className="text-sm font-medium text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Participant Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              {selectedParticipant && (
                <>
                  <div className="flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full ${getRankBadgeColor(selectedParticipant.rank)} flex items-center justify-center text-white font-bold`}>
                      {selectedParticipant.rank}
                    </div>
                  </div>
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
                            className={`h-full ${getScoreColor(selectedParticipant.projectDesign)}`} 
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
                            className={`h-full ${getScoreColor(selectedParticipant.functionality)}`} 
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
                            className={`h-full ${getScoreColor(selectedParticipant.presentation)}`} 
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
                            className={`h-full ${getScoreColor(selectedParticipant.webDesign)}`} 
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
                            className={`h-full ${getScoreColor(selectedParticipant.impact)}`} 
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

                  {/* Judge Comments Section */}
                  {selectedParticipant.comments && selectedParticipant.comments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Judge Comments</h3>
                      <div className="space-y-3">
                        {selectedParticipant.comments.map((comment, index) => (
                          <div key={index} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                            <div className="flex items-center mb-1">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white mr-2 text-xs">
                                {comment.judgeName ? comment.judgeName.charAt(0) : "J"}
                              </div>
                              <span className="text-sm font-medium">{comment.judgeName || "Judge"}</span>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-line">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
    </div>
  );
}