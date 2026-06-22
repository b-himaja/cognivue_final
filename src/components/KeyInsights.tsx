import React from 'react';
import { Lightbulb } from 'lucide-react';

interface KeyInsightsProps {
  insights: string[];
}

const KeyInsights: React.FC<KeyInsightsProps> = ({ insights }) => {
  return (
    <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold">Key Insights</h3>
      </div>
      
      {insights.length === 0 ? (
        <p className="text-gray-400 italic">No specific insights detected.</p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-300 text-sm">{insight}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeyInsights;