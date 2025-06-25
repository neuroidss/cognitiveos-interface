
import React from 'react';
import { OperatingSystem } from './components/OperatingSystem';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-os-background text-os-text overflow-hidden">
      <OperatingSystem />
    </div>
  );
};

export default App;
