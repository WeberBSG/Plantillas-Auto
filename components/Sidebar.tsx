
import React, { useRef, useState } from 'react';
import { Plus, Trash2, Bold, Italic, Image as ImageIcon, Type, Lock, Unlock, Move, Download, Upload, FileJson, ChevronDown, ChevronRight, Settings2, RotateCw, Layers, Hash, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, MapPin, Copy, Check, Fingerprint, ImagePlus, Link, Link2Off, Square } from 'lucide-react';
import { Template, CanvasElement, Styling } from '../types';

interface SidebarProps {
  template: Template;
  onUpdateTemplate: (updates: Partial<Template>) => void;
  onAddText: () => void;
  onAddPhoto: (content?: string) => void;
  onRemoveElement: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onReorderElement: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  onImportTemplate: (template: Template) => void;
  theme: 'light' | 'dark';
}

const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui', 'Impact', 'Myriad Pro', 'Lucida Console'];
const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicar' },
  { value: 'darken', label: 'Oscurecer' },
  { value: 'color-burn', label: 'Subexponer Color' },
  { value: 'linear-burn', label: 'Subexposición Lineal' },
  { value: 'screen', label: 'Trama' },
  { value: 'overlay', label: 'Superponer' },
  { value: 'lighten', label: 'Aclarar' },
];

const TUCUMAN_STREETS = [
  "25 de Mayo", "San Martín", "9 de Julio", "Mendoza", "Córdoba", "Santiago", 
  "Laprida", "Muñecas", "Maipú", "Junín", "Salta", "Catamarca", 
  "José Colombres", "Marco Avellaneda", "San Juan", "Corrientes", 
  "Santa Fe", "Marcos Paz", "Balcarce", "Monteagudo", "Rivadavia", 
  "Virgen de la Merced", "Las Heras", "Entre Ríos", "Congreso", "Moreno", 
  "Las Piedras", "General Paz", "San Lorenzo", "Crisóstomo Álvarez", 
  "Buenos Aires", "Chacabuco", "Ayacucho", "Jujuy", "La Rioja", 
  "Alberdi", "Lamadrid", "Lavalle", "Bolívar", "Rondeau", "Avenida Mate de Luna",
  "Avenida Sarmiento", "Avenida Avellaneda", "Avenida Soldati", 
  "Avenida Brígido Terán", "Avenida Roca", "Avenida Colón", "Avenida Adolfo de la Vega",
  "Avenida Juan B. Justo", "Avenida Benjamín Aráoz", "Avenida Francisco de Aguirre"
];

const Sidebar: React.FC<SidebarProps> = ({ 
  template, 
  onUpdateTemplate, 
  onAddText, 
  onAddPhoto,
  onRemoveElement, 
  onUpdateElement,
  onReorderElement,
  onImportTemplate,
  theme
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOverList, setIsDraggingOverList] = useState(false);
  const [draggingOverLayerId, setDraggingOverLayerId] = useState<string | null>(null);
  const [generatedAddress, setGeneratedAddress] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [generatedDni, setGeneratedDni] = useState('');
  const [dniCopied, setDniCopied] = useState(false);
  
  const isDark = theme === 'dark';

  const generateRandomAddress = () => {
    const street = TUCUMAN_STREETS[Math.floor(Math.random() * TUCUMAN_STREETS.length)];
    const number = Math.floor(Math.random() * 2500) + 1;
    setGeneratedAddress(`${street} ${number}`.toUpperCase());
    setAddressCopied(false);
  };

  const generateRandomDni = () => {
    const min = 3000000;
    const max = 20000000;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    const paddedNum = randomNum.toString().padStart(8, '0');
    setGeneratedDni(`/DNI ${paddedNum}`);
    setDniCopied(false);
  };

  const copyAddressToClipboard = () => {
    if (!generatedAddress) return;
    navigator.clipboard.writeText(generatedAddress);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const copyDniToClipboard = () => {
    if (!generatedDni) return;
    navigator.clipboard.writeText(generatedDni);
    setDniCopied(true);
    setTimeout(() => setDniCopied(false), 2000);
  };

  const toggleExpand = (id: string, current: boolean) => {
    onUpdateElement(id, { isExpanded: !current });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, element: CanvasElement) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileAsDataURL(file).then(data => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        onUpdateElement(element.id, { 
          content: data, 
          aspectRatio: ratio,
          height: element.keepAspectRatio ? element.width / ratio : element.height
        });
      };
      img.src = data;
    });
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileAsDataURL(file).then(data => onUpdateTemplate({ baseImage: data }));
  };

  const handleWidthChange = (el: CanvasElement, newWidth: number) => {
    const updates: Partial<CanvasElement> = { width: newWidth };
    const ratio = el.aspectRatio || (el.width / el.height);
    if (el.keepAspectRatio && ratio) {
      updates.height = newWidth / ratio;
    }
    onUpdateElement(el.id, updates);
  };

  const handleHeightChange = (el: CanvasElement, newHeight: number) => {
    const updates: Partial<CanvasElement> = { height: newHeight };
    const ratio = el.aspectRatio || (el.width / el.height);
    if (el.keepAspectRatio && ratio) {
      updates.width = newHeight * ratio;
    }
    onUpdateElement(el.id, updates);
  };

  const handleToggleAspectRatio = (el: CanvasElement) => {
    const newKeep = !el.keepAspectRatio;
    const updates: Partial<CanvasElement> = { keepAspectRatio: newKeep };
    if (newKeep && !el.aspectRatio && el.width && el.height) {
      updates.aspectRatio = el.width / el.height;
    }
    onUpdateElement(el.id, updates);
  };

  // Add missing updateStyling function to fix "Cannot find name 'updateStyling'" errors
  const updateStyling = (id: string, currentStyling: Styling, updates: Partial<Styling>) => {
    onUpdateElement(id, {
      styling: { ...currentStyling, ...updates }
    });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.elements) {
          onImportTemplate(imported);
        } else {
          alert("Formato de archivo de plantilla inválido.");
        }
      } catch (err) {
        alert("Error al procesar el archivo de plantilla.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateRandomNumber = (element: CanvasElement) => {
    const min = 40000000;
    const max = 70000000;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    onUpdateElement(element.id, { content: randomNum.toString() });
  };

  const inputClasses = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold shadow-none ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'}`;
  const labelClasses = `block text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`;
  const miniLabelClasses = `text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`;
  const subLabelClasses = `text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`;
  const cardClasses = (isExpanded: boolean) => `rounded-xl border transition-all ${isExpanded ? (isDark ? 'bg-gray-800 border-indigo-900 shadow-lg p-4' : 'bg-white border-indigo-200 shadow-sm p-4') : (isDark ? 'bg-gray-900/50 border-gray-800 hover:border-indigo-900' : 'bg-white border-gray-100 hover:border-indigo-100')}`;

  const sortedElements = [...template.elements].sort((a, b) => b.zIndex - a.zIndex);
  const baseIsExpanded = template.baseIsExpanded ?? true;

  return (
    <div className="p-6">
      <div className="mb-6 flex gap-2">
        <button 
          onClick={handleExportJSON}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-800 text-white hover:bg-black'}`}
        >
          <FileJson className="w-3.5 h-3.5" />
          Exportar JSON
        </button>
        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-indigo-100 text-gray-700 hover:bg-indigo-200'}`}>
          <Upload className="w-3.5 h-3.5" />
          Importar JSON
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
        </label>
      </div>

      <div className="mb-8">
        <label className={labelClasses}>Nombre de la Plantilla</label>
        <input 
          type="text" 
          value={template.name}
          onChange={(e) => onUpdateTemplate({ name: e.target.value })}
          className={inputClasses}
        />
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => onAddPhoto()}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-sm"
        >
          <ImageIcon className="w-4 h-4" />
          Añadir Foto
        </button>
        <button 
          onClick={() => onAddText()}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold py-2 px-3 rounded-xl transition-all"
        >
          <Type className="w-4 h-4" />
          Añadir Texto
        </button>
      </div>

      <div className={`mb-8 p-3 rounded-xl border space-y-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={miniLabelClasses}>DIRECCIÓN TUCUMÁN</label>
            <button 
              onClick={generateRandomAddress}
              className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md hover:bg-indigo-700 transition-colors uppercase active:scale-95"
            >
              AL AZAR
            </button>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <span className={`text-[10px] font-bold flex-1 truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {generatedAddress || 'ARGENTINA - TUCUMÁN'}
            </span>
            {generatedAddress && (
              <button 
                onClick={copyAddressToClipboard}
                className={`p-1 rounded-md transition-all ${addressCopied ? 'text-green-500' : (isDark ? 'text-gray-500 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600')}`}
                title="Copiar Dirección"
              >
                {addressCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        <div className={`h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={miniLabelClasses}>GENERADOR DNI</label>
            <button 
              onClick={generateRandomDni}
              className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md hover:bg-indigo-700 transition-colors uppercase active:scale-95"
            >
              AL AZAR
            </button>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <span className={`text-[10px] font-bold flex-1 truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {generatedDni || '/DNI 00000000'}
            </span>
            {generatedDni && (
              <button 
                onClick={copyDniToClipboard}
                className={`p-1 rounded-md transition-all ${dniCopied ? 'text-green-500' : (isDark ? 'text-gray-500 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600')}`}
                title="Copiar DNI"
              >
                {dniCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between mb-4 border-b pb-2 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <h3 className={`text-xs font-bold uppercase tracking-[0.1em] flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <Layers className="w-4 h-4 text-indigo-500" />
          Jerarquía de Capas
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase">{template.elements.length + 1} Capas</span>
      </div>

      <div className="space-y-3 mb-10">
        <div className={`${cardClasses(baseIsExpanded)}`}>
          <div 
            className={`flex items-center justify-between cursor-pointer ${!baseIsExpanded ? 'p-3' : `mb-4 border-b pb-3 ${isDark ? 'border-gray-700' : 'border-indigo-50'}`}`}
            onClick={() => onUpdateTemplate({ baseIsExpanded: !baseIsExpanded })}
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              {baseIsExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <div className={`w-8 h-8 rounded border overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <img src={template.baseImage} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className={`text-xs font-extrabold truncate uppercase tracking-wide ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Fondo del Lienzo</span>
                {!baseIsExpanded && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    Capa de Sistema • Opacidad:{Math.round((template.baseOpacity ?? 1) * 100)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} title="La posición de la capa base está bloqueada" />
            </div>
          </div>

          {baseIsExpanded && (
            <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className={`w-20 h-20 rounded border overflow-hidden shadow-inner flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-indigo-200'}`}>
                    <img 
                      src={template.baseImage} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      style={{ 
                        opacity: template.baseOpacity ?? 1,
                        mixBlendMode: template.baseBlendMode as any,
                        transform: `rotate(${template.baseRotation || 0}deg)`,
                        borderRadius: `${template.baseBorderRadius || 0}px`
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer flex items-center justify-center gap-2 block text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-center transition-all">
                      <ImagePlus className="w-3 h-3" />
                      Reemplazar Foto
                      <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
                    </label>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Rotación</label>
                        <input type="number" value={template.baseRotation || 0} onChange={(e) => onUpdateTemplate({ baseRotation: parseInt(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                      </div>
                      <input type="range" min="-180" max="180" step="1" value={template.baseRotation || 0} onChange={(e) => onUpdateTemplate({ baseRotation: parseInt(e.target.value) })} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-4 border-t pt-3 ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
                  <div className="space-y-3">
                    <div>
                      <label className={`${subLabelClasses} flex items-center gap-1`}><Layers className="w-2.5 h-2.5" /> Modo Fusión</label>
                      <select value={template.baseBlendMode || 'normal'} onChange={(e) => onUpdateTemplate({ baseBlendMode: e.target.value as any })} className={`w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 shadow-none ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
                        {BLEND_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={subLabelClasses}>Opacidad</label>
                        <input type="number" step="0.01" min="0" max="1" value={template.baseOpacity ?? 1} onChange={(e) => onUpdateTemplate({ baseOpacity: parseFloat(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                      </div>
                      <input type="range" min="0" max="1" step="0.01" value={template.baseOpacity ?? 1} onChange={(e) => onUpdateTemplate({ baseOpacity: parseFloat(e.target.value) })} className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`${subLabelClasses} flex items-center gap-1`}><Square className="w-2.5 h-2.5" /> Bordes Redond.</label>
                      <input type="number" min="0" max="500" value={template.baseBorderRadius || 0} onChange={(e) => onUpdateTemplate({ baseBorderRadius: parseInt(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                    </div>
                    <input type="range" min="0" max="500" step="1" value={template.baseBorderRadius || 0} onChange={(e) => onUpdateTemplate({ baseBorderRadius: parseInt(e.target.value) })} className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-[9px] text-gray-400 text-center uppercase leading-tight font-bold">Esta capa define las dimensiones de tu plantilla</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div 
          className={`space-y-3 transition-all duration-200 rounded-2xl ${isDraggingOverList ? (isDark ? 'bg-indigo-950/20 ring-2 ring-indigo-500 ring-dashed p-2' : 'bg-indigo-50/50 ring-2 ring-indigo-500 ring-dashed p-2') : ''}`}
        >
          {sortedElements.map((el, idx) => {
            const isExpanded = el.isExpanded ?? true;
            const isDraggingOver = draggingOverLayerId === el.id;
            const isPhoto = el.type === 'photo';

            return (
              <div 
                key={el.id} 
                className={`${cardClasses(isExpanded)} ${isDraggingOver ? 'ring-4 ring-indigo-400 ring-opacity-50' : ''}`}
              >
                <div 
                  className={`flex items-center justify-between cursor-pointer ${!isExpanded ? 'p-3' : `mb-4 border-b pb-3 ${isDark ? 'border-gray-700' : 'border-indigo-50'}`}`}
                  onClick={() => toggleExpand(el.id, isExpanded)}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    
                    {isPhoto ? (
                      <div className={`w-8 h-8 rounded border overflow-hidden flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                        <img src={el.content} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded border flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                        <Type className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      </div>
                    )}

                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className={`text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{el.name || (isPhoto ? `Capa de Foto` : el.content.substring(0, 15))}</span>
                      {!isExpanded && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          Z:{el.zIndex} • Opacidad:{Math.round((el.opacity ?? 1) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <div className={`flex items-center border rounded-lg overflow-hidden mr-1 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                      <button 
                        onClick={() => onReorderElement(el.id, 'forward')}
                        className={`p-1 hover:bg-indigo-50 transition-colors ${isDark ? 'text-gray-500 hover:text-indigo-400 hover:bg-gray-800' : 'text-gray-400 hover:text-indigo-600'}`}
                        title="Traer al Frente"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onReorderElement(el.id, 'backward')}
                        className={`p-1 hover:bg-indigo-50 transition-colors ${isDark ? 'text-gray-500 hover:text-indigo-400 hover:bg-gray-800' : 'text-gray-400 hover:text-indigo-600'}`}
                        title="Enviar Atrás"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => onUpdateElement(el.id, { isLocked: !el.isLocked })}
                      className={`p-1.5 rounded transition-colors ${el.isLocked ? (isDark ? 'text-indigo-400 bg-indigo-900/30' : 'text-indigo-600 bg-indigo-50') : (isDark ? 'text-gray-600 hover:text-gray-400 hover:bg-gray-700' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100')}`}
                    >
                      {el.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => onRemoveElement(el.id)}
                      className={`p-1.5 rounded transition-colors ${isDark ? 'text-red-900/40 hover:text-red-400 hover:bg-red-900/10' : 'text-red-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={subLabelClasses}>Nombre de Capa</label>
                        <input 
                          type="text"
                          value={el.name || ''}
                          onChange={(e) => onUpdateElement(el.id, { name: e.target.value })}
                          placeholder="ej. Logo Central"
                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}
                        />
                      </div>
                      <div>
                        <label className={subLabelClasses}>Jerarquía</label>
                        <div className="flex gap-1">
                          <button onClick={() => onReorderElement(el.id, 'front')} className={`p-1.5 border rounded-lg transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700 text-indigo-400' : 'border-gray-100 hover:bg-gray-50 text-indigo-600'}`} title="Al Frente"><ChevronsUp className="w-4 h-4" /></button>
                          <button onClick={() => onReorderElement(el.id, 'back')} className={`p-1.5 border rounded-lg transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700 text-indigo-400' : 'border-gray-100 hover:bg-gray-50 text-indigo-600'}`} title="Al Fondo"><ChevronsDown className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    {isPhoto ? (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className={`w-20 h-20 rounded border overflow-hidden shadow-inner flex-shrink-0 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-indigo-200'}`}>
                            <img 
                              src={el.content} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              style={{ 
                                opacity: el.opacity ?? 1,
                                mixBlendMode: el.blendMode as any,
                                transform: `rotate(${el.rotation || 0}deg)`,
                                borderRadius: `${el.borderRadius || 0}px`
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="cursor-pointer block text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-center transition-all">
                              Reemplazar Foto
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, el)} />
                            </label>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Rotación</label>
                                <input type="number" value={el.rotation || 0} onChange={(e) => onUpdateElement(el.id, { rotation: parseInt(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                              </div>
                              <input type="range" min="-180" max="180" step="1" value={el.rotation || 0} onChange={(e) => onUpdateElement(el.id, { rotation: parseInt(e.target.value) })} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            </div>
                          </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-4 border-t pt-3 ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
                          <div className="space-y-3">
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className={subLabelClasses}>Ancho (px)</label>
                                <input 
                                  type="number" 
                                  value={Math.round(el.width || 0)} 
                                  onChange={(e) => handleWidthChange(el, Number(e.target.value))} 
                                  className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} 
                                />
                              </div>
                              <button 
                                onClick={() => handleToggleAspectRatio(el)}
                                className={`p-1.5 border rounded transition-all ${el.keepAspectRatio ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-400 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                                title="Bloquear Proporción"
                              >
                                {el.keepAspectRatio ? <Link className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div>
                              <label className={subLabelClasses}>Alto (px)</label>
                              <input 
                                type="number" 
                                value={Math.round(el.height || 0)} 
                                onChange={(e) => handleHeightChange(el, Number(e.target.value))} 
                                className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} 
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className={`${subLabelClasses} flex items-center gap-1`}><Layers className="w-2.5 h-2.5" /> Modo Fusión</label>
                              <select value={el.blendMode || 'normal'} onChange={(e) => onUpdateElement(el.id, { blendMode: e.target.value as any })} className={`w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 shadow-none ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
                                {BLEND_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className={`${subLabelClasses} flex items-center gap-1`}><Square className="w-2.5 h-2.5" /> Bordes Redond.</label>
                                <input type="number" min="0" max="500" value={el.borderRadius || 0} onChange={(e) => onUpdateElement(el.id, { borderRadius: parseInt(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                              </div>
                              <input type="range" min="0" max="500" step="1" value={el.borderRadius || 0} onChange={(e) => onUpdateElement(el.id, { borderRadius: parseInt(e.target.value) })} className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea value={el.content} onChange={(e) => onUpdateElement(el.id, { content: e.target.value })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-none ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'}`} placeholder="Ingresar texto..." rows={2} />
                        
                        <div className={`flex items-center justify-between p-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={el.showRandomGenerator || false}
                              onChange={(e) => onUpdateElement(el.id, { showRandomGenerator: e.target.checked })}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Habilitar ID Azar</span>
                          </label>
                          {el.showRandomGenerator && (
                            <button 
                              onClick={() => generateRandomNumber(el)}
                              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                              <Hash className="w-3 h-3" />
                              Gen ID
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={subLabelClasses}>Fuente</label>
                            <select value={el.styling.fontFamily} onChange={(e) => updateStyling(el.id, el.styling, { fontFamily: e.target.value })} className={`w-full px-2 py-1.5 text-xs border rounded font-medium shadow-none ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
                              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={subLabelClasses}>Tamaño (px)</label>
                            <input type="number" value={el.styling.fontSize} onChange={(e) => updateStyling(el.id, el.styling, { fontSize: Number(e.target.value) })} className={`w-full px-2 py-1 text-xs border rounded font-medium shadow-none ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
                          </div>
                        </div>

                        <div className={`grid grid-cols-2 gap-3 p-3 rounded-lg border ${isDark ? 'bg-indigo-950/20 border-indigo-900/30' : 'bg-indigo-50/20 border-indigo-100/50'}`}>
                          <div>
                            <label className={`${subLabelClasses} flex items-center gap-1`}><Layers className="w-2.5 h-2.5" /> Modo Fusión</label>
                            <select value={el.blendMode || 'normal'} onChange={(e) => onUpdateElement(el.id, { blendMode: e.target.value as any })} className={`w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 shadow-none ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
                              {BLEND_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className={subLabelClasses}>Opacidad</label>
                              <input type="number" step="0.01" min="0" max="1" value={el.opacity ?? 1} onChange={(e) => onUpdateElement(el.id, { opacity: parseFloat(e.target.value) })} className={`w-12 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                            </div>
                            <input type="range" min="0" max="1" step="0.01" value={el.opacity ?? 1} onChange={(e) => onUpdateElement(el.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-indigo-600 h-1.5" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-1">
                            <div className="relative group mr-1">
                              <input type="color" value={el.styling.color} onChange={(e) => updateStyling(el.id, el.styling, { color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer p-0 overflow-hidden border-2 border-white shadow-sm" />
                              <div className="absolute inset-0 pointer-events-none ring-1 ring-gray-200 rounded-lg"></div>
                            </div>
                            <button onClick={() => updateStyling(el.id, el.styling, { semibold: !el.styling.semibold })} className={`p-2 px-2.5 text-[10px] font-black rounded-lg border transition-all ${el.styling.semibold ? 'bg-indigo-600 text-white border-indigo-600' : (isDark ? 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50')}`}>SB</button>
                            <button onClick={() => updateStyling(el.id, el.styling, { bold: !el.styling.bold })} className={`p-2 rounded-lg border transition-all ${el.styling.bold ? 'bg-indigo-600 text-white border-indigo-600' : (isDark ? 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50')}`}><Bold className="w-4 h-4" /></button>
                            <button onClick={() => updateStyling(el.id, el.styling, { italic: !el.styling.italic })} className={`p-2 rounded-lg border transition-all ${el.styling.italic ? 'bg-indigo-600 text-white border-indigo-600' : (isDark ? 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50')}`}><Italic className="w-4 h-4" /></button>
                          </div>
                          <div className="flex items-center gap-1">
                            <label className={`text-[10px] font-bold uppercase mr-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Rotación</label>
                            <input type="number" value={el.rotation || 0} onChange={(e) => onUpdateElement(el.id, { rotation: parseInt(e.target.value) })} className={`w-12 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`space-y-3 p-3 rounded-lg border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-indigo-50/10 border-gray-100'}`}>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Posición X (%)</label>
                          <input type="number" step="0.1" value={el.x} onChange={(e) => onUpdateElement(el.id, { x: parseFloat(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                        </div>
                        <input type="range" min="-20" max="100" step="0.1" value={el.x} onChange={(e) => onUpdateElement(el.id, { x: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Posición Y (%)</label>
                          <input type="number" step="0.1" value={el.y} onChange={(e) => onUpdateElement(el.id, { y: parseFloat(e.target.value) })} className={`w-14 text-[10px] font-bold text-indigo-600 rounded text-center p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`} />
                        </div>
                        <input type="range" min="-20" max="100" step="0.1" value={el.y} onChange={(e) => onUpdateElement(el.id, { y: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {template.elements.length === 0 && !template.baseImage && (
        <div className={`mt-10 py-12 text-center border-2 border-dashed rounded-2xl ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <Settings2 className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-800' : 'text-gray-200'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Sin elementos aún.<br/>Usa los botones superiores para añadir capas.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
