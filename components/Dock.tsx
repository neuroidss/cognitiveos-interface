
import React from 'react';
import { AppDefinition, OpenAppInstance } from '../types';
import { Bluetooth, AlertCircle } from 'lucide-react'; // Added AlertCircle

interface DockProps {
  availableApps: AppDefinition[];
  openApps: OpenAppInstance[];
  onLaunchApp: (appId: string) => void;
  onFocusApp: (instanceId: string) => void;
  onNeuroLinkScan: () => void;
  neuroLinkError: string | null;
  isScanningNeuroLink: boolean;
}

const DockItem: React.FC<{
  appDef?: AppDefinition;
  openAppInstance?: OpenAppInstance;
  onClick: () => void;
  isMinimized?: boolean;
  isActive?: boolean;
}> = ({ appDef, openAppInstance, onClick, isMinimized, isActive }) => {
  const displayApp = appDef || openAppInstance; // Use appDef for launchable, openAppInstance for running
  if (!displayApp) return null;

  const icon = appDef?.icon || <div className="w-5 h-5 bg-os-primary rounded-sm" />; // Fallback icon
  const name = appDef?.name || openAppInstance?.title;

  return (
    <button
      onClick={onClick}
      title={name}
      className={`relative p-2 h-12 w-12 flex items-center justify-center rounded-md hover:bg-os-surface focus:outline-none focus:ring-2 focus:ring-os-primary transition-colors
                  ${isActive ? 'bg-os-primary/30' : 'bg-transparent'}`}
    >
      {icon}
      {(openAppInstance || isMinimized) && (
        <span
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full 
                      ${isMinimized ? 'bg-yellow-400' : 'bg-os-secondary'}`}
        ></span>
      )}
    </button>
  );
};


export const Dock: React.FC<DockProps> = ({
  availableApps,
  openApps,
  onLaunchApp,
  onFocusApp,
  onNeuroLinkScan,
  neuroLinkError,
  isScanningNeuroLink,
}) => {
  // Create a map of open apps by their appDefId for quick lookup
  const openAppMap = new Map<string, OpenAppInstance[]>();
  openApps.forEach(app => {
    if (!openAppMap.has(app.appDefId)) {
        openAppMap.set(app.appDefId, []);
    }
    openAppMap.get(app.appDefId)!.push(app);
  });


  return (
    <div className="h-16 bg-os-surface/80 backdrop-blur-md border-t border-os-border flex items-center justify-center space-x-2 px-4 shadow-md">
      {availableApps.map((appDef) => {
         const instances = openAppMap.get(appDef.id) || [];
         const firstInstance = instances[0]; // If singleton, this is the one. If multiple, focuses first.
         const isRunning = instances.length > 0;
         const isMinimized = firstInstance?.isMinimized === true;

        return (
          <DockItem
            key={appDef.id}
            appDef={appDef}
            openAppInstance={firstInstance}
            isMinimized={isRunning && isMinimized}
            isActive={isRunning && !isMinimized} // Highlight if running and not minimized
            onClick={() => {
              if (isRunning) {
                onFocusApp(firstInstance.instanceId); // Focus existing instance
              } else {
                onLaunchApp(appDef.id); // Launch new instance
              }
            }}
          />
        );
      })}

      <div className="flex-grow"></div> {/* Spacer */}

      <button
        onClick={onNeuroLinkScan}
        disabled={isScanningNeuroLink}
        title={neuroLinkError ? `NeuroLink Error: ${neuroLinkError}` : (isScanningNeuroLink ? "Scanning for BCI..." : "Connect BCI (NeuroLink)")}
        className={`p-2 h-12 w-12 flex items-center justify-center rounded-md hover:bg-os-surface focus:outline-none focus:ring-2 focus:ring-os-primary transition-colors
                    ${neuroLinkError ? 'text-os-error hover:bg-os-error/20' : 'text-os-primary'}
                    ${isScanningNeuroLink ? 'animate-pulse' : ''}`}
      >
        {neuroLinkError ? <AlertCircle size={24} /> : <Bluetooth size={24} />}
      </button>
    </div>
  );
};
