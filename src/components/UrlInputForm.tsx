import { useState } from 'react';
import { Search, ClipboardList } from 'lucide-react';

interface UrlInputFormProps {
  onAnalyze: (url: string, text?: string, textOnly?: boolean) => void;
}

const UrlInputForm: React.FC<UrlInputFormProps> = ({ onAnalyze }) => {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'text') {
      if (pastedText.trim()) onAnalyze('text-analysis', pastedText.trim(), true);
    } else {
      if (url.trim()) onAnalyze(url.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-2">Start Your Analysis</h2>
        <p className="text-gray-400 mb-6">
          Scan a website URL, or paste page text directly if the site blocks automated access.
        </p>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'url'
                ? 'bg-red-700 text-white'
                : 'bg-black/40 text-gray-400 hover:text-white border border-red-800/30'
            }`}
          >
            <Search className="w-4 h-4" />
            Analyze URL
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'text'
                ? 'bg-red-700 text-white'
                : 'bg-black/40 text-gray-400 hover:text-white border border-red-800/30'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Paste Text
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'url' ? (
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-black/60 border border-red-800/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                placeholder="https://example.com"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <Search className="w-4 h-4" />
                Analyze
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-400">
                Open the product page in your browser, select all text (Ctrl+A), copy it, and paste below.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                className="w-full bg-black/60 border border-red-800/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 resize-none font-mono text-sm"
                placeholder="Paste the page text here..."
                required
              />
              <button
                type="submit"
                className="self-end bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <ClipboardList className="w-4 h-4" />
                Analyze Text
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

import React from 'react';
export default UrlInputForm;
