import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PatternScoresProps {
  scores: {
    name: string;
    score: number;
    maxScore: number;
  }[];
}

const PatternScores: React.FC<PatternScoresProps> = ({ scores }) => {
  return (
    <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-semibold">Pattern Analysis</h3>
      </div>
      
      <div className="space-y-4">
        {scores.map((pattern, index) => {
          const percentage = (pattern.score / pattern.maxScore) * 100;
          const safeWidth = Math.min(percentage, 100); // ✅ clamp to 100%
          
          const getColor = (score: number) => {
            if (score < 30) return 'bg-green-600';
            if (score < 60) return 'bg-yellow-600';
            return 'bg-red-600';
          };
          
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">{pattern.name}</span>
                <span className="text-sm text-gray-400">
                  {pattern.score}/{pattern.maxScore}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getColor(percentage)}`}
                  style={{ width: `${safeWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatternScores;
