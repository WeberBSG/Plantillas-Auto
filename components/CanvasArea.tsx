
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Template, CanvasElement } from '../types';
import { translations } from '../translations';

interface CanvasAreaProps {
  template: Template;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  snapToGrid: boolean;
  language: 'en' | 'es';
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ template, onUpdateElement, snapToGrid, language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const t = translations[language];
  
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault(); setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setIsSpacePressed(false); setIsPanning(false); }};
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) { e.preventDefault(); setScale(prev => Math.max(0.1, Math.min(5, prev * (e.deltaY < 0 ? 1.1 : 0.9)))); }
    };
    viewportRef.current?.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewportRef.current?.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, element?: CanvasElement | 'base') => {
    if (isSpacePressed) { setIsPanning(true); setLastMousePos({ x: e.clientX, y: e.clientY }); return; }
    if (element === 'base') { setActiveElementId('base'); return; }
    if (element && !element.isLocked) {
      e.stopPropagation(); setActiveElementId(element.id);
      const rect = containerRef.current!.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      setDragOffset({ x: clickX - element.x, y: clickY - element.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x; const dy = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy })); setLastMousePos({ x: e.clientX, y: e.clientY }); return;
    }
    if (!activeElementId || activeElementId === 'base' || !containerRef.current) return;
    const element = template.elements.find(el => el.id === activeElementId);
    if (!element || element.isLocked) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;
    if (snapToGrid) { newX = Math.round(newX / 2) * 2; newY = Math.round(newY / 2) * 2; }
    onUpdateElement(activeElementId, { x: Math.max(-50, Math.min(150, newX)), y: Math.max(-50, Math.min(150, newY)) });
  };

  const previewScale = naturalDimensions.width > 0 ? (containerWidth / naturalDimensions.width) : 1;

  return (
    <div 
      ref={viewportRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${isSpacePressed ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
      onMouseMove={handleMouseMove} onMouseUp={() => {setActiveElementId(null); setIsPanning(false);}}
    >
      <div ref={containerRef} className="relative shadow-2xl bg-white select-none transition-transform duration-75"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: 'center center' }}>
        <img ref={imgRef} src={template.baseImage} className="block w-full h-auto max-h-[calc(100vh-160px)] object-contain" draggable={false} 
          onLoad={() => {setNaturalDimensions({width: imgRef.current!.naturalWidth, height: imgRef.current!.naturalHeight}); setContainerWidth(imgRef.current!.clientWidth);}}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'base'); }}
          style={{ opacity: template.baseOpacity ?? 1, mixBlendMode: template.baseBlendMode as any, transform: `rotate(${template.baseRotation || 0}deg)`, borderRadius: `${(template.baseBorderRadius || 0) * previewScale}px` }}
        />
        {template.elements.map(el => (
          <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el)} className={`absolute ${activeElementId === el.id ? 'ring-2 ring-indigo-500 z-[100]' : ''}`}
            style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${(el.width / naturalDimensions.width) * 100}%`, height: `${(el.height / naturalDimensions.height) * 100}%`, zIndex: el.zIndex, opacity: el.opacity ?? 1, mixBlendMode: el.blendMode as any, transform: `rotate(${el.rotation || 0}deg)`, borderRadius: `${(el.borderRadius || 0) * previewScale}px`, overflow: 'hidden' }}>
            {el.type === 'text' ? <div style={{ color: el.styling.color, fontSize: `${el.styling.fontSize * previewScale}px`, fontFamily: el.styling.fontFamily, fontWeight: el.styling.bold ? 'bold' : 'normal', fontStyle: el.styling.italic ? 'italic' : 'normal', letterSpacing: `${(el.styling.letterSpacing || 0) * previewScale}px` }}>{el.content}</div> : <img src={el.content} className="w-full h-full object-cover" draggable={false} />}
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-gray-800/50 text-gray-300 border border-gray-700">{t.zoom}: {Math.round(scale * 100)}%</div>
        {pan.x !== 0 && <button onClick={() => {setPan({x: 0, y: 0}); setScale(1);}} className="pointer-events-auto px-3 py-1.5 bg-gray-800 text-white rounded-full text-[10px] uppercase">{t.resetView}</button>}
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40"><div className="bg-black/20 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.controlsInfo}</div></div>
    </div>
  );
};
export default CanvasArea;
