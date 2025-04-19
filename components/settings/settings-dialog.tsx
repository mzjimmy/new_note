"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { MCPSettings } from "@/components/settings/mcp-settings"

export function SettingsDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">设置</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="mcp">MCP服务</TabsTrigger>
          </TabsList>
          
          {/* 通用设置 */}
          <TabsContent value="general">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-center text-gray-500">
                  暂无通用设置
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* MCP服务设置 */}
          <MCPSettings />
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 