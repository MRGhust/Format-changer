import { TextAlgorithm, ImageFormat } from '../types';

// --- Text Converters ---

const morseCodeMap: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
  '9': '----.', '0': '-----', ' ': '/'
};

export const convertText = (text: string, algorithm: TextAlgorithm): string => {
  switch (algorithm) {
    case 'BINARY':
      return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    case 'HEX':
      return text.split('').map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    case 'DUODECIMAL':
      // Converting ASCII codes to Base 12
      return text.split('').map(char => char.charCodeAt(0).toString(12)).join(' ');
    case 'BASE64':
      try {
        return btoa(text);
      } catch (e) {
        return "Error: Invalid input for Base64";
      }
    case 'MORSE':
      return text.toUpperCase().split('').map(char => morseCodeMap[char] || char).join(' ');
    case 'REVERSE':
      return text.split('').reverse().join('');
    default:
      return text;
  }
};

// --- Image Converters ---

export const convertImage = async (file: File, format: ImageFormat): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // If icon, resize to standard icon size (e.g., 256x256 max)
        if (format === 'image/x-icon') {
          const maxSize = 256;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = width * ratio;
            height = height * ratio;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG needs a background color if transparency exists
        if (format === 'image/jpeg') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if(tempCtx) {
                tempCtx.fillStyle = '#FFFFFF';
                tempCtx.fillRect(0, 0, width, height);
                tempCtx.drawImage(canvas, 0, 0);
                resolve(tempCanvas.toDataURL(format, 0.9));
                return;
            }
        }

        resolve(canvas.toDataURL(format, 0.9));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Audio Converters ---

// Helper to write WAV header
function writeWavHeader(sampleRate: number, numChannels: number, dataLength: number) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const convertAudioToWav = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  // Interleave channels
  const data = new Int16Array(length * numChannels);
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      // Clamp and scale to 16-bit
      const s = Math.max(-1, Math.min(1, sample));
      data[i * numChannels + channel] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
  }

  const header = writeWavHeader(sampleRate, numChannels, data.byteLength);
  return new Blob([header, data], { type: 'audio/wav' });
};
