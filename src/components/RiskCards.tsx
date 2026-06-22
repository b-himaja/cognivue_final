import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface RiskCardsProps {
  highRisk: number;
  mediumRisk: number;
  goodPractices: number;
}

const RiskCards: React.FC<RiskCardsProps> = ({ highRisk, mediumRisk, goodPractices }) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-br from-red-950/60 to-red-900/40 border border-red-700/60 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">High Risk</h3>
        </div>
        <div className="text-3xl font-bold text-red-400 mb-2">{highRisk}</div>
        <p className="text-gray-400 text-sm">Critical dark patterns detected</p>
      </div>

      <div className="bg-gradient-to-br from-yellow-950/60 to-yellow-900/40 border border-yellow-700/60 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-400">Medium Risk</h3>
        </div>
        <div className="text-3xl font-bold text-yellow-400 mb-2">{mediumRisk}</div>
        <p className="text-gray-400 text-sm">Potentially misleading elements</p>
      </div>

      <div className="bg-gradient-to-br from-green-950/60 to-green-900/40 border border-green-700/60 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-lg font-semibold text-green-400">Good Practices</h3>
        </div>
        <div className="text-3xl font-bold text-green-400 mb-2">{goodPractices}</div>
        <p className="text-gray-400 text-sm">Ethical design patterns found</p>
      </div>
    </div>
  );
};

export default RiskCards;