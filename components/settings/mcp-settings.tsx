"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TabsContent } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { checkMCPStatus, saveMCPConfig, getMCPConfig } from "@/lib/mcp-utils"

interface MCPConfig {
  url: string
  apiKey?: string
}

interface MCPStatus {
  connected: boolean
  message?: string
  lastChecked?: Date
  serverInfo?: string
  toolCount?: number
  systemPromptCount?: number
}

export function MCPSettings() {
  const [config, setConfig] = useState<MCPConfig>({
    url: "http://localhost:8000",
    apiKey: "",
  })
  
  const [status, setStatus] = useState<MCPStatus>({
    connected: false,
    message: "未连接",
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  
  // 加载保存的配置
  useEffect(() => {
    const savedConfig = getMCPConfig()
    if (savedConfig) {
      setConfig(savedConfig)
      // 自动检查连接状态
      testConnection(savedConfig.url)
    }
  }, [])
  
  // 测试连接
  const testConnection = async (urlToTest = config.url) => {
    setIsTesting(true)
    
    try {
      const result = await checkMCPStatus(urlToTest)
      
      if (result.connected) {
        setStatus({
          connected: true,
          message: "连接成功",
          lastChecked: new Date(),
          serverInfo: result.serverInfo,
          toolCount: result.toolCount,
          systemPromptCount: result.systemPromptCount
        })
        
        toast({
          title: "连接成功",
          description: `已连接到MCP服务: ${result.serverInfo || ''}`,
        })
      } else {
        setStatus({
          connected: false,
          message: "连接失败",
          lastChecked: new Date()
        })
        
        toast({
          title: "连接失败",
          description: "无法连接到MCP服务，请检查URL",
          variant: "destructive",
        })
      }
    } catch (error) {
      setStatus({
        connected: false,
        message: "连接失败",
        lastChecked: new Date()
      })
      
      toast({
        title: "连接失败",
        description: "无法连接到MCP服务，请检查URL",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }
  
  // 保存配置
  const saveConfig = async () => {
    setIsSaving(true)
    
    try {
      // 保存到本地存储
      saveMCPConfig(config)
      
      // 测试连接
      await testConnection()
      
      toast({
        title: "保存成功",
        description: "MCP配置已保存",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存MCP配置",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <TabsContent value="mcp" className="mt-2">
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="mcp-url" className="text-right">
            MCP URL
          </Label>
          <Input
            id="mcp-url"
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="http://localhost:8000"
            className="col-span-3"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="mcp-apikey" className="text-right">
            API Key
          </Label>
          <Input
            id="mcp-apikey"
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="（可选）"
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">状态</Label>
          <div className="col-span-3 flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${status.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{status.connected ? '已连接' : '未连接'}</span>
            {status.lastChecked && (
              <span className="ml-2 text-xs text-gray-500">
                上次检查: {status.lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {status.connected && status.serverInfo && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">服务器信息</Label>
            <div className="col-span-3">
              <div className="text-sm">{status.serverInfo}</div>
              <div className="text-xs text-gray-500">
                可用工具: {status.toolCount} | 系统提示: {status.systemPromptCount}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => testConnection()}
            disabled={isTesting}
          >
            {isTesting ? "测试中..." : "测试连接"}
          </Button>
          <Button 
            onClick={saveConfig}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </TabsContent>
  )
} 