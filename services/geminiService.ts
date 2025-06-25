import { Message, ToolDefinition, ToolCallRequest } from '../types';
import { loadTools } from './localStorageService'; // To access tools for more intelligent mocking

// For future real implementation with Gemini API:
// import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

// --- Gemini API Key Configuration (Future Use) ---
// IMPORTANT: The API key MUST be obtained EXCLUSIVELY from the environment variable `process.env.API_KEY`.
// This variable is assumed to be pre-configured in the execution environment.
// DO NOT provide UI or code for users to enter the API key.

// let ai: GoogleGenAI | null = null;
// const API_KEY = process.env.API_KEY;

// if (API_KEY) {
//   try {
//      ai = new GoogleGenAI({ apiKey: API_KEY });
//   } catch (error) {
//     console.error("Failed to initialize GoogleGenAI:", error);
//     // Potentially set a global error state or provide a fallback
//   }
// } else {
//   console.warn(
//     "API_KEY environment variable not set. Gemini API features will be unavailable. Using mock service."
//   );
// }

// --- Mock API Implementation ---

interface ToolManifestItem {
  toolName: string;
  description: string;
}

export const sendCLIMessage = async (
  messageText: string,
  _conversationHistory: Message[], // Parameter for future use with real API context
  toolsManifest?: ToolManifestItem[] 
): Promise<string> => { // Returns string, which might be JSON for tool_call
  console.log('Mock AI Service: Received message:', messageText);
  if (toolsManifest && toolsManifest.length > 0) {
    console.log('Mock AI Service: Available tools:', toolsManifest);
  }
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 700 + 300));

  const lowerCaseMessage = messageText.toLowerCase().trim();

  // Simulate tool call for calculator
  const calculatorTool = toolsManifest?.find(t => t.toolName === 'calculator');
  if (calculatorTool && (lowerCaseMessage.startsWith('calculate') || lowerCaseMessage.startsWith('what is') || lowerCaseMessage.startsWith('compute')) && lowerCaseMessage.match(/(\d+(\s*[\+\-\*\/]\s*\d+)+)/)) {
    const expressionMatch = lowerCaseMessage.match(/(\d+(\s*[\+\-\*\/]\s*\d+)+)/);
    if (expressionMatch && expressionMatch[1]) {
      const toolCall: ToolCallRequest = {
        tool_call: {
          name: "calculator",
          arguments: { expression: expressionMatch[1].replace(/\s/g, '') }
        }
      };
      console.log("Mock AI: Decided to call 'calculator' tool.", toolCall);
      return JSON.stringify(toolCall);
    }
  }

  // Simulate tool call for a hypothetical fetchAndSummarizeUrl tool
  const summarizeTool = toolsManifest?.find(t => t.toolName === 'fetchAndSummarizeUrl');
  if (summarizeTool && (lowerCaseMessage.startsWith('summarize') || lowerCaseMessage.startsWith('fetch and summarize')) && lowerCaseMessage.includes('http')) {
      const urlMatch = lowerCaseMessage.match(/(https?:\/\/\S+)/);
      if (urlMatch && urlMatch[1]) {
          const toolCall: ToolCallRequest = {
              tool_call: {
                  name: "fetchAndSummarizeUrl",
                  arguments: { url: urlMatch[1] }
              }
          };
          console.log("Mock AI: Decided to call 'fetchAndSummarizeUrl' tool.", toolCall);
          return JSON.stringify(toolCall);
      }
  }


  if (lowerCaseMessage.startsWith('help')) {
    let helpText = `CognitiveOS Mock CLI v0.2
Available commands (examples):
- 'hello' or 'hi'
- 'create plan for a new soda brand'
- 'analyze market trends for e-bikes'
- 'open neuro-metrics' (simulated app opening)
- 'tell me a joke'
- 'what is my current focus level?' (simulated neuro-data query)
- 'generate a report on cognitive load'`;

    if (toolsManifest && toolsManifest.length > 0) {
      helpText += "\n\nAvailable custom tools:\n";
      toolsManifest.forEach(tool => {
        helpText += `- ${tool.toolName}: ${tool.description}\n`;
      });
       helpText += "\nTry invoking them by describing what you want to do, e.g., 'calculate 2+2'.";
    }
    return helpText;
  }

  if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
    return 'Hello! I am the CognitiveOS assistant. How can I help you develop your cognitive functions today? Try "help" for ideas.';
  }

  if (lowerCaseMessage.startsWith('create plan')) {
    return `Okay, I've drafted a preliminary plan based on your request: "${messageText}".
1. Define project objectives and key results (OKRs).
2. Conduct user research & competitive analysis (Consider using Neuro-Metrics for focus during research).
3. Brainstorm core features and design mockups.
4. Develop a prototype (Perhaps using Sandbox Editor for coding tasks).
5. Test and iterate based on feedback.
Shall I elaborate or simulate opening a relevant app like Mission Control?`;
  }

  if (lowerCaseMessage.includes('open neuro-metrics')) {
    return 'Understood. Simulating the command to open the Neuro-Metrics Dashboard...';
  }
  
  if (lowerCaseMessage.includes('open mission control')) {
    return 'Affirmative. Simulating opening Mission Control for task management...';
  }
  
  if (lowerCaseMessage.includes('open sandbox editor')) {
    return 'Roger that. Simulating the launch of Sandbox Editor for coding...';
  }
   if (lowerCaseMessage.includes('open tool creator')) {
    return 'Right away. Simulating opening the Tool Creator app...';
  }

  if (lowerCaseMessage.includes('joke')) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "I told my wife she was drawing her eyebrows too high. She seemed surprised.",
      "Why did the scarecrow win an award? Because he was outstanding in his field!",
      "Parallel lines have so much in common. It’s a shame they’ll never meet."
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (lowerCaseMessage.includes('focus level') || lowerCaseMessage.includes('cognitive load')) {
    const randomPercentage = Math.floor(Math.random() * 60) + 40; // 40-99%
    if (lowerCaseMessage.includes('focus level')) {
      return `Based on simulated neuro-feedback, your current focus level is approximately ${randomPercentage}%. Keep up the great work!`;
    }
    return `Simulated cognitive load is currently at ${100 - randomPercentage}%. Consider a short break if you feel strained.`;
  }

  return `I have processed your input: "${messageText}". As a mock AI, my responses are limited. If you meant to use a tool, try phrasing your request to match its description (see 'help'). For more complex interactions, integration with a live LLM like Gemini is required.`;
};


export const sendToolResultToAI = async (
  originalUserMessage: string,
  toolName: string,
  toolResult: any
): Promise<string> => {
  console.log(`Mock AI: Received tool result for '${toolName}' from query '${originalUserMessage}'. Result:`, toolResult);
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));

  let resultString = typeof toolResult === 'object' ? JSON.stringify(toolResult) : String(toolResult);
  if (resultString.length > 300) { // Keep it concise for the chat
    resultString = resultString.substring(0, 297) + "...";
  }

  return `Okay, I've used the tool **${toolName}** in response to your request: "${originalUserMessage}".
The result was:
\`\`\`
${resultString}
\`\`\`
How can I assist you further with this information?`;
};


// --- Future Real Gemini API Functions ---
/*
// Real implementation would pass tools to Gemini for function calling.
// See Google AI documentation for "Function calling" or "Tool use".

export const getGeminiProResponse = async (prompt: string, tools?: any[]): Promise<string | ToolCallRequest> => {
  if (!ai) {
    return "Gemini AI client not initialized. Check API_KEY.";
  }
  try {
    // This is a simplified example. Real implementation needs to map ToolDefinition to Gemini's format.
    const generativeModel = ai.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17", tools });
    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      // Assuming one function call for simplicity
      return { tool_call: { name: functionCalls[0].name, arguments: functionCalls[0].args } };
    }
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API (generateContent):", error);
    const err = error as Error;
    return `Error communicating with AI: ${err.message}. Please check console.`;
  }
};

// ... other Gemini functions like chat ...
*/
