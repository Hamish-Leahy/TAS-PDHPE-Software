import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../lib/supabase';

// Add the autotable plugin to the jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Runner {
  id?: number;
  name: string;
  house: string;
  age_group: string;
  finish_time: string | null;
  position: number | null;
  running_time_seconds: number | null;
}

interface Race {
  id: number;
  name: string;
  date: string;
  status: string;
}

const getHouseColor = (house: string): [number, number, number] => {
  const colors: Record<string, [number, number, number]> = {
    'Broughton': [255, 215, 0],    // Yellow
    'Abbott': [0, 32, 91],         // Navy blue
    'Croft': [0, 0, 0],           // Black
    'Tyrell': [128, 0, 0],        // Maroon
    'Green': [220, 20, 60],       // Red
    'Ross': [34, 139, 34]         // Green
  };
  return colors[house] || [128, 128, 128]; // Default gray
};

export const generateResultsPDF = async (race: Race, runners: Runner[]) => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set up document properties
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add header
  doc.setFillColor(0, 51, 102); // Dark blue color
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(22);
  doc.text('TAS Cross Country Results', pageWidth / 2, 15, { align: 'center' });
  
  // Add race information
  doc.setTextColor(0, 0, 0); // Black text
  doc.setFontSize(14);
  doc.text(`Race: ${race.name}`, 14, 40);
  doc.text(`Date: ${new Date(race.date).toLocaleDateString()}`, 14, 48);
  doc.text(`Status: ${race.status.charAt(0).toUpperCase() + race.status.slice(1)}`, 14, 56);
  
  // Sort runners by position
  const sortedRunners = [...runners]
    .filter(r => r.position !== null && r.running_time_seconds !== null)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  
  if (sortedRunners.length === 0) {
    doc.text('No results available for this race.', 14, 70);
    return doc;
  }
  
  // Add podium section for top 3 finishers
  doc.setFontSize(16);
  doc.text('Podium Finishers', pageWidth / 2, 70, { align: 'center' });
  
  // Draw podium boxes with house colors
  if (sortedRunners.length >= 1) {
    const firstPlace = sortedRunners[0];
    const firstPlaceColor = getHouseColor(firstPlace.house);
    
    // 1st place box
    doc.setFillColor(...firstPlaceColor);
    doc.roundedRect(pageWidth / 2 - 40, 80, 80, 40, 3, 3, 'F');
    doc.setTextColor(firstPlaceColor[0] + firstPlaceColor[1] + firstPlaceColor[2] < 380 ? 255 : 0);
    doc.setFontSize(20);
    doc.text('1', pageWidth / 2, 95, { align: 'center' });
    doc.setFontSize(12);
    doc.text(firstPlace.name, pageWidth / 2, 105, { align: 'center' });
    doc.text(formatRunningTime(firstPlace.running_time_seconds), pageWidth / 2, 115, { align: 'center' });
  }
  
  if (sortedRunners.length >= 3) {
    const secondPlace = sortedRunners[1];
    const thirdPlace = sortedRunners[2];
    const secondPlaceColor = getHouseColor(secondPlace.house);
    const thirdPlaceColor = getHouseColor(thirdPlace.house);
    
    // 2nd place box
    doc.setFillColor(...secondPlaceColor);
    doc.roundedRect(pageWidth / 2 - 100, 90, 50, 30, 3, 3, 'F');
    doc.setTextColor(secondPlaceColor[0] + secondPlaceColor[1] + secondPlaceColor[2] < 380 ? 255 : 0);
    doc.setFontSize(16);
    doc.text('2', pageWidth / 2 - 75, 105, { align: 'center' });
    doc.setFontSize(10);
    doc.text(secondPlace.name, pageWidth / 2 - 75, 112, { align: 'center' });
    doc.text(formatRunningTime(secondPlace.running_time_seconds), pageWidth / 2 - 75, 118, { align: 'center' });
    
    // 3rd place box
    doc.setFillColor(...thirdPlaceColor);
    doc.roundedRect(pageWidth / 2 + 50, 90, 50, 30, 3, 3, 'F');
    doc.setTextColor(thirdPlaceColor[0] + thirdPlaceColor[1] + thirdPlaceColor[2] < 380 ? 255 : 0);
    doc.setFontSize(16);
    doc.text('3', pageWidth / 2 + 75, 105, { align: 'center' });
    doc.setFontSize(10);
    doc.text(thirdPlace.name, pageWidth / 2 + 75, 112, { align: 'center' });
    doc.text(formatRunningTime(thirdPlace.running_time_seconds), pageWidth / 2 + 75, 118, { align: 'center' });
  }
  
  // Add full results table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Full Results', 14, 140);
  
  // Create table data
  const tableColumn = ['Position', 'Name', 'House', 'Age Group', 'Time'];
  const tableRows = sortedRunners.map(runner => [
    runner.position,
    runner.name,
    runner.house,
    runner.age_group,
    formatRunningTime(runner.running_time_seconds)
  ]);
  
  // Generate the table
  doc.autoTable({
    startY: 145,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 145 }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `The Armidale School Cross Country - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }
  
  return doc;
};

// Helper function to format running time
const formatRunningTime = (seconds: number | null) => {
  if (seconds === null) return '-';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default generateResultsPDF;