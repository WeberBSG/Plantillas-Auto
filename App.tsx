
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Save, Download, Trash2, Layout, Image as ImageIcon, Settings2, Grid, Lock, Unlock, Upload, X, PlusCircle, FilePlus, Sun, Moon, Menu, Zap } from 'lucide-react';
import Sidebar from './components/Sidebar';
import CanvasArea from './components/CanvasArea';
import { Template, CanvasElement, Styling } from './types';
import { generateExportImage } from './utils/canvasHelper';

const DEFAULT_STYLING: Styling = {
  fontFamily: 'sans-serif',
  fontSize: 24,
  color: '#000000',
  bold: false,
  semibold: false,
  italic: false,
  letterSpacing: 0,
};

const App: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const importInputRef = useRef<HTMLInputElement>(null);
  const newTemplateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('templates');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    
    if (savedTheme) setTheme(savedTheme);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTemplates(parsed);
        if (parsed.length > 0) setActiveTemplate(parsed[0]);
      } catch (e) {
        console.error("Error al cargar plantillas", e);
      }
    }

    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const saveTemplates = useCallback((updatedTemplates: Template[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('templates', JSON.stringify(updatedTemplates));
  }, []);

  const handleCreateTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const baseImage = event.target?.result as string;
      const newTemplate: Template = {
        id: crypto.randomUUID(),
        name: `Plantilla ${templates.length + 1}`,
        baseImage,
        baseOpacity: 1,
        baseRotation: 0,
        baseBlendMode: 'normal',
        baseIsExpanded: true,
        baseBorderRadius: 0,
        elements: [
          {
            id: crypto.randomUUID(),
            type: 'photo',
            name: 'Capa Base',
            content: 'https://picsum.photos/400/300',
            x: 10,
            y: 10,
            width: 200, 
            height: 150,
            rotation: 0,
            styling: DEFAULT_STYLING,
            zIndex: 1,
            isLocked: false,
            isExpanded: true,
            opacity: 1,
            blendMode: 'normal',
            keepAspectRatio: true,
            aspectRatio: 400 / 300,
            borderRadius: 0
          }
        ],
        lastModified: Date.now(),
      };
      const updated = [newTemplate, ...templates];
      saveTemplates(updated);
      setActiveTemplate(newTemplate);
      if (window.innerWidth < 1024) setIsSidebarOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateActiveTemplate = (updates: Partial<Template>) => {
    if (!activeTemplate) return;
    const updated = { ...activeTemplate, ...updates, lastModified: Date.now() };
    setActiveTemplate(updated);
    
    const updatedList = templates.map(t => t.id === updated.id ? updated : t);
    saveTemplates(updatedList);
  };

  const handleDeleteTemplate = () => {
    if (!activeTemplate) return;
    const templateToDelete = activeTemplate;
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar la plantilla "${templateToDelete.name}"?`);
    if (!confirmDelete) return;

    setTemplates(prevTemplates => {
      const updatedList = prevTemplates.filter(t => t.id !== templateToDelete.id);
      localStorage.setItem('templates', JSON.stringify(updatedList));
      return updatedList;
    });
    
    setActiveTemplate(null);
  };

  const handleAddText = () => {
    if (!activeTemplate) return;
    const maxZ = activeTemplate.elements.length > 0 
      ? Math.max(...activeTemplate.elements.map(e => e.zIndex)) 
      : 0;
    
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'text',
      name: `Texto ${activeTemplate.elements.filter(e => e.type === 'text').length + 1}`,
      content: 'Nuevo Bloque de Texto',
      x: 40,
      y: 40,
      width: 400,
      height: 150,
      rotation: 0,
      styling: { ...DEFAULT_STYLING, color: theme === 'dark' ? '#ffffff' : '#000000' },
      zIndex: maxZ + 1,
      isLocked: false,
      isExpanded: true,
      opacity: 1,
      blendMode: 'normal'
    };
    updateActiveTemplate({
      elements: [...activeTemplate.elements, newElement]
    });
  };

  const handleAddPhoto = (content?: string) => {
    if (!activeTemplate) return;
    const maxZ = activeTemplate.elements.length > 0 
      ? Math.max(...activeTemplate.elements.map(e => e.zIndex)) 
      : 0;

    const imgUrl = content || 'https://picsum.photos/200/200';
    
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'photo',
      name: `Foto ${activeTemplate.elements.filter(e => e.type === 'photo').length + 1}`,
      content: imgUrl,
      x: 20,
      y: 20,
      width: 200,
      height: 200,
      rotation: 0,
      styling: { ...DEFAULT_STYLING },
      zIndex: maxZ + 1,
      isLocked: false,
      isExpanded: true,
      opacity: 1,
      blendMode: 'normal',
      keepAspectRatio: true,
      aspectRatio: 1,
      borderRadius: 0
    };

    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      handleUpdateElement(newElement.id, { aspectRatio: ratio, height: 200 / ratio });
    };
    img.src = imgUrl;

    updateActiveTemplate({
      elements: [...activeTemplate.elements, newElement]
    });
  };

  const handleRemoveElement = (id: string) => {
    if (!activeTemplate) return;
    updateActiveTemplate({
      elements: activeTemplate.elements.filter(el => el.id !== id)
    });
  };

  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    if (!activeTemplate) return;
    updateActiveTemplate({
      elements: activeTemplate.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    });
  };

  const handleReorderElement = (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    if (!activeTemplate) return;
    const elements = [...activeTemplate.elements].sort((a, b) => a.zIndex - b.zIndex);
    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    const element = elements[index];
    
    switch (direction) {
      case 'front':
        elements.splice(index, 1);
        elements.push(element);
        break;
      case 'back':
        elements.splice(index, 1);
        elements.unshift(element);
        break;
      case 'forward':
        if (index < elements.length - 1) {
          [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
        }
        break;
      case 'backward':
        if (index > 0) {
          [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
        }
        break;
    }

    const updatedElements = elements.map((el, i) => ({
      ...el,
      zIndex: i + 1
    }));

    updateActiveTemplate({ elements: updatedElements });
  };

  const handleImportTemplate = (imported: Template) => {
    const newId = crypto.randomUUID();
    const cleanTemplate = { ...imported, id: newId, lastModified: Date.now() };
    const updated = [cleanTemplate, ...templates];
    saveTemplates(updated);
    setActiveTemplate(cleanTemplate);
    if (window.innerWidth < 1024) setIsSidebarOpen(true);
  };

  const handleJSONImportPrompt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.elements) {
          handleImportTemplate(imported);
        } else {
          alert("Archivo de plantilla inválido.");
        }
      } catch (err) {
        alert("Error al procesar el JSON.");
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const handleExport = async () => {
    if (!activeTemplate) return;
    setIsExporting(true);
    try {
      const dataUrl = await generateExportImage(activeTemplate);
      const link = document.createElement('a');
      link.download = `${activeTemplate.name.replace(/\s+/g, '_')}_exporte.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Exportación fallida", err);
      alert("Error al exportar imagen. Asegúrate de que todas las imágenes estén cargadas.");
    } finally {
      setIsExporting(false);
    }
  };

  const triggerNewTemplate = () => {
    newTemplateInputRef.current?.click();
  };

  const closeActiveTemplate = () => {
    setActiveTemplate(null);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <input 
        ref={newTemplateInputRef}
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={handleCreateTemplate} 
      />

      <header className={`fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-4 lg:px-6 z-30 shadow-sm transition-colors duration-300 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 lg:gap-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors lg:hidden ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="p-1.5 lg:p-2 bg-indigo-600 rounded-lg shadow-indigo-100 shadow-md">
              <Layout className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm lg:text-lg font-extrabold tracking-tight truncate max-w-[120px] lg:max-w-none">Plantillas Auto</h1>
              <Zap className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>

          <div className={`hidden md:flex items-center gap-2 border-l pl-6 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <button 
              onClick={triggerNewTemplate}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${isDark ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-800' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title="Comenzar nueva plantilla"
            >
              <FilePlus className="w-4 h-4" />
              <span className="hidden lg:inline">Nuevo</span>
            </button>
            {activeTemplate && (
              <>
                <button 
                  onClick={closeActiveTemplate}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${isDark ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-800' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  title="Cerrar editor"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden lg:inline">Cerrar</span>
                </button>
                <button 
                  onClick={handleDeleteTemplate}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                  title="Eliminar esta plantilla"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden lg:inline">Eliminar</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${isDark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={`Cambiar a modo ${isDark ? 'Claro' : 'Oscuro'}`}
          >
            {isDark ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
          </button>

          <div className={`hidden sm:flex items-center gap-2 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button 
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-1.5 lg:p-2 rounded flex items-center gap-2 text-[10px] lg:text-xs font-bold transition-all uppercase tracking-wide ${snapToGrid ? (isDark ? 'bg-gray-700 text-indigo-400 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') : (isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700')}`}
            >
              <Grid className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">Ajustar Cuadrícula</span>
            </button>
          </div>

          {activeTemplate && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 lg:px-5 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all shadow-lg shadow-indigo-100 transform active:scale-95"
            >
              {isExporting ? '...' : (
                <>
                  <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">Exportar PNG</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-16 h-full overflow-hidden">
        <aside className={`fixed inset-y-0 left-0 z-40 w-full sm:w-[350px] lg:w-[400px] lg:static transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-[400px]'} border-r flex flex-col ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex lg:hidden justify-end p-4">
            <button onClick={() => setIsSidebarOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTemplate ? (
              <Sidebar 
                template={activeTemplate}
                onUpdateTemplate={updateActiveTemplate}
                onAddText={handleAddText}
                onAddPhoto={handleAddPhoto}
                onRemoveElement={handleRemoveElement}
                onUpdateElement={handleUpdateElement}
                onReorderElement={handleReorderElement}
                onImportTemplate={handleImportTemplate}
                theme={theme}
              />
            ) : (
              <div className={`p-8 text-center h-full flex flex-col items-center justify-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/30'}`}>
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-gray-800' : 'bg-indigo-50'}`}>
                  <ImageIcon className={`w-8 h-8 lg:w-10 lg:h-10 ${isDark ? 'text-gray-600' : 'text-indigo-300'}`} />
                </div>
                <h2 className="text-xl font-extrabold mb-2">Bienvenido</h2>
                <p className={`mb-8 px-4 text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Selecciona una plantilla o empieza una nueva.
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-xs px-4">
                  <button 
                    onClick={triggerNewTemplate}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Crear Plantilla
                  </button>
                  
                  <label className={`cursor-pointer block border font-bold py-3.5 px-6 rounded-2xl transition-all shadow-sm text-center ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <Upload className="w-5 h-5 inline mr-2 text-indigo-500" />
                    Importar JSON
                    <input ref={importInputRef} type="file" className="hidden" accept=".json" onChange={handleJSONImportPrompt} />
                  </label>
                </div>
              </div>
            )}
            
            {templates.length > 0 && (
              <div className={`mt-8 px-6 pb-12 ${!activeTemplate ? (isDark ? 'border-t border-gray-800 pt-8' : 'border-t border-gray-100 pt-8') : ''}`}>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Layout className="w-3 h-3" />
                  Biblioteca de Plantillas
                </h3>
                <div className="grid gap-4">
                  {[...templates].sort((a,b) => b.lastModified - a.lastModified).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTemplate(t);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`group w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-4 ${activeTemplate?.id === t.id ? (isDark ? 'border-indigo-500 bg-indigo-950 ring-1 ring-indigo-500 shadow-md' : 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 shadow-md') : (isDark ? 'border-gray-800 bg-gray-800 hover:border-gray-600 hover:shadow-md text-gray-100' : 'border-gray-100 hover:border-indigo-200 bg-white hover:shadow-md text-gray-800')}`}
                    >
                      <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border shadow-inner group-hover:scale-105 transition-transform ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                        <img src={t.baseImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={`font-bold truncate mb-0.5 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{t.name}</p>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{new Date(t.lastModified).toLocaleDateString('es-AR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className={`flex-1 flex items-center justify-center p-4 lg:p-8 overflow-auto transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-100'}`}>
          {activeTemplate ? (
            <div className="w-full h-full flex items-center justify-center">
              <CanvasArea 
                template={activeTemplate}
                onUpdateElement={handleUpdateElement}
                snapToGrid={snapToGrid}
              />
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className={`inline-flex p-6 rounded-3xl shadow-xl mb-6 rotate-3 transition-colors duration-300 ${isDark ? 'bg-gray-900 shadow-black' : 'bg-white shadow-gray-200/50'}`}>
                <Settings2 className={`w-12 h-12 lg:w-16 lg:h-16 ${isDark ? 'text-gray-700' : 'text-indigo-100'}`} />
              </div>
              <p className={`text-base lg:text-lg font-bold ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Selecciona una plantilla para comenzar a editar</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
