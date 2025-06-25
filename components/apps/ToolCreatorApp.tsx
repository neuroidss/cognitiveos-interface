import React, { useState } from 'react';
import { AppWindowContentProps, ToolDefinition, ToolParameter } from '../../types';
import { addTool } from '../../services/localStorageService';
import { Save, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

export const ToolCreatorApp: React.FC<AppWindowContentProps> = ({ instanceId }) => {
  const [toolName, setToolName] = useState('');
  const [description, setDescription] = useState('');
  const [parametersStr, setParametersStr] = useState('[\n  {\n    "name": "param1",\n    "type": "string",\n    "description": "Description of param1"\n  }\n]');
  const [code, setCode] = useState('// Your JavaScript code here (function body)\n// Example: return `Hello, ${param1}!`;\n// If async: await someAsyncOperation(); return result;');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setToolName('');
    setDescription('');
    setParametersStr('[\n  {\n    "name": "param1",\n    "type": "string",\n    "description": "Description of param1"\n  }\n]');
    setCode('// Your JavaScript code here (function body)\n// Example: return `Hello, ${param1}!`;\n// If async: await someAsyncOperation(); return result;');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!toolName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
      setError('Tool Name must be a valid JavaScript identifier (camelCase recommended, e.g., myToolName).');
      return;
    }
    if (!description.trim()) {
      setError('Description cannot be empty.');
      return;
    }
    if (!code.trim()) {
      setError('Code cannot be empty.');
      return;
    }

    let parsedParameters: ToolParameter[];
    try {
      parsedParameters = JSON.parse(parametersStr);
      if (!Array.isArray(parsedParameters) || !parsedParameters.every(p => p.name && p.type && p.description)) {
        throw new Error('Parameters JSON must be an array of objects, each with name, type, and description properties.');
      }
    } catch (e) {
      const err = e as Error;
      setError(`Invalid Parameters JSON: ${err.message}`);
      return;
    }

    const newTool: ToolDefinition = {
      id: `tool-${toolName}-${Date.now()}`, // Unique ID
      toolName,
      description,
      parameters: parsedParameters,
      code,
    };

    const added = addTool(newTool);
    if (added) {
      setSuccess(`Tool "${toolName}" created successfully! You can now use it in Mind-CLI.`);
      // Optionally reset form after a short delay or keep data
      // resetForm(); 
    } else {
      // addTool internally handles alert for existing tool, but we can set error here too
      setError(`Failed to add tool "${toolName}". It might already exist.`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-os-surface text-os-text p-4 font-sans text-sm overflow-y-auto">
      <h1 className="text-xl font-semibold text-os-primary mb-4">Tool Creator</h1>
      <p className="text-os-text-dim mb-4">
        Define custom tools that Mind-CLI (and the underlying AI) can use to perform actions.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-os-error/20 text-os-error rounded-md flex items-center">
          <AlertTriangle size={20} className="mr-2"/>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-os-secondary/20 text-os-secondary rounded-md flex items-center">
          <CheckCircle size={20} className="mr-2"/>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`${instanceId}-toolName`} className="block text-sm font-medium text-os-text-dim mb-1">
            Tool Name (camelCase, unique)
          </label>
          <input
            id={`${instanceId}-toolName`}
            type="text"
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder="e.g., fetchAndSummarizeUrl"
            className="w-full p-2 bg-os-background border border-os-border rounded-md focus:ring-os-primary focus:border-os-primary text-os-text-input"
            required
          />
        </div>

        <div>
          <label htmlFor={`${instanceId}-description`} className="block text-sm font-medium text-os-text-dim mb-1">
            Description (natural language, for AI to understand tool's purpose)
          </label>
          <textarea
            id={`${instanceId}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Takes a URL of a webpage, fetches its content, and returns a brief summary."
            className="w-full p-2 h-24 bg-os-background border border-os-border rounded-md focus:ring-os-primary focus:border-os-primary text-os-text-input"
            required
          />
        </div>

        <div>
          <label htmlFor={`${instanceId}-parameters`} className="block text-sm font-medium text-os-text-dim mb-1">
            Parameters (JSON array)
          </label>
          <textarea
            id={`${instanceId}-parameters`}
            value={parametersStr}
            onChange={(e) => setParametersStr(e.target.value)}
            className="w-full p-2 h-32 bg-os-background border border-os-border rounded-md font-mono text-xs focus:ring-os-primary focus:border-os-primary text-os-text-input"
            spellCheck="false"
            required
          />
          <p className="text-xs text-os-text-dim mt-1">
            Example: <code className="text-os-secondary">[{"{ \"name\": \"url\", \"type\": \"string\", \"description\": \"Target URL\" }"} ]</code>
          </p>
        </div>

        <div>
          <label htmlFor={`${instanceId}-code`} className="block text-sm font-medium text-os-text-dim mb-1">
            JavaScript Code (Function Body)
          </label>
          <textarea
            id={`${instanceId}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// const result = await fetch(url); return result.text();"
            className="w-full p-2 h-40 bg-os-background border border-os-border rounded-md font-mono text-xs focus:ring-os-primary focus:border-os-primary text-os-text-input"
            spellCheck="false"
            required
          />
           <p className="text-xs text-os-text-dim mt-1">
            Only provide the body of the function. Parameters defined above will be available by name. Use `await` for async operations.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-os-primary text-white rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-os-primary focus:ring-opacity-50 flex items-center"
          >
            <Save size={18} className="mr-2" />
            Save Tool
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-os-handle text-os-text rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-os-primary focus:ring-opacity-50 flex items-center"
          >
            <RotateCcw size={18} className="mr-2" />
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};
