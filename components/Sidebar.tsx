
import React, { useRef, useState } from 'react';
import { Plus, Trash2, Bold, Italic, Image as ImageIcon, Type, Lock, Unlock, Move, Download, Upload, FileJson, ChevronDown, ChevronRight, Settings2, RotateCw, Layers, Hash, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, MapPin, Copy, Check, Fingerprint, ImagePlus, Link, Link2Off, Square } from 'lucide-react';
import { Template, CanvasElement, Styling } from '../types';
import { translations } from '../translations';

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
  language: 'en' | 'es';
}

const FONTS = ['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui', 'Impact', 'Myriad Pro', 'Lucida Console'];

const TUCUMAN_STREETS = [
  "25 de Mayo", "San Martín", "9 de Julio", "Mendoza", "Córdoba", "Santiago", 
  "Laprida", "Muñecas", "Maipü", "Junín", "Salta", "Catamarca", 
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
  theme,
  language
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOverList, setIsDraggingOverList] = useState(false);
  const [draggingOverLayerId, setDraggingOverLayerId] = useState<string | null>(null);
  const [generatedAddress, setGeneratedAddress] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [generatedDni, setGeneratedDni] = useState('');
  const [dniCopied, setDniCopied] = useState(false);
  
  const isDark = theme === 'dark';
  const t = translations[language];

  const BLEND_MODES = [
    { value: 'normal', label: t.blendModes.normal },
    { value: 'multiply', label: t.blendModes.multiply },
    { value: 'darken', label: t.blendModes.darken },
    { value: 'color-burn', label: t.blendModes.colorBurn },
    { value: 'linear-burn', label: t.blendModes.linearBurn },
    { value: 'screen', label: t.blendModes.screen },
    { value: 'overlay', label: t.blendModes.overlay },
    { value: 'lighten', label: t.blendModes.lighten },
  ];

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

  const updateStyling = (id: string, current: Styling, updates: Partial<Styling>) => {
    onUpdateElement(id, { styling: { ...current, ...updates } });
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

  const inputClasses = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'}`;
  const labelClasses = `block text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`;
  const subLabelClasses = `text-[10px] font-bold uppercase block mb-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`;
  const cardClasses = (isExpanded: boolean) => `rounded-xl border transition-all ${isExpanded ? (isDark ? 'bg-gray-800 border-indigo-900 shadow-lg p-4' : 'bg-white border-indigo-200 shadow-sm p-4') : (isDark ? 'bg-gray-900/50 border-gray-800 hover:border-indigo-900' : 'bg-white border-gray-100 hover:border-indigo-100')}`;

  const sortedElements = [...template.elements].sort((a, b) => b.zIndex - a.zIndex);
  const baseIsExpanded = template.baseIsExpanded ?? true;

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
        <Settings2 className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Editor</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex gap-2">
          <button 
            onClick={() => {
              const dataStr = JSON.stringify(template, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const link = document.createElement('a');
              link.setAttribute('href', dataUri);
              link.setAttribute('download', `${template.name.replace(/\s+/g, '_')}.json`);
              link.click();
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-800 text-white hover:bg-black'}`}
          >
            <FileJson className="w-3.5 h-3.5" />
            {t.exportJson}
          </button>
        </div>

        <div className="mb-8">
          <label className={labelClasses}>{t.templateName}</label>
          <input 
            type="text" 
            value={template.name}
            onChange={(e) => onUpdateTemplate({ name: e.target.value })}
            className={inputClasses}
          />
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => onAddPhoto()} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl shadow-sm"><ImageIcon className="w-4 h-4" /> {t.addPhoto}</button>
          <button onClick={() => onAddText()} className="flex-1 flex items-center justify-center gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold py-2 px-3 rounded-xl"><Type className="w-4 h-4" /> {t.addText}</button>
        </div>

        <div className={`mb-8 p-3 rounded-xl border space-y-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.tucumanAddress}</label>
              <button onClick={generateRandomAddress} className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md uppercase active:scale-95">{t.random}</button>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <span className="text-[10px] font-bold flex-1 truncate">{generatedAddress || 'ARGENTINA - TUCUMÁN'}</span>
              {generatedAddress && <button onClick={copyAddressToClipboard} className="p-1">{addressCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}</button>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.dniGenerator}</label>
              <button onClick={generateRandomDni} className="px-2 py-1 bg-indigo-600 text-white text-[9px] font-bold rounded-md uppercase active:scale-95">{t.random}</button>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <span className="text-[10px] font-bold flex-1 truncate">{generatedDni || '/DNI 00000000'}</span>
              {generatedDni && <button onClick={copyDniToClipboard} className="p-1">{dniCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}</button>}
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-between mb-4 border-b pb-2 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] flex items-center gap-2 text-gray-500"><Layers className="w-4 h-4 text-indigo-500" /> {t.layerHierarchy}</h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{template.elements.length + 1} {t.layers}</span>
        </div>

        <div className="space-y-3">
          <div className={cardClasses(baseIsExpanded)}>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => onUpdateTemplate({ baseIsExpanded: !baseIsExpanded })}>
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                {baseIsExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <div className="w-8 h-8 rounded border overflow-hidden bg-gray-900"><img src={template.baseImage} className="w-full h-full object-cover" /></div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-xs font-extrabold truncate uppercase text-indigo-500">{t.canvasBackground}</span>
                  {!baseIsExpanded && <span className="text-[10px] text-gray-500">{t.systemLayer}</span>}
                </div>
              </div>
              <Lock className="w-3.5 h-3.5 text-gray-700" />
            </div>

            {baseIsExpanded && (
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-700">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded border overflow-hidden"><img src={template.baseImage} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer block text-[11px] bg-indigo-600 text-white font-bold py-2 rounded-lg text-center"><ImagePlus className="w-3 h-3 inline mr-1" /> {t.replacePhoto} <input type="file" className="hidden" onChange={handleBackgroundUpload} /></label>
                    <div className="flex items-center justify-between"><label className="text-[10px] font-bold uppercase text-gray-500">{t.rotation}</label><input type="number" value={template.baseRotation || 0} onChange={(e) => onUpdateTemplate({ baseRotation: parseInt(e.target.value) })} className="w-12 text-[10px] font-bold text-indigo-600 rounded text-center border bg-gray-900" /></div>
                    <input type="range" min="-180" max="180" value={template.baseRotation || 0} onChange={(e) => onUpdateTemplate({ baseRotation: parseInt(e.target.value) })} className="w-full h-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={subLabelClasses}>{t.blendMode}</label>
                    <select value={template.baseBlendMode || 'normal'} onChange={(e) => onUpdateTemplate({ baseBlendMode: e.target.value as any })} className="w-full text-[11px] border rounded bg-gray-900 p-1">
                      {BLEND_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={subLabelClasses}>{t.roundEdges}</label>
                    <input type="range" min="0" max="500" value={template.baseBorderRadius || 0} onChange={(e) => onUpdateTemplate({ baseBorderRadius: parseInt(e.target.value) })} className="w-full" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {sortedElements.map(el => {
            const isExpanded = el.isExpanded ?? true;
            const isPhoto = el.type === 'photo';
            return (
              <div key={el.id} className={cardClasses(isExpanded)}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => onUpdateElement(el.id, { isExpanded: !isExpanded })}>
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    {isPhoto ? <div className="w-8 h-8 rounded border overflow-hidden"><img src={el.content} className="w-full h-full object-cover" /></div> : <div className="w-8 h-8 rounded border flex items-center justify-center bg-gray-900"><Type className="w-4 h-4 text-gray-600" /></div>}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-xs font-bold truncate">{el.name || el.content.substring(0, 15)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onUpdateElement(el.id, { isLocked: !el.isLocked })} className={`p-1 rounded ${el.isLocked ? 'text-indigo-400 bg-indigo-900/30' : 'text-gray-600'}`}>
                      {el.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onRemoveElement(el.id)} className="p-1 text-red-900/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-700">
                    <div><label className={subLabelClasses}>{t.layerName}</label><input type="text" value={el.name || ''} onChange={(e) => onUpdateElement(el.id, { name: e.target.value })} className="w-full px-2 py-1 text-xs border rounded bg-gray-900" /></div>
                    {isPhoto ? (
                      <div className="space-y-4">
                        <label className="cursor-pointer block text-[11px] bg-indigo-600 text-white font-bold py-2 rounded-lg text-center">{t.replacePhoto} <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e, el)} /></label>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className={subLabelClasses}>{t.width}</label><input type="number" value={Math.round(el.width)} onChange={(e) => handleWidthChange(el, Number(e.target.value))} className="w-full text-xs border bg-gray-900 p-1" /></div>
                          <div><label className={subLabelClasses}>{t.height}</label><input type="number" value={Math.round(el.height)} onChange={(e) => handleHeightChange(el, Number(e.target.value))} className="w-full text-xs border bg-gray-900 p-1" /></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea value={el.content} onChange={(e) => onUpdateElement(el.id, { content: e.target.value })} className="w-full p-2 text-sm border rounded bg-gray-900" rows={2} />
                        <div className="flex items-center gap-2"><input type="checkbox" checked={el.showRandomGenerator} onChange={(e) => onUpdateElement(el.id, { showRandomGenerator: e.target.checked })} /> <span className="text-[10px] font-bold text-gray-500 uppercase">{t.enableRandomId}</span></div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={subLabelClasses}>{t.blendMode}</label>
                        <select value={el.blendMode || 'normal'} onChange={(e) => onUpdateElement(el.id, { blendMode: e.target.value as any })} className="w-full text-[11px] border rounded bg-gray-900 p-1">
                          {BLEND_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={subLabelClasses}>{t.opacity}</label>
                        <input type="range" min="0" max="1" step="0.01" value={el.opacity} onChange={(e) => onUpdateElement(el.id, { opacity: parseFloat(e.target.value) })} className="w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
