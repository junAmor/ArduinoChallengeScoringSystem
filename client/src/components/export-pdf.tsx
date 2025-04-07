
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "@/components/ui/toast";
import { LeaderboardEntry } from "@shared/schema";

export const exportLeaderboardPDF = (leaderboard: LeaderboardEntry[]) => {
  const doc = new jsPDF("landscape", "mm", "a4");

  // Document Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("Arduino Innovation Challenge", 148, 20, { align: "center" });

  // Event Information
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Official Leaderboard Report", 148, 30, { align: "center" });
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148, 38, { align: "center" });

  // Table Headers and Data
  const headers = [
    ["RANK", "TEAM NAME", "PROJECT TITLE", "PD", "FN", "PR.", "WD", "IM", "SCORE"]
  ];

  const rows = leaderboard.map(entry => [
    entry.rank.toString(),
    entry.name,
    entry.project,
    entry.projectDesign.toFixed(1),
    entry.functionality.toFixed(1),
    entry.presentation.toFixed(1),
    entry.webDesign.toFixed(1),
    entry.impact.toFixed(1),
    entry.total.toFixed(1)
  ]);

  // Add table
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 45,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [41, 37, 96],
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 60 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 20, halign: "center" },
      8: { cellWidth: 25, halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - Arduino Innovation Challenge ${new Date().getFullYear()}`,
      148,
      200,
      { align: "center" }
    );
  }

  try {
    doc.save("arduino-challenge-report.pdf");
    toast({
      title: "Export Successful",
      description: "Report has been generated and downloaded",
    });
  } catch (error) {
    toast({
      title: "Export Failed",
      description: "Failed to generate report. Please try again.",
      variant: "destructive",
    });
  }
};
