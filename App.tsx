import React, { useState } from 'react';
import { ConversionMode, ConversionResult, TextAlgorithm, ImageFormat } from './types';
import { convertText, convertImage, convertAudioToWav } from './utils/converters';
import ResultCard from './components/ResultCard';
import { Type, FileText, Image as ImageIcon, Music, ArrowRightLeft, Loader2, Mic } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<ConversionMode>(ConversionMode.TEXT);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
  
  // Text State
  const [textInput, setTextInput] = useState('');
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // --- Handlers ---

  const handleTextConversion = (algo: TextAlgorithm) => {
    if (!textInput) return;
    const res = convertText(textInput, algo);
    setResults(prev => [{ type: 'text', data: res, label: `Text to ${algo}` }, ...prev]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResults([]); // Clear previous results on new upload
    }
  };

  const handleImageConversion = async (format: ImageFormat) => {
    if (!imageFile) return;
    setIsLoading(true);
    try {
      const dataUrl = await convertImage(imageFile, format);
      const ext = format.split('/')[1] === 'x-icon' ? 'ico' : format.split('/')[1];
      setResults(prev => [{
        type: 'image',
        data: dataUrl,
        label: `Converted to ${ext.toUpperCase()}`,
        filename: `converted.${ext}`,
        mimeType: format
      }, ...prev]);
    } catch (e) {
      alert("Conversion Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setAudioFile(e.target.files[0]);
          setResults([]);
      }
  }

  const handleAudioConvertWav = async () => {
      if (!audioFile) return;
      setIsLoading(true);
      try {
          const blob = await convertAudioToWav(audioFile);
          const url = URL.createObjectURL(blob);
          setResults(prev => [{
              type: 'audio',
              data: url,
              label: 'Converted to WAV',
              filename: 'converted.wav',
              mimeType: 'audio/wav'
          }, ...prev]);
      } catch (e) {
          alert("Audio Conversion Error. Format might not be supported by browser decoder.");
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 text-transparent bg-clip-text mb-2">
          OmniFormat
        </h1>
        <p className="text-slate-400">Universal Converter</p>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-24 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start pt-2 md:pt-6 pb-2">
          <NavButton 
            active={mode === ConversionMode.TEXT} 
            onClick={() => setMode(ConversionMode.TEXT)} 
            icon={<Type size={24} />} 
            label="Text" 
          />
          <NavButton 
            active={mode === ConversionMode.IMAGE} 
            onClick={() => setMode(ConversionMode.IMAGE)} 
            icon={<ImageIcon size={24} />} 
            label="Image" 
          />
          <NavButton 
            active={mode === ConversionMode.AUDIO} 
            onClick={() => setMode(ConversionMode.AUDIO)} 
            icon={<Music size={24} />} 
            label="Audio" 
          />
        </nav>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          
          {/* Input Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white flex items-center gap-2">
              {mode === ConversionMode.TEXT && <><FileText className="text-cyan-400"/> Text Input</>}
              {mode === ConversionMode.IMAGE && <><ImageIcon className="text-pink-400"/> Image Input</>}
              {mode === ConversionMode.AUDIO && <><Music className="text-violet-400"/> Audio Input</>}
            </h2>

            {mode === ConversionMode.TEXT && (
              <textarea
                className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all resize-none"
                placeholder="Enter text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            )}

            {mode === ConversionMode.IMAGE && (
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-pink-500 transition-colors bg-slate-800/50">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img-upload" />
                <label htmlFor="img-upload" className="cursor-pointer flex flex-col items-center">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-40 mb-4 rounded shadow-lg object-contain" />
                    ) : (
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                           <ImageIcon size={32} />
                        </div>
                    )}
                  <span className="text-slate-300 font-medium">Click to upload image</span>
                  <span className="text-slate-500 text-sm mt-1">JPG, PNG, WEBP supported</span>
                </label>
              </div>
            )}

             {mode === ConversionMode.AUDIO && (
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-violet-500 transition-colors bg-slate-800/50">
                <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" id="audio-upload" />
                <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center">
                    {audioFile ? (
                        <div className="flex items-center gap-3 text-violet-300 bg-violet-900/30 px-4 py-2 rounded-full mb-2">
                            <Music size={20} />
                            {audioFile.name}
                        </div>
                    ) : (
                         <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                           <Mic size={32} />
                        </div>
                    )}
                  <span className="text-slate-300 font-medium">{audioFile ? "Change File" : "Click to upload audio"}</span>
                </label>
              </div>
            )}
          </div>

          {/* Actions / Tools Section */}
          <div className="mb-8">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                 Available Tools
             </h3>
             
             <div className="flex flex-wrap gap-3">
                 {/* Text Tools */}
                 {mode === ConversionMode.TEXT && (
                     <>
                        <ActionButton onClick={() => handleTextConversion('BINARY')} label="Binary" icon={<ArrowRightLeft size={16}/>} />
                        <ActionButton onClick={() => handleTextConversion('HEX')} label="Hexadecimal" />
                        <ActionButton onClick={() => handleTextConversion('MORSE')} label="Morse Code" />
                        <ActionButton onClick={() => handleTextConversion('DUODECIMAL')} label="Duodecimal" />
                        <ActionButton onClick={() => handleTextConversion('BASE64')} label="Base64" />
                        <ActionButton onClick={() => handleTextConversion('REVERSE')} label="Reverse" />
                     </>
                 )}

                 {/* Image Tools */}
                 {mode === ConversionMode.IMAGE && (
                     <>
                        <ActionButton onClick={() => handleImageConversion('image/png')} label="To PNG" disabled={!imageFile} />
                        <ActionButton onClick={() => handleImageConversion('image/jpeg')} label="To JPG" disabled={!imageFile} />
                        <ActionButton onClick={() => handleImageConversion('image/webp')} label="To WEBP" disabled={!imageFile} />
                        <ActionButton onClick={() => handleImageConversion('image/x-icon')} label="To ICO" disabled={!imageFile} />
                     </>
                 )}

                 {/* Audio Tools */}
                 {mode === ConversionMode.AUDIO && (
                     <>
                        <ActionButton onClick={handleAudioConvertWav} label="Convert to WAV" disabled={!audioFile} />
                     </>
                 )}
             </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-h-[100px]">
            {isLoading && (
                <div className="flex items-center justify-center h-20 text-cyan-400 animate-pulse">
                    <Loader2 className="animate-spin mr-2" /> Processing...
                </div>
            )}
            
            <div className="space-y-4">
                {results.map((res, idx) => (
                    <ResultCard key={idx} result={res} />
                ))}
            </div>
            
            {!isLoading && results.length === 0 && (
                <div className="text-center text-slate-600 mt-10 italic">
                    Output will appear here...
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`p-4 md:py-6 flex flex-col items-center gap-2 transition-all duration-200 relative
        ${active ? 'text-cyan-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}
    `}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 hidden md:block"></div>}
    {active && <div className="absolute left-0 right-0 bottom-0 h-1 bg-cyan-400 md:hidden"></div>}
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const ActionButton: React.FC<{ onClick: () => void; label: string; icon?: React.ReactNode; disabled?: boolean }> = ({ onClick, label, icon, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-all shadow-sm
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-600' : 
                   'bg-slate-700 hover:bg-slate-600 text-slate-200'}
        `}
    >
        {icon}
        {label}
    </button>
);

export default App;