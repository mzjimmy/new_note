declare module 'mcp-uiux/dist/MCPClient' {
  export interface MCPClient {
    disconnect: () => void;
    serverInfo: {
      name: string;
      version: string;
    };
  }

  export interface PrepareToolsResult {
    mcpClient: MCPClient;
    toolsFunctionCall: any[];
    systemPrompts: any[];
  }

  export function prepareTools(url: string): Promise<PrepareToolsResult>;
} 