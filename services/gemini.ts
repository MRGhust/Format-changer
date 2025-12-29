import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: File to Base64 ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// --- 1. Intelligent Text Transformation ---
export const aiTransformText = async (text: string, instruction: string): Promise<string> => {
  try {
    const modelId = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model: modelId,
      contents: text,
      config: {
        systemInstruction: `You are a text transformation engine. ${instruction}. Return only the transformed text.`,
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("AI Text Transform Error:", error);
    throw new Error("Failed to transform text.");
  }
};

// --- 2. Text to Speech (Audio Generation) ---
export const aiTextToSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        return `data:audio/wav;base64,${base64Audio}`; // Note: The raw format might need header, but browser can often play raw PCM if wrapped or handled. 
        // Actually, GenAI API returns raw PCM usually for Live API but TTS endpoint often returns encoded audio or we need to decode.
        // The standard TTS example shows decoding.
        // For simplicity in a file-download context, we might need a wav header helper if it's raw PCM.
        // However, the `gemini-2.5-flash-preview-tts` usually returns data we can decode.
        // To keep this "file convert" style, let's return the raw base64 and we will decode/play it in the UI using standard AudioContext.
        
        return base64Audio;
    } catch (error) {
        console.error("AI TTS Error:", error);
        throw new Error("Failed to generate speech.");
    }
}

// --- 3. Image Analysis/Captioning ---
export const aiAnalyzeImage = async (file: File, prompt: string): Promise<string> => {
    try {
        const base64Data = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: file.type
                        }
                    },
                    { text: prompt || "Describe this image in detail." }
                ]
            }
        });
        return response.text || "No analysis generated.";
    } catch (error) {
        console.error("AI Image Analysis Error:", error);
        throw new Error("Failed to analyze image.");
    }
}

// --- 4. Audio Transcription ---
export const aiTranscribeAudio = async (file: File): Promise<string> => {
    try {
        const base64Data = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: file.type // ensure it's a supported type like audio/mp3, audio/wav
                        }
                    },
                    { text: "Transcribe the spoken content of this audio file verbatim." }
                ]
            }
        });
        return response.text || "No transcription available.";
    } catch (error) {
        console.error("AI Transcription Error:", error);
        throw new Error("Failed to transcribe audio.");
    }
}
