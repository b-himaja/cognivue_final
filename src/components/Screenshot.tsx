import React from 'react';
import { Camera, ExternalLink } from 'lucide-react';

interface ScreenshotProps {
  screenshot?: string;
  url: string;
}

const Screenshot: React.FC<ScreenshotProps> = ({ screenshot, url }) => {
  const screenshotUrl = screenshot ? `http://localhost:3001/screenshots/${screenshot}` : null;

  return (
    <div className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-800/40 rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-red-400" />
          <h3 className="text-xl font-semibold">Website Screenshot</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Visit Site
        </a>
      </div>

      {screenshotUrl ? (
        <div className="border border-red-800/40 rounded-lg overflow-hidden">
          <img
            src={screenshotUrl}
            alt="Website screenshot"
            className="w-full h-auto max-h-[800px] object-contain bg-white"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden text-center py-12 text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Screenshot could not be loaded</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No screenshot available</p>
        </div>
      )}
    </div>
  );
};

export default Screenshot;