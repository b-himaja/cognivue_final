import React from 'react';
import { MessageCircle, Zap, Star } from 'lucide-react';

interface PersuasiveLanguageProps {
  language: {
    emotionalWords: string[];
    actionVerbs: string[];
    superlatives: string[];
  };
}

const PersuasiveLanguage: React.FC<PersuasiveLanguageProps> = ({ language }) => {
  const categories = [
    {
      name: 'Emotional Words',
      icon: MessageCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/30 border-blue-700/50',
      words: language.emotionalWords,
      description: 'Words designed to trigger emotional responses'
    },
    {
      name: 'Action Verbs',
      icon: Zap,
      color: 'text-green-400',
      bgColor: 'bg-green-950/30 border-green-700/50',
      words: language.actionVerbs,
      description: 'Strong call-to-action language'
    },
    {
      name: 'Superlatives',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-950/30 border-yellow-700/50',
      words: language.superlatives,
      description: 'Exaggerated claims and extreme language'
    }
  ];

  const hasContent = categories.some(cat => cat.words.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-8">
      <h3 className="text-xl font-semibold mb-6">Persuasive Language Analysis</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          category.words.length > 0 && (
            <div key={index} className={`${category.bgColor} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <category.icon className={`w-4 h-4 ${category.color}`} />
                <h4 className={`font-medium ${category.color}`}>{category.name}</h4>
                <span className="text-xs text-gray-400">({category.words.length})</span>
              </div>
              <p className="text-gray-400 text-xs mb-3">{category.description}</p>
              <div className="flex flex-wrap gap-1">
                {category.words.slice(0, 10).map((word, wordIndex) => (
                  <span
                    key={wordIndex}
                    className="bg-black/20 text-gray-300 px-2 py-1 rounded text-xs"
                  >
                    {word}
                  </span>
                ))}
                {category.words.length > 10 && (
                  <span className="text-gray-500 text-xs px-2 py-1">
                    +{category.words.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default PersuasiveLanguage;