import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AnalysisResult } from '../App';
import OverallScore from './OverallScore';
import RiskCards from './RiskCards';
import PatternScores from './PatternScores';
import KeyInsights from './KeyInsights';
import DarkPatterns from './DarkPatterns';
import PersuasiveLanguage from './PersuasiveLanguage';
import jsPDF from 'jspdf';


interface ResultsProps {
  result: AnalysisResult;
  onBackToSearch: () => void;
}

const Results: React.FC<ResultsProps> = ({ result, onBackToSearch }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'language'>('overview');

  const handleDownloadJSON = () => {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis_result_${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleDownloadPDF = () => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  let y = 20;
  const lineHeight = 8;

  const addText = (text: string, x = 10, maxWidth = 180) => {
    const lines = pdf.splitTextToSize(String(text), maxWidth);
    if (y + lines.length * lineHeight > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(lines, x, y);
    y += lines.length * lineHeight;
  };

  // === COVER PAGE ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Dark Pattern & Trustworthiness Analysis Report', 10, y);
  y += 15;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(12);
  addText('An automated report generated using the Ethical Design Detection Framework.');
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  addText(`Generated on: ${new Date().toLocaleString()}`);
  addText(`Website / Page: ${result.title || result.url}`);
  y += 10;

  pdf.setDrawColor(200, 0, 0);
  pdf.line(10, y, 200, y);
  y += 8;

  // === OVERALL TRUST SCORE ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('1. Overall Trust Score', 10, y);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  addText(`The overall trustworthiness score assigned to this page is:`);
  y += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 20, 60);
  pdf.text(`${result.overallScore.toFixed(2)} / 100`, 10, y);
  pdf.setTextColor(0, 0, 0);
  y += 12;

  addText(
    'This score reflects the combined assessment of interface transparency, ' +
      'ethical design patterns, and persuasive communication tendencies.'
  );
  y += 10;

  pdf.setDrawColor(200, 0, 0);
  pdf.line(10, y, 200, y);
  y += 10;

  // === OVERVIEW SECTION ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('2. Overview of Risk & Design Practices', 10, y);
  y += 10;

pdf.setFont('helvetica', 'normal');
pdf.setFontSize(12);

// Safely normalize each field to a string
const formatList = (data: any): string => {
  if (Array.isArray(data)) return data.join(', ');
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') return Object.values(data).join(', ');
  return 'None detected';
};

addText(`High-Risk Elements: ${formatList(result.highRisk)}`);
addText(`Medium-Risk Elements: ${formatList(result.mediumRisk)}`);
addText(`Good Practices Observed: ${formatList(result.goodPractices)}`);

  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Pattern Analysis:', 10, y);
  pdf.setFont('helvetica', 'normal');
  y += lineHeight;

  (result.patternScores || []).forEach((p) => {
    addText(`• ${p.name}: ${p.score} / ${p.maxScore}`);
  });

  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Insights:', 10, y);
  pdf.setFont('helvetica', 'normal');
  y += lineHeight;
  (result.keyInsights || []).forEach((insight) => addText(`- ${insight}`));

  y += 10;
  pdf.setDrawColor(200, 0, 0);
  pdf.line(10, y, 200, y);
  y += 10;

  // === DARK PATTERNS SECTION ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('3. Detected Dark Patterns', 10, y);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  const detected = result.detectedPatterns || {};
  const categories = Object.entries(detected);

  if (categories.length > 0) {
    categories.forEach(([category, patterns]) => {
      const list = Array.isArray(patterns) ? patterns : [];
      if (list.length === 0) return;

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text(`${category.replace(/([A-Z])/g, ' $1')}:`, 10, y);
      pdf.setFont('helvetica', 'normal');
      y += lineHeight;

      const freqMap = list.reduce<Record<string, number>>((map, term) => {
        const t = String(term).trim();
        map[t] = (map[t] || 0) + 1;
        return map;
      }, {});

      Object.entries(freqMap).forEach(([term, count]) => addText(`- "${term}" (x${count})`));
      y += lineHeight;
    });
  } else {
    addText('No dark patterns detected on this page.');
  }

  y += 10;
  pdf.setDrawColor(200, 0, 0);
  pdf.line(10, y, 200, y);
  y += 10;

  // === PERSUASIVE LANGUAGE SECTION ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('4. Persuasive Language Analysis', 10, y);
  y += 10;

  const pl = result.persuasiveLanguage;
  if (
    pl &&
    (
      (Array.isArray(pl.emotionalWords) && pl.emotionalWords.length > 0) ||
      (Array.isArray(pl.actionVerbs) && pl.actionVerbs.length > 0) ||
      (Array.isArray(pl.superlatives) && pl.superlatives.length > 0)
    )
  ) {
    const categories = Object.entries(pl);
    categories.forEach(([category, phrases]) => {
      const phraseList = Array.isArray(phrases) ? phrases : [];
      if (phraseList.length === 0) return;

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text(`${category.replace(/([A-Z])/g, ' $1')}:`, 10, y);
      pdf.setFont('helvetica', 'normal');
      y += lineHeight;

      phraseList.forEach((phrase) => addText(`• ${String(phrase)}`));
      y += lineHeight;
    });
  } else {
    addText('No persuasive or manipulative language detected.');
  }

  y += 10;
  pdf.setDrawColor(200, 0, 0);
  pdf.line(10, y, 200, y);
  y += 10;

  // === SUMMARY ===
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('5. Summary & Recommendations', 10, y);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  addText(
    'This report provides an interpretive assessment of the given web interface. ' +
      'The analysis highlights areas where persuasive or deceptive design patterns ' +
      'might affect user autonomy and transparency. It is recommended that all ' +
      'high-risk elements be reviewed for compliance with ethical UX standards.'
  );

  pdf.save(`DarkPattern_Report_${new Date().toISOString()}.pdf`);
};



  return (
    <div className="results-container max-w-6xl mx-auto">

      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={onBackToSearch}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </button>
        <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-6">
<div className="flex justify-between items-center mb-2">
  <h2 className="text-xl font-semibold">Analysis Complete</h2>
  <div className="flex gap-2">
    <button
      onClick={handleDownloadJSON}
      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
    >
      Download JSON
    </button>
    <button
      onClick={handleDownloadPDF}
      className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
    >
      Download PDF
    </button>
  </div>
</div>

<p className="text-gray-400">
  Results for: <span className="text-white">{result.title || result.url}</span>
</p>

        </div>
      </div>

      {/* Overall Score (keep backend value) */}
      <OverallScore score={result.overallScore} />

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-red-800/40">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-red-600 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'patterns'
                  ? 'border-red-600 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Dark Patterns
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'language'
                  ? 'border-red-600 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Persuasive Language
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <RiskCards
            highRisk={result.highRisk}
            mediumRisk={result.mediumRisk}
            goodPractices={result.goodPractices}
          />
          <div className="grid md:grid-cols-2 gap-8">
            <PatternScores scores={result.patternScores} />
            <KeyInsights insights={result.keyInsights} />
          </div>
          {/* ✅ Removed PersuasiveLanguage box from below Pattern Analysis */}
        </div>
      )}

      {activeTab === 'patterns' && (
        <DarkPatterns 
          patterns={result.darkPatterns}
          detectedPatterns={result.detectedPatterns}
        />
      )}

      {activeTab === 'language' && (
        <PersuasiveLanguage language={result.persuasiveLanguage!} />
      )}
    </div>
  );
};

export default Results;
