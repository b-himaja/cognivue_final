import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface UrlInputFormProps {
  onAnalyze: (url: string) => void;
}

const UrlInputForm: React.FC<UrlInputFormProps> = ({ onAnalyze }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-2">Start Your Analysis</h2>
        <p className="text-gray-400 mb-6">Enter a website URL to scan for deceptive techniques.</p>
        
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-black/60 border border-red-800/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              placeholder="https://example.com"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Search className="w-4 h-4" />
            Analyze URL
          </button>
        </form>
      </div>
    </div>
  );
};

export default UrlInputForm;