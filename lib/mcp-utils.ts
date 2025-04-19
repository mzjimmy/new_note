import { prepareTools } from 'mcp-uiux/dist/MCPClient'

export const checkMCPStatus = async (url: string) => {
  try {
    let { mcpClient, toolsFunctionCall, systemPrompts }: any =
      await prepareTools(url)

    if (mcpClient) {
      mcpClient.disconnect()
      return {
        connected: true,
        serverInfo: `${mcpClient.serverInfo.name} v${mcpClient.serverInfo.version}`,
        toolCount: toolsFunctionCall.length,
        systemPromptCount: systemPrompts.length
      }
    } else {
      return { connected: false }
    }
  } catch (error) {
    console.error('检查MCP状态失败:', error)
    return { connected: false }
  }
}

// 保存MCP配置到本地存储
export const saveMCPConfig = (config: { url: string, apiKey?: string }) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mcp-config', JSON.stringify(config))
  }
  return config
}

// 从本地存储获取MCP配置
export const getMCPConfig = (): { url: string, apiKey?: string } => {
  if (typeof window !== 'undefined') {
    const config = localStorage.getItem('mcp-config')
    if (config) {
      return JSON.parse(config)
    }
  }
  return { url: 'http://localhost:8000' }
} 