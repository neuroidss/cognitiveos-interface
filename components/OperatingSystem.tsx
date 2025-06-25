import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppDefinition, OpenAppInstance, ToolDefinition } from '../types';
import { AVAILABLE_APPS } from '../constants';
import AppWindow from './AppWindow';
import { Dock } from './Dock';
import { useNeuroLink } from '../hooks/useNeuroLink';
import { loadTools, addTool } from '../services/localStorageService'; // Import tool services

const DESKTOP_MARGIN = 8; // Margin around the desktop area for windows

const initializeDefaultTools = () => {
  const existingTools = loadTools();
  if (existingTools.length === 0) {
    console.log("No custom tools found. Initializing default 'calculator' tool.");
    const calculatorTool: ToolDefinition = {
      id: 'default-calculator-' + Date.now(),
      toolName: 'calculator',
      description: 'Evaluates a simple mathematical expression string (e.g., "2+2*3"). Returns the result or an error message.',
      parameters: [{ name: 'expression', type: 'string', description: 'The mathematical expression string to evaluate.' }],
      code: `try {
  // A simple check to prevent overly complex/long expressions or obviously malicious code.
  // This is NOT a foolproof security measure for a production system.
  if (expression.length > 100 || expression.match(/[^0-9\\+\\-\\*\\/\\.\\s\\(\\)]/g)) {
    return "Error: Expression seems invalid or too complex.";
  }
  return eval(expression);
} catch (e) {
  return "Error: Invalid mathematical expression - " + e.message;
}`
    };
    addTool(calculatorTool);
    console.log("Default 'calculator' tool added to localStorage.");

    // Add another example tool - fetchAndSummarizeUrl (mocked, as fetch needs CORS or proxy)
    const fetchTool: ToolDefinition = {
      id: 'default-fetchAndSummarizeUrl-' + Date.now(),
      toolName: 'fetchAndSummarizeUrl',
      description: 'MOCK: Takes a URL, pretends to fetch its content, and returns a short summary. For a real version, this needs a backend proxy due to CORS.',
      parameters: [{ name: 'url', type: 'string', description: 'The URL of the webpage to summarize.' }],
      code: `// This is a MOCK implementation. Real fetch from client-side JS is restricted by CORS.
// A real version would typically call a backend proxy/service.
console.log('MOCK fetchAndSummarizeUrl called with URL:', url);
await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
if (url.includes('error')) {
  return "MOCK Error: Could not fetch content from " + url;
}
return \`MOCK Summary for \${url}: This is a placeholder summary. The page discusses important topics related to web content and kittens. Length: \${Math.floor(Math.random()*500 + 100)} words.\`;`
    };
    addTool(fetchTool);
    console.log("Default 'fetchAndSummarizeUrl' (mock) tool added to localStorage.");
  }
};


export const OperatingSystem: React.FC = () => {
  const [openApps, setOpenApps] = useState<OpenAppInstance[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(100); 
  const desktopAreaRef = useRef<HTMLDivElement>(null);

  const neuroLink = useNeuroLink();

  useEffect(() => {
    initializeDefaultTools(); // Initialize default tools on first load
    
    const defaultOpen = AVAILABLE_APPS.filter(app => app.isDefaultOpen)
      .map((appDef, index) => createNewAppInstance(appDef, index));
    setOpenApps(defaultOpen);
    if (defaultOpen.length > 0) {
      setMaxZIndex(100 + defaultOpen.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const createNewAppInstance = (appDef: AppDefinition, indexOffset: number = 0): OpenAppInstance => {
    const newZIndex = maxZIndex + indexOffset + 1;
    let initialX = appDef.defaultPosition?.x ?? 50 + indexOffset * 30;
    let initialY = appDef.defaultPosition?.y ?? 50 + indexOffset * 30;

    if (desktopAreaRef.current) {
        const desktopWidth = desktopAreaRef.current.offsetWidth;
        const desktopHeight = desktopAreaRef.current.offsetHeight;
        const windowWidth = typeof appDef.defaultSize.width === 'number' ? appDef.defaultSize.width : parseInt(String(appDef.defaultSize.width), 10);
        const windowHeight = typeof appDef.defaultSize.height === 'number' ? appDef.defaultSize.height : parseInt(String(appDef.defaultSize.height), 10);

        if (initialX + windowWidth > desktopWidth - DESKTOP_MARGIN) {
            initialX = Math.max(DESKTOP_MARGIN, desktopWidth - windowWidth - DESKTOP_MARGIN);
        }
        if (initialY + windowHeight > desktopHeight - DESKTOP_MARGIN) {
            initialY = Math.max(DESKTOP_MARGIN, desktopHeight - windowHeight - DESKTOP_MARGIN);
        }
        initialX = Math.max(DESKTOP_MARGIN, initialX);
        initialY = Math.max(DESKTOP_MARGIN, initialY);
    }

    return {
      instanceId: `${appDef.id}-${Date.now()}`,
      appDefId: appDef.id,
      title: appDef.name,
      component: appDef.component,
      position: { x: initialX, y: initialY },
      size: { ...appDef.defaultSize },
      zIndex: newZIndex,
      isMinimized: false,
    };
  };

  const launchApp = useCallback((appId: string) => {
    const appDef = AVAILABLE_APPS.find(app => app.id === appId);
    if (!appDef) return;

    if (appDef.singleton) {
        const existingInstance = openApps.find(app => app.appDefId === appId);
        if (existingInstance) {
            focusApp(existingInstance.instanceId);
            return;
        }
    }

    const newAppInstance = createNewAppInstance(appDef, openApps.length);
    setOpenApps(prev => [...prev, newAppInstance]);
    setMaxZIndex(newAppInstance.zIndex);
  }, [openApps, maxZIndex]);

  const closeApp = useCallback((instanceId: string) => {
    setOpenApps(prev => prev.filter(app => app.instanceId !== instanceId));
  }, []);

  const minimizeApp = useCallback((instanceId: string) => {
    setOpenApps(prev =>
      prev.map(app =>
        app.instanceId === instanceId ? { ...app, isMinimized: true } : app
      )
    );
  }, []);

  const focusApp = useCallback((instanceId: string) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setOpenApps(prev =>
      prev.map(app =>
        app.instanceId === instanceId
          ? { ...app, zIndex: newZ, isMinimized: false }
          : app
      )
    );
  }, [maxZIndex]);

  const handleDragStop = useCallback((instanceId: string, x: number, y: number) => {
    setOpenApps(prev =>
      prev.map(app =>
        app.instanceId === instanceId ? { ...app, position: { x, y } } : app
      )
    );
  }, []);

  const handleResizeStop = useCallback((instanceId: string, x: number, y: number, width: string | number, height: string | number) => {
    setOpenApps(prev =>
      prev.map(app =>
        app.instanceId === instanceId ? { ...app, position: {x,y}, size: { width, height } } : app
      )
    );
  }, []);
  
  const handleNeuroLinkScan = () => {
    neuroLink.startScan();
    if(neuroLink.discoveredDevices.length > 0) {
        console.log("NeuroLink PoC: Devices found after scan initiated by OS:", neuroLink.discoveredDevices);
    }
  };

  return (
    <div className="h-full w-full flex flex-col select-none">
      <div ref={desktopAreaRef} className="desktop-area flex-grow relative p-2 overflow-hidden bg-gradient-to-br from-os-background to-slate-800">
        {/* Added a subtle gradient background */}
        {openApps.map(appInstance => (
          <AppWindow
            key={appInstance.instanceId}
            appInstance={appInstance}
            onClose={closeApp}
            onMinimize={minimizeApp}
            onFocus={focusApp}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            bounds=".desktop-area"
          />
        ))}
      </div>
      <Dock
        availableApps={AVAILABLE_APPS}
        openApps={openApps}
        onLaunchApp={launchApp}
        onFocusApp={focusApp}
        onNeuroLinkScan={handleNeuroLinkScan}
        neuroLinkError={neuroLink.error}
        isScanningNeuroLink={neuroLink.isScanning}
      />
    </div>
  );
};
