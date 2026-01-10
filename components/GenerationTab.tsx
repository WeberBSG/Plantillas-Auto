
import React, { useState } from 'react';
import { Wand2, Sparkles, Loader2, Plus, AlertCircle, RefreshCw, Image as ImageIcon, Cpu } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GenerationTabProps {
  theme: 'light' | 'dark';
  onAddImage: (base64: string) => void;
}

const GenerationTab: React.FC<GenerationTabProps> = ({ theme, onAddImage }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  // Usar gemini-2.5-flash-image para generación general de imágenes
  const MODEL_NAME = 'gemini-2.5-flash-image';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageBase64 = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageBase64) {
        setGeneratedImage(imageBase64);
      } else {
        throw new Error("No se devolvieron datos de imagen del modelo. Asegúrate de que la descripción sea visual.");
      }
    } catch (err: any) {
      console.error("La generación de imagen falló", err);
      setError(err.message || "Error al generar la imagen. Por favor, intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToTemplate = () => {
    if (generatedImage) {
      onAddImage(generatedImage);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <h3 className={`text-xs font-bold uppercase tracking-[0.1em] flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Generador de Imágenes IA
          </h3>
          <div className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase ${
            isDark ? 'bg-gray-800/50 border-gray-700 text-indigo-400' : 'bg-indigo-50/50 border-indigo-100 text-indigo-600'
          }`}>
            <Cpu className="w-2.5 h-2.5" />
            Modelo: {MODEL_NAME}
          </div>
        </div>
        
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe la imagen que quieres crear..."
            className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none ${
              isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
            }`}
            rows={4}
          />
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-md transform active:scale-95 ${
              isGenerating || !prompt.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando Arte...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generar Imagen
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          isDark ? 'bg-red-900/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {generatedImage && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`relative group aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
            <img 
              src={generatedImage} 
              alt="Vista previa generada" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={handleGenerate}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all"
                title="Regenerar"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleAddToTemplate}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200`}
          >
            <Plus className="w-4 h-4" />
            Añadir a la Plantilla Actual
          </button>
        </div>
      )}
      
      {!generatedImage && !isGenerating && (
        <div className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl ${
          isDark ? 'border-gray-800' : 'border-gray-100'
        }`}>
          <ImageIcon className={`w-10 h-10 mb-4 ${isDark ? 'text-gray-800' : 'text-gray-200'}`} />
          <p className={`text-xs text-center px-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Las imágenes generadas por IA aparecerán aquí.<br/>Prueba con descripciones como "Un paisaje cyberpunk de neón con coches voladores".
          </p>
        </div>
      )}
    </div>
  );
};

export default GenerationTab;
