import { useState } from 'react';
import { Eye, AlertCircle } from 'lucide-react';
import UrlInputForm from './components/UrlInputForm';
import Results from './components/Results';
import { analyzeWebsite, AnalysisResponse } from './services/api';

export interface AnalysisResult {
  url: string;
  title?: string;
  screenshot?: string;
  overallScore: number;
  highRisk: number;
  mediumRisk: number;
  goodPractices: number;
  patternScores: {
    name: string;
    score: number;
    maxScore: number;
  }[];
  keyInsights: string[];
  darkPatterns: string[];
  detectedPatterns?: {
    urgency: string[];
    scarcity: string[];
    confirmShaming: string[];
    defaultOptIns: string[];
  };
  persuasiveLanguage?: {
    emotionalWords: string[];
    actionVerbs: string[];
    superlatives: string[];
  };
}

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (url: string, text?: string, textOnly?: boolean) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response: AnalysisResponse = await analyzeWebsite(url, text, textOnly);

      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Analysis failed');
      }

      const data = response.data;
      
      // Transform API response to match our interface
      const result: AnalysisResult = {
        url: data.url,
        title: data.title,
        screenshot: data.screenshot,
        overallScore: data.overallScore,
        highRisk: data.riskLevel === 'high' ? 1 : 0,
        mediumRisk: data.riskLevel === 'medium' ? 1 : 0,
        goodPractices: data.riskLevel === 'low' ? 1 : 0,
        patternScores: [
          { name: "Urgency Patterns", score: data.patternScores.urgency, maxScore: 100 },
          { name: "Scarcity Indicators", score: data.patternScores.scarcity, maxScore: 100 },
          { name: "Confirm Shaming", score: data.patternScores.confirmShaming, maxScore: 100 },
          { name: "Default Opt-ins", score: data.patternScores.defaultOptIns, maxScore: 100 }
        ],
        keyInsights: data.insights,
        darkPatterns: [
          ...data.darkPatterns.urgency,
          ...data.darkPatterns.scarcity,
          ...data.darkPatterns.confirmShaming,
          ...data.darkPatterns.defaultOptIns
        ],
        detectedPatterns: data.darkPatterns,
        persuasiveLanguage: data.persuasiveLanguage
      };
      
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBackToSearch = () => {
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Eye className="w-10 h-10 text-red-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Cognivue
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Uncover deceptive design patterns and manipulative techniques used by websites
          </p>
        </header>

        {!analysisResult && !isAnalyzing && !error && (
          <UrlInputForm onAnalyze={handleAnalyze} />
        )}

        {isAnalyzing && (
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-12">
              <div className="animate-spin w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-semibold mb-4">Analyzing Website...</h2>
              <p className="text-gray-400">Scraping content and analyzing for dark patterns...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-950/60 to-red-900/40 border border-red-700/60 rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-semibold text-red-400">Analysis Failed</h2>
              </div>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={handleBackToSearch}
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {analysisResult && (
          <Results result={analysisResult} onBackToSearch={handleBackToSearch} />
        )}
      </div>
    </div>
  );
}

export default App;