import React from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface OverallScoreProps {
  score: number;
}

const OverallScore: React.FC<OverallScoreProps> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score > 3.5) return 'text-green-400';      // Low Risk / Good
    if (score > 2.0) return 'text-yellow-400';     // Medium Risk
    return 'text-red-400';                         // High Risk
  };

  const getScoreIcon = (score: number) => {
    if (score > 3.5) return CheckCircle;           // Good
    if (score > 2.0) return AlertTriangle;         // Medium
    return Shield;                                 // High
  };

  const getScoreLabel = (score: number) => {
    if (score > 3.5) return 'Good';
    if (score > 2.0) return 'Moderate Risk';
    return 'High Risk';
  };

  const ScoreIcon = getScoreIcon(score);

  // ✅ Round to 3 decimal places safely
  const displayScore = Number.isFinite(score)
    ? Number(score.toFixed(3))
    : 0.0;

  return (
    <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/20 border border-gray-700/40 rounded-lg p-8 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Overall Trust Score</h2>
          <p className="text-gray-400">
            Based on detected dark patterns and persuasive language indicators
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(displayScore)} flex items-center gap-3`}>
            <ScoreIcon className="w-10 h-10" />
            {displayScore.toFixed(3)}/5.000
          </div>
          <p className={`text-lg font-medium ${getScoreColor(displayScore)}`}>
            {getScoreLabel(displayScore)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverallScore;
