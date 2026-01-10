
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Template, CanvasElement } from '../types';

interface CanvasAreaProps {
  template: Template;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  snapToGrid: boolean;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({ template, onUpdateElement, snapToGrid }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Interaction State
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Handle Keyboard for Pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.1 : 0.9;
        setScale(prev => Math.max(0.1, Math.min(5, prev * factor)));
      }
    };

    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (viewport) {
        viewport.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent, element?: CanvasElement | 'base') => {
    if (isSpacePressed) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (element === 'base') {
      setActiveElementId('base');
      return;
    }

    if (element) {
      if (element.isLocked) return;
      e.stopPropagation();
      setActiveElementId(element.id);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;
        setDragOffset({ x: clickX - element.x, y: clickY - element.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!activeElementId || activeElementId === 'base' || !containerRef.current) return;
    const element = template.elements.find(el => el.id === activeElementId);
    if (!element || element.isLocked) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;
    
    if (snapToGrid) {
      newX = Math.round(newX / 2) * 2;
      newY = Math.round(newY / 2) * 2;
    }
    
    newX = Math.max(-50, Math.min(150, newX));
    newY = Math.max(-50, Math.min(150, newY));
    
    onUpdateElement(activeElementId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setActiveElementId(null);
    setIsPanning(false);
  };

  const handleImageLoad = () => {
    if (imgRef.current) {
      setNaturalDimensions({ 
        width: imgRef.current.naturalWidth, 
        height: imgRef.current.naturalHeight 
      });
      setContainerWidth(imgRef.current.clientWidth);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setActiveElementId(null);
      setIsPanning(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const previewScale = naturalDimensions.width > 0 ? (containerWidth / naturalDimensions.width) : 1;

  return (
    <div 
      ref={viewportRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden cursor-default ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div 
        ref={containerRef}
        className="relative shadow-2xl bg-white select-none transition-transform duration-75 ease-out"
        style={{ 
          display: 'inline-block',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: 'auto'
        }}
      >
        <img 
          ref={imgRef} 
          src={template.baseImage} 
          alt="Plantilla base" 
          className={`block w-full h-auto max-h-[calc(100vh-160px)] object-contain transition-all ${activeElementId === 'base' ? 'ring-2 ring-indigo-500' : ''}`} 
          draggable={false} 
          onLoad={handleImageLoad}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'base'); }}
          style={{
            opacity: template.baseOpacity ?? 1,
            mixBlendMode: template.baseBlendMode as any,
            transform: `rotate(${template.baseRotation || 0}deg)`,
            borderRadius: `${(template.baseBorderRadius || 0) * previewScale}px`
          }}
        />
        
        {snapToGrid && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-10" 
            style={{ 
              backgroundImage: `radial-gradient(circle, #4f46e5 1px, transparent 1px)`, 
              backgroundSize: '40px 40px' 
            }} 
          />
        )}
        
        {naturalDimensions.width > 0 && template.elements.map(el => {
          const displayWidthPercent = (el.width / naturalDimensions.width) * 100;
          const displayHeightPercent = (el.height / naturalDimensions.height) * 100;
          const fontWeight = el.styling.bold ? 'bold' : (el.styling.semibold ? '600' : 'normal');

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleMouseDown(e, el)}
              className={`absolute transition-shadow cursor-move box-border ${activeElementId === el.id ? 'ring-2 ring-indigo-500 shadow-xl z-[100]' : ''} ${el.isLocked ? 'cursor-not-allowed' : 'hover:ring-1 hover:ring-indigo-300'}`}
              style={{
                left: `${el.x}%`, 
                top: `${el.y}%`, 
                width: `${displayWidthPercent}%`, 
                height: el.height ? `${displayHeightPercent}%` : 'auto',
                zIndex: el.zIndex, 
                opacity: el.opacity ?? 1, 
                mixBlendMode: el.blendMode as any, 
                transform: `rotate(${el.rotation || 0}deg)`,
                transformOrigin: 'center center', 
                overflow: 'hidden', 
                backgroundColor: 'transparent',
                borderRadius: `${(el.borderRadius || 0) * previewScale}px`
              }}
            >
              {el.type === 'text' ? (
                <div
                  style={{
                    color: el.styling.color, 
                    fontSize: `${el.styling.fontSize * previewScale}px`, 
                    fontFamily: el.styling.fontFamily,
                    fontWeight, 
                    fontStyle: el.styling.italic ? 'italic' : 'normal', 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: 1.2,
                    width: '100%', 
                    height: '100%', 
                    display: 'block', 
                    wordBreak: 'break-word', 
                    overflowWrap: 'anywhere', 
                    backgroundColor: 'transparent',
                    letterSpacing: `${(el.styling.letterSpacing || 0) * previewScale}px`
                  }}
                  className="p-0"
                >
                  {el.content}
                </div>
              ) : (
                <img 
                  src={el.content} 
                  alt="Superposición" 
                  className="w-full h-full object-cover rounded shadow-sm" 
                  draggable={false} 
                  style={{ backgroundColor: 'transparent', borderRadius: `${(el.borderRadius || 0) * previewScale}px` }} 
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border ${scale !== 1 || pan.x !== 0 || pan.y !== 0 ? 'bg-indigo-600/90 text-white border-indigo-400' : 'bg-gray-800/50 text-gray-300 border-gray-700'}`}>
          Zoom: {Math.round(scale * 100)}%
        </div>
        {(pan.x !== 0 || pan.y !== 0) && (
          <button 
            onClick={() => { setPan({x: 0, y: 0}); setScale(1); }}
            className="pointer-events-auto px-3 py-1.5 bg-gray-800/90 text-white border border-gray-700 rounded-full text-[10px] font-bold uppercase hover:bg-gray-700 transition-colors"
          >
            Reiniciar Vista
          </button>
        )}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest flex gap-4">
          <span>Ctrl + Rueda para Zoom</span>
          <span className="w-px bg-gray-700" />
          <span>Espacio + Arrastre para Desplazar</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
