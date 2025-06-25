import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppWindowContentProps, Message, ToolDefinition, ToolCallRequest } from '../../types';
import { sendCLIMessage, sendToolResultToAI } from '../../services/geminiService';
import { loadTools, findToolByName } from '../../services/localStorageService';
import { CornerDownLeft, ChevronsRight, Loader2, Zap, Settings2 } from 'lucide-react';

export const MindCLIApp: React.FC<AppWindowContentProps> = ({ instanceId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentToolCall, setCurrentToolCall] = useState<ToolCallRequest['tool_call'] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    setMessages([
      { 
        id: 'welcome-msg', 
        text: 'Welcome to Mind-CLI. Type "help" for commands or to see available tools.', 
        sender: 'system', 
        timestamp: new Date() 
      }
    ]);
  }, [instanceId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const addMessage = (text: string, sender: Message['sender'], toolName?: string) => {
    const newMessage: Message = {
      id: `${sender}-${Date.now()}`,
      text,
      sender,
      timestamp: new Date(),
      toolName,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const executeTool = async (tool: ToolDefinition, args: Record<string, any>, originalUserMessageText: string) => {
    addMessage(`Executing tool: ${tool.toolName} with arguments: ${JSON.stringify(args)}`, 'system', tool.toolName);
    setIsLoading(true);
    
    try {
      const paramNames = tool.parameters.map(p => p.name);
      const argValues = tool.parameters.map(p => args[p.name]);
      
      // Dynamically create the function.
      // The Object.getPrototypeOf(async function(){}).constructor creates an AsyncFunction.
      const funcConstructor = Object.getPrototypeOf(async function(){}).constructor;
      const func = funcConstructor(...paramNames, tool.code);
      
      const result = await func(...argValues);
      
      addMessage(`Tool ${tool.toolName} executed. Result: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`, 'tool_result', tool.toolName);
      
      // Send result back to AI
      const finalAiResponse = await sendToolResultToAI(originalUserMessageText, tool.toolName, result);
      addMessage(finalAiResponse, 'ai');

    } catch (e) {
      const error = e as Error;
      console.error(`Error executing tool ${tool.toolName}:`, error);
      addMessage(`Error executing tool ${tool.toolName}: ${error.message}`, 'system');
      // Fallback to AI without tool result if execution fails
      const fallbackResponse = await sendCLIMessage(`There was an error executing the tool ${tool.toolName} for my previous request ("${originalUserMessageText}"). The error was: ${error.message}. Can you proceed or suggest an alternative?`, messages);
      addMessage(fallbackResponse, 'ai');
    } finally {
      setIsLoading(false);
      setCurrentToolCall(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };


  const handleSubmit = useCallback(async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessageText = trimmedInput;
    addMessage(userMessageText, 'user');
    setInputValue('');
    setIsLoading(true);

    try {
      const availableTools = loadTools();
      const toolsManifest = availableTools.map(t => ({ toolName: t.toolName, description: t.description }));
      
      const aiResponseText = await sendCLIMessage(userMessageText, messages, toolsManifest);

      try {
        const potentialToolCall = JSON.parse(aiResponseText) as ToolCallRequest;
        if (potentialToolCall && potentialToolCall.tool_call && potentialToolCall.tool_call.name) {
          setCurrentToolCall(potentialToolCall.tool_call);
          const toolToExecute = findToolByName(potentialToolCall.tool_call.name);
          if (toolToExecute) {
            await executeTool(toolToExecute, potentialToolCall.tool_call.arguments, userMessageText);
          } else {
            addMessage(`AI tried to use a tool named "${potentialToolCall.tool_call.name}" but it was not found.`, 'system');
            setIsLoading(false);
          }
        } else {
          // Not a tool call, or malformed JSON
          addMessage(aiResponseText, 'ai');
          setIsLoading(false);
        }
      } catch (e) {
        // Response was not JSON, so it's a direct text response
        addMessage(aiResponseText, 'ai');
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Error sending message to CLI:', error);
      addMessage('Error: Could not get a response. Please try again.', 'system');
      setIsLoading(false);
    } finally {
      // Ensure input is focused after response, unless a tool is being processed further
      if (!currentToolCall) {
         setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }, [inputValue, isLoading, messages, currentToolCall]);

  return (
    <div 
        className="h-full flex flex-col bg-os-surface text-os-text p-3 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-grow overflow-y-auto pr-2 space-y-3 mb-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-2 rounded-lg shadow ${
              msg.sender === 'user' ? 'bg-os-primary/30 text-os-text' : 
              msg.sender === 'ai' ? 'bg-os-handle/50 text-os-text' :
              msg.sender === 'tool_result' ? 'bg-purple-600/30 text-purple-200 border border-purple-500' :
              'bg-os-background/50 text-os-text-dim' // system messages
            }`}>
              {msg.sender === 'user' && (
                <div>
                  <span className="font-semibold text-os-primary mr-1">You:</span>
                  <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                </div>
              )}
              {msg.sender === 'ai' && (
                <div>
                  <span className="font-semibold text-os-secondary mr-1">AI:</span>
                  <span className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: msg.text.replace(/```([^`]+)```/gs, '<pre class="bg-os-background/50 p-2 rounded-md my-1 text-xs overflow-x-auto">$1</pre>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                </div>
              )}
              {msg.sender === 'system' && (
                 <div className="italic">
                  {msg.toolName ? <Settings2 size={14} className="inline mr-1 mb-0.5 text-yellow-400" /> : <Zap size={14} className="inline mr-1 mb-0.5 text-blue-400" />}
                  <span className="font-semibold mr-1">{msg.toolName ? `Tool (${msg.toolName}):` : `System:`}</span>
                  <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                </div>
              )}
              {msg.sender === 'tool_result' && (
                <div>
                  <span className="font-semibold text-purple-300 mr-1">Tool Result ({msg.toolName}):</span>
                  <pre className="whitespace-pre-wrap break-words text-xs p-1 bg-black/20 rounded mt-1">{msg.text}</pre>
                </div>
              )}
              <div className="text-xs text-os-text-dim/70 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && !currentToolCall && ( // Show general loading only if not in middle of tool exec
          <div className="flex items-center text-os-text-dim p-2 rounded-lg bg-os-background/50 max-w-[85%]">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span>AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center border-t border-os-border pt-2">
        <ChevronsRight size={20} className="text-os-primary mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={isLoading ? (currentToolCall ? `AI is using tool: ${currentToolCall.name}...` : "AI is processing...") : "Type your command..."}
          disabled={isLoading}
          className="flex-grow bg-transparent text-os-text-input focus:outline-none placeholder-os-text-dim"
          spellCheck="false"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="ml-2 p-2 text-os-primary hover:text-os-secondary disabled:text-os-text-dim focus:outline-none flex-shrink-0"
          aria-label="Send command"
        >
          <CornerDownLeft size={20} />
        </button>
      </form>
    </div>
  );
};
