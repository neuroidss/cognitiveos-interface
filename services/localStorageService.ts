import { ToolDefinition } from '../types';

const TOOLS_STORAGE_KEY = 'cognitive_os_tools';

export const loadTools = (): ToolDefinition[] => {
  try {
    const toolsJson = localStorage.getItem(TOOLS_STORAGE_KEY);
    if (toolsJson) {
      return JSON.parse(toolsJson) as ToolDefinition[];
    }
  } catch (error) {
    console.error("Error loading tools from localStorage:", error);
  }
  return [];
};

export const saveTools = (tools: ToolDefinition[]): void => {
  try {
    localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
  } catch (error) {
    console.error("Error saving tools to localStorage:", error);
  }
};

export const addTool = (newTool: ToolDefinition): boolean => {
  const tools = loadTools();
  if (tools.some(tool => tool.toolName === newTool.toolName)) {
    console.warn(`Tool with name "${newTool.toolName}" already exists.`);
    alert(`Error: Tool with name "${newTool.toolName}" already exists. Please choose a unique name.`);
    return false;
  }
  tools.push(newTool);
  saveTools(tools);
  return true;
};

export const findToolByName = (toolName: string): ToolDefinition | undefined => {
  const tools = loadTools();
  return tools.find(tool => tool.toolName === toolName);
};

export const removeTool = (toolName: string): void => {
  let tools = loadTools();
  tools = tools.filter(tool => tool.toolName !== toolName);
  saveTools(tools);
};
