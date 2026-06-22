import React from 'react';
import { AlertTriangle, Clock, Package, MessageSquare, CheckSquare } from 'lucide-react';

interface DarkPatternsProps {
  patterns: string[];
  detectedPatterns?: {
    urgency: string[];
    scarcity: string[];
    confirmShaming: string[];
    defaultOptIns: string[];
  };
}

const DarkPatterns: React.FC<DarkPatternsProps> = ({ detectedPatterns }) => {
  const patternCategories = [
    {
      name: 'Urgency Patterns',
      icon: Clock,
      color: 'text-red-400',
      bgColor: 'bg-red-950/30 border-red-700/50',
      patterns: detectedPatterns?.urgency || [],
      description: 'Time-pressure tactics that rush users into decisions'
    },
    {
      name: 'Scarcity Indicators',
      icon: Package,
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/30 border-orange-700/50',
      patterns: detectedPatterns?.scarcity || [],
      description: 'Artificial scarcity to create fear of missing out'
    },
    {
      name: 'Confirm Shaming',
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/30 border-purple-700/50',
      patterns: detectedPatterns?.confirmShaming || [],
      description: 'Manipulative language in decline options'
    },
    {
      name: 'Default Opt-ins',
      icon: CheckSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/30 border-blue-700/50',
      patterns: detectedPatterns?.defaultOptIns || [],
      description: 'Pre-selected options for subscriptions or marketing'
    }
  ];

  const hasPatterns = patternCategories.some(cat => cat.patterns.length > 0);

  return (
    <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-8">
      {!hasPatterns ? (
        <div className="text-center py-12">
          <div className="text-green-400 text-lg mb-2">✓ No deceptive patterns detected</div>
          <p className="text-gray-400">This website appears to follow ethical design practices.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold">Detected Dark Patterns</h3>
          </div>

          {/* Categorized Patterns */}
          <div className="grid md:grid-cols-2 gap-6">
            {patternCategories.map((category, index) => {
              if (category.patterns.length === 0) return null;

              // Group duplicate patterns by frequency
              const patternFrequency = category.patterns.reduce<Record<string, number>>((acc, pattern) => {
                acc[pattern] = (acc[pattern] || 0) + 1;
                return acc;
              }, {});

              const uniquePatterns = Object.entries(patternFrequency);

              return (
                <div key={index} className={`${category.bgColor} border rounded-lg p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <category.icon className={`w-5 h-5 ${category.color}`} />
                    <h4 className={`font-semibold ${category.color}`}>{category.name}</h4>
                    <span className="text-xs text-gray-400">({category.patterns.length})</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                  <div className="space-y-2">
                    {uniquePatterns.map(([pattern, count], patternIndex) => (
                      <div
                        key={patternIndex}
                        className="bg-black/20 text-gray-300 px-3 py-2 rounded text-sm flex justify-between items-center"
                      >
                        <span>"{pattern}"</span>
                        {count > 1 && (
                          <span className="text-gray-500 text-xs">×{count}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DarkPatterns;
