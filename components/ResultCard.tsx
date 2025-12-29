import React from 'react';
import { Copy, Download, Play, FileAudio } from 'lucide-react';
import { ConversionResult } from '../types';

interface ResultCardProps {
  result: ConversionResult;
  onClose?: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onClose }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleCopy = () => {
    if (result.type === 'text') {
      navigator.clipboard.writeText(result.data);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.data;
    link.download = result.filename || `converted.${result.mimeType?.split('/')[1] || 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playAudio = async () => {
      // If it's a data URL, we can play it directly, or we might need to decode if it's raw PCM from Gemini (handled in App mainly, but here generic)
      // Assuming result.data is a playable Blob URL or Data URL for simplicity
      const audio = new Audio(result.data);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      await audio.play();
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{result.label}</h3>
        <div className="flex space-x-2">
          {result.type === 'text' && (
             <button onClick={handleCopy} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Copy">
               <Copy size={16} />
             </button>
          )}
          {(result.type === 'image' || result.type === 'audio' || result.type === 'file') && (
              <button onClick={handleDownload} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Download">
                <Download size={16} />
              </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 rounded p-3 overflow-x-auto">
        {result.type === 'text' && (
          <pre className="text-slate-100 whitespace-pre-wrap font-mono text-sm max-h-60 overflow-y-auto">
            {result.data}
          </pre>
        )}
        
        {result.type === 'image' && (
          <div className="flex justify-center">
            <img src={result.data} alt="Converted" className="max-h-64 rounded border border-slate-700" />
          </div>
        )}

        {result.type === 'audio' && (
           <div className="flex items-center space-x-4">
             <div className="p-4 bg-slate-800 rounded-full border border-slate-600">
                <FileAudio size={24} className="text-indigo-400" />
             </div>
             <div className="flex-1">
                <p className="text-sm text-slate-400 mb-2">Audio generated/converted</p>
                {/* Simple HTML5 Audio Player if supported format */}
                <audio controls src={result.data} className="w-full h-8" />
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;