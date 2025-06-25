
import React from 'react';
import { Rnd, Props as RndProps } from 'react-rnd';
import { OpenAppInstance } from '../types';
import { X, Minus } from 'lucide-react';

interface AppWindowProps {
  appInstance: OpenAppInstance;
  onClose: (instanceId: string) => void;
  onMinimize: (instanceId: string) => void;
  onFocus: (instanceId: string) => void;
  onDragStop: (instanceId: string, x: number, y: number) => void;
  onResizeStop: (instanceId: string, x: number, y: number, width: string | number, height: string | number) => void;
  bounds: string; // Parent bounds for RND
}

const AppWindow: React.FC<AppWindowProps> = ({
  appInstance,
  onClose,
  onMinimize,
  onFocus,
  onDragStop,
  onResizeStop,
  bounds,
}) => {
  if (appInstance.isMinimized) {
    return null; // Minimized windows are handled by the Dock/Taskbar
  }

  const AppContentComponent = appInstance.component;

  const handleDragStop: RndProps['onDragStop'] = (_e, d) => {
    onDragStop(appInstance.instanceId, d.x, d.y);
    onFocus(appInstance.instanceId);
  };

  const handleResizeStop: RndProps['onResizeStop'] = (_e, _direction, ref, _delta, position) => {
    onResizeStop(appInstance.instanceId, position.x, position.y, ref.style.width, ref.style.height);
    onFocus(appInstance.instanceId);
  };
  
  const handleFocus = () => {
    onFocus(appInstance.instanceId);
  };

  return (
    <Rnd
      size={{ width: appInstance.size.width, height: appInstance.size.height }}
      position={{ x: appInstance.position.x, y: appInstance.position.y }}
      onDragStart={handleFocus}
      onDragStop={handleDragStop}
      onResizeStart={handleFocus}
      onResizeStop={handleResizeStop}
      minWidth={200}
      minHeight={150}
      bounds={bounds} // Constrain to parent element (e.g., ".desktop-area")
      style={{ zIndex: appInstance.zIndex }}
      className="shadow-2xl border border-os-border bg-os-surface rounded-lg flex flex-col overflow-hidden"
      dragHandleClassName="react-rnd-drag-handle"
      onMouseDownCapture={handleFocus} // Capture mousedown to focus window
    >
      <div 
        className="react-rnd-drag-handle h-8 bg-os-handle flex items-center justify-between px-2 text-os-text-dim select-none rounded-t-lg"
      >
        <span className="font-medium text-sm truncate">{appInstance.title}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(appInstance.instanceId); }}
            className="p-1 hover:bg-white/10 rounded focus:outline-none"
            aria-label="Minimize"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(appInstance.instanceId);}}
            className="p-1 hover:bg-red-500/80 hover:text-white rounded focus:outline-none"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto bg-os-surface rounded-b-lg">
        <AppContentComponent instanceId={appInstance.instanceId} />
      </div>
    </Rnd>
  );
};

export default AppWindow;
