"use client"

import { PlusCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SettingsDialog } from "@/components/settings/settings-dialog"

interface NavbarProps {
  onSearch?: (query: string) => void
  onCreateNote?: () => void
  searchQuery?: string
}

export function Navbar({ onSearch, onCreateNote, searchQuery = "" }: NavbarProps) {
  return (
    <div className="flex items-center justify-between px-4 h-14 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium">笔记应用</h1>
      </div>
      
      <div className="flex-1 mx-4 max-w-md relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="搜索笔记..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button onClick={onCreateNote} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          新建笔记
        </Button>
        <SettingsDialog />
      </div>
    </div>
  )
} 