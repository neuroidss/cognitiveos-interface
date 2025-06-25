import React from 'react';
import { AppDefinition, AppWindowContentProps } from './types';
import { MindCLIApp } from './components/apps/MindCLIApp';
import { ToolCreatorApp } from './components/apps/ToolCreatorApp'; // Import ToolCreatorApp
import { TerminalSquare, BrainCircuit, Columns2, Code2, Wrench } from 'lucide-react'; // Added Wrench

const PlaceholderApp: React.FC<AppWindowContentProps> = ({ instanceId }) => (
  <div className="p-4 bg-os-surface text-os-text h-full flex flex-col items-center justify-center">
    <h2 className="text-xl font-semibold mb-2">Placeholder App</h2>
    <p className="text-sm text-os-text-dim">Instance ID: {instanceId}</p>
    <p className="mt-4">This application is not yet implemented.</p>
    <img src="https://picsum.photos/300/200" alt="Placeholder" className="mt-4 rounded shadow-lg" />
  </div>
);

export const AVAILABLE_APPS: AppDefinition[] = [
  {
    id: 'mindCLI',
    name: 'Mind-CLI',
    icon: <TerminalSquare size={20} className="text-os-primary" />,
    component: MindCLIApp,
    defaultSize: { width: 700, height: 500 },
    defaultPosition: { x: 50, y: 50 },
    isDefaultOpen: true,
    singleton: true,
  },
  {
    id: 'toolCreator',
    name: 'Tool Creator',
    icon: <Wrench size={20} className="text-orange-400" />, // Added Tool Creator
    component: ToolCreatorApp,
    defaultSize: { width: 750, height: 650 },
    defaultPosition: { x: 200, y: 100 },
    singleton: true,
  },
  {
    id: 'neuroMetrics',
    name: 'Neuro-Metrics',
    icon: <BrainCircuit size={20} className="text-green-400" />,
    component: PlaceholderApp,
    defaultSize: { width: 600, height: 450 },
    defaultPosition: { x: 150, y: 150 },
    singleton: true,
  },
  {
    id: 'missionControl',
    name: 'Mission Control',
    icon: <Columns2 size={20} className="text-yellow-400" />,
    component: PlaceholderApp,
    defaultSize: { width: 800, height: 600 },
    defaultPosition: { x: 250, y: 250 },
  },
  {
    id: 'sandboxEditor',
    name: 'Sandbox Editor',
    icon: <Code2 size={20} className="text-purple-400" />,
    component: PlaceholderApp,
    defaultSize: { width: 900, height: 700 },
    defaultPosition: { x: 100, y: 100 },
  },
];
