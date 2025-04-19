"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Trash, X, Plus, Save, ArrowLeft, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { NOTEBOOK_PATH } from "@/lib/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Usable } from "react"
import path from "path"
import { generateTagsFromContent } from "@/lib/llm"
import { extractFrontmatter, updateFrontmatter } from "@/lib/frontmatter"
import { Chatbot, Message } from "@/components/chatbot"

// 定义笔记类型
type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  notebookId: string
  timestamp: string
  preview?: string
  lastUpdated: number
  filePath: string
}

// 定义标签类型
type Tag = {
  id: string
  name: string
}

// 定义笔记本类型
type Notebook = {
  id: string
  name: string
  path: string
}

// 生成笔记预览
const generatePreview = (content: string, length = 60): string => {
  const plainText = content.replace(/#{1,6}\s/g, "").trim()
  return plainText.length > length ? plainText.substring(0, length) + "..." : plainText
}

// 更新时间戳
const updateTimestamp = (): string => {
  return "just now"
}

// 自定义按钮组件
const CustomButton = ({
  children,
  onClick,
  variant = "default",
  className,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "ghost" | "destructive"
  className?: string
  [key: string]: any
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full transition-colors"
  const variantStyles = {
    default: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 hover:bg-gray-100",
    ghost: "hover:bg-gray-100",
    destructive: "text-red-500 hover:bg-red-50 hover:text-red-600",
  }

  return (
    <button onClick={onClick} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </button>
  )
}

export default function EditPage({ params }: { params: Usable<{ id: string }> }) {
  const router = useRouter()
  const unwrappedParams = React.use(params)
  const noteId = decodeURIComponent(unwrappedParams.id)

  // 笔记数据
  const [notes, setNotes] = useState<Note[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)

  // 初始化一个默认的笔记对象
  const defaultNote: Note = {
    id: "",
    title: "",
    content: "",
    tags: [],
    notebookId: "",
    timestamp: "",
    lastUpdated: Date.now(),
    filePath: ""
  }

  // 编辑模式状态
  const [isEditing, setIsEditing] = useState(true)
  const [editingNote, setEditingNote] = useState<Note>(defaultNote)
  const [newTag, setNewTag] = useState("")

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)

  // 自动保存计时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // 生成标签状态
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)

  // 从文件系统加载数据
  useEffect(() => {
    const loadNote = async () => {
      try {
        console.log('开始加载笔记，ID:', noteId)
        
        // 从 API 获取笔记内容
        const response = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`获取笔记失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
        }
        
        const note = await response.json()
        console.log('API 返回的笔记数据:', note)
        
        // 确保所有必需字段都存在
        if (!note || typeof note !== 'object') {
          throw new Error('笔记数据格式错误')
        }

        if (!note.filePath) {
          throw new Error('笔记文件路径为空')
        }

        // 从内容中提取 frontmatter 标签
        const { tags } = extractFrontmatter(note.content)

        // 设置编辑笔记
        const updatedNote = {
          ...defaultNote,
          ...note,
          filePath: note.filePath,
          title: note.title || path.basename(note.filePath, '.md'),
          content: note.content || '',
          tags: tags || [],
          notebookId: note.notebookId || 'default'
        }
        
        console.log('设置编辑笔记:', updatedNote)
        setEditingNote(updatedNote)
        const noteToSet = notes.find(n => n.id === noteId)
        if (noteToSet) {
          setCurrentNote(noteToSet)
        }
      } catch (error) {
        console.error('加载笔记时出错:', error)
        toast({
          title: "加载笔记失败",
          description: error instanceof Error ? error.message : "无法读取笔记文件",
          variant: "destructive"
        })
        router.push("/")
      }
    }

    loadNote()
  }, [noteId, router, notes])

  // 自动保存功能
  useEffect(() => {
    if (isEditing && editingNote) {
      // 清除之前的计时器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // 设置新的计时器，5秒后自动保存
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave()
      }, 5000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [editingNote, isEditing])

  // 自动保存
  const autoSave = async () => {
    if (!editingNote) {
      console.error('自动保存失败：editingNote 为空')
      return
    }

    try {
      console.log('开始自动保存...', {
        filePath: editingNote.filePath,
        content: editingNote.content
      })

      // 调用 API 更新笔记
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingNote.filePath,
          content: editingNote.content,
          title: editingNote.title,
          tags: editingNote.tags,
          notebookId: editingNote.notebookId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`自动保存失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      const updatedNote = await response.json()
      console.log('自动保存成功:', updatedNote)
      
      setLastSaved(`自动保存于 ${new Date().toLocaleTimeString()}`)
      setEditingNote(updatedNote)
    } catch (error) {
      console.error('自动保存时出错:', error)
      toast({
        title: "自动保存失败",
        description: error instanceof Error ? error.message : "无法保存笔记文件",
        variant: "destructive"
      })
    }
  }

  // 保存编辑后的笔记
  const saveNote = async () => {
    if (!editingNote) {
      console.error('保存失败：editingNote 为空')
      toast({
        title: "保存失败",
        description: "笔记数据为空",
        variant: "destructive"
      })
      return
    }

    // 检查必需字段
    if (!editingNote.filePath) {
      console.error('保存失败：filePath 为空', editingNote)
      toast({
        title: "保存失败",
        description: "笔记文件路径为空",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('开始保存笔记...', {
        filePath: editingNote.filePath,
        content: editingNote.content,
        title: editingNote.title,
        tags: editingNote.tags,
        notebookId: editingNote.notebookId
      })

      // 构建完整的文件路径
      const filePath = editingNote.filePath.startsWith('/') 
        ? editingNote.filePath 
        : path.join(NOTEBOOK_PATH, editingNote.filePath)

      // 确保内容包含最新的 frontmatter
      const contentWithFrontmatter = updateFrontmatter(editingNote.content, editingNote)

      // 调用 API 更新笔记
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: filePath,
          content: contentWithFrontmatter,
          title: editingNote.title || path.basename(filePath, '.md'),
          tags: editingNote.tags || [],
          notebookId: editingNote.notebookId || 'default'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`保存失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      const updatedNote = await response.json()
      console.log('保存成功:', updatedNote)
      
      setEditingNote(updatedNote)
      setIsEditing(false)

      // 显示成功提示
      toast({
        title: "保存成功",
        description: "笔记已保存",
        duration: 3000,
      })
    } catch (error) {
      console.error('保存笔记时出错:', error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "无法保存笔记文件",
        variant: "destructive"
      })
    }
  }

  // 删除笔记
  const deleteNote = async () => {
    if (!editingNote) return

    try {
      // 调用 API 删除笔记
      const response = await fetch('/api/notes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingNote.filePath
        }),
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 显示成功提示
      toast({
        title: "删除成功",
        description: "笔记已删除",
        duration: 3000,
      })

      // 返回首页
      router.push("/")
    } catch (error) {
      console.error('删除笔记时出错:', error)
      toast({
        title: "删除失败",
        description: "无法删除笔记文件",
        variant: "destructive"
      })
    }
  }

  // 取消编辑
  const cancelEditing = () => {
    // 如果有未保存的更改，显示确认对话框
    if (JSON.stringify(notes.find((note) => note.id === noteId)) !== JSON.stringify(editingNote)) {
      if (window.confirm("您有未保存的更改，确定要放弃吗？")) {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }

  // 更新标签系统 - 检查并移除未使用的标签
  const updateTagSystem = () => {
    console.log('开始更新标签系统...')
    if (!editingNote) {
      console.log('错误：editingNote 为空')
      return
    }

    // 从 localStorage 获取最新的笔记数据
    const savedNotes = localStorage.getItem("notes")
    if (!savedNotes) {
      console.log('错误：localStorage 中没有笔记数据')
      return
    }

    const currentNotes = JSON.parse(savedNotes)
    console.log('当前笔记列表:', currentNotes)

    // 获取所有笔记中使用的标签
    const usedTags = new Set<string>()

    // 添加当前编辑笔记的标签
    editingNote.tags.forEach((tag) => usedTags.add(tag))
    console.log('当前编辑笔记的标签:', editingNote.tags)

    // 添加其他笔记的标签
    currentNotes.forEach((note: Note) => {
      if (note.id !== editingNote.id) {
        note.tags.forEach((tag) => usedTags.add(tag))
      }
    })
    console.log('所有使用的标签:', Array.from(usedTags))

    // 过滤掉未使用的标签
    const updatedTags = availableTags.filter((tag) => usedTags.has(tag.name))
    console.log('更新后的标签列表:', updatedTags)

    setAvailableTags(updatedTags)
    localStorage.setItem("tags", JSON.stringify(updatedTags))
    console.log('标签系统更新完成')
  }

  // 更新编辑中的笔记标题
  const updateNoteTitle = (title: string) => {
    if (!editingNote) return
    setEditingNote({ ...editingNote, title })
  }

  // 更新编辑中的笔记内容
  const updateNoteContent = (content: string) => {
    if (!editingNote) return
    setEditingNote({ ...editingNote, content })
  }

  // 更新编辑中的笔记所属笔记本
  const updateNoteNotebook = (notebookId: string) => {
    if (!editingNote) return
    setEditingNote({ ...editingNote, notebookId })
  }

  // 添加标签到编辑中的笔记
  const addTagToNote = (tag: string) => {
    if (!editingNote) return
    if (editingNote.tags.includes(tag)) return

    setEditingNote({
      ...editingNote,
      tags: [...editingNote.tags, tag],
    })
  }

  // 从编辑中的笔记移除标签
  const removeTagFromNote = (tag: string) => {
    if (!editingNote) return

    setEditingNote({
      ...editingNote,
      tags: editingNote.tags.filter((t) => t !== tag),
    })
  }

  // 添加新标签
  const addNewTag = () => {
    if (!newTag.trim() || availableTags.some((tag) => tag.name === newTag)) {
      setNewTag("")
      return
    }

    const newTagObj = {
      id: `tag-${Date.now()}`,
      name: newTag,
    }

    const updatedTags = [...availableTags, newTagObj]
    setAvailableTags(updatedTags)
    localStorage.setItem("tags", JSON.stringify(updatedTags))

    if (editingNote) {
      addTagToNote(newTag)
    }

    setNewTag("")
  }

  // 生成标签
  const handleGenerateTags = async () => {
    if (!editingNote?.content) {
      toast({
        title: "无法生成标签",
        description: "请先输入笔记内容",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingTags(true)
    try {
      const generatedTags = await generateTagsFromContent(editingNote.content)
      
      // 添加新生成的标签
      const updatedTags = [...editingNote.tags]
      generatedTags.forEach(tag => {
        if (!updatedTags.includes(tag)) {
          updatedTags.push(tag)
        }
      })

      // 更新笔记内容和标签
      const updatedNote = {
        ...editingNote,
        tags: updatedTags,
        content: updateFrontmatter(editingNote.content, { ...editingNote, tags: updatedTags })
      }

      setEditingNote(updatedNote)

      toast({
        title: "标签生成成功",
        description: `已添加 ${generatedTags.length} 个新标签`,
        duration: 3000,
      })
    } catch (error) {
      console.error("生成标签时出错:", error)
      toast({
        title: "生成标签失败",
        description: error instanceof Error ? error.message : "生成标签时发生错误",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingTags(false)
    }
  }

  if (!editingNote) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center p-4 border-b">
          <CustomButton variant="ghost" onClick={cancelEditing} className="mr-2 p-2">
            <ArrowLeft className="h-5 w-5" />
          </CustomButton>

          <div className="flex space-x-2">
            <CustomButton 
              variant="outline" 
              onClick={handleGenerateTags}
              disabled={isGeneratingTags}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 4V20M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{isGeneratingTags ? "生成中..." : "AI 生成"}</span>
            </CustomButton>
            <CustomButton variant="outline" className="flex items-center space-x-1 px-3 py-1.5 text-sm">
              <Clock className="w-4 h-4" />
              <span>记忆</span>
            </CustomButton>
          </div>

          <div className="ml-4 font-medium">
            <input
              type="text"
              value={editingNote.title}
              onChange={(e) => updateNoteTitle(e.target.value)}
              className="border rounded-full px-3 py-1 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {lastSaved && <span className="text-xs text-gray-500">{lastSaved}</span>}
            <div className="flex space-x-2">
              <CustomButton variant="outline" onClick={cancelEditing} className="px-3 py-1.5 text-sm">
                <X className="w-4 h-4 mr-1" />
                <span>取消</span>
              </CustomButton>
              <CustomButton onClick={saveNote} className="px-3 py-1.5 text-sm">
                <Save className="w-4 h-4 mr-1" />
                <span>保存</span>
              </CustomButton>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* 笔记本选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">笔记本</label>
            <select
              value={editingNote.notebookId}
              onChange={(e) => updateNoteNotebook(e.target.value)}
              className="w-full rounded-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            >
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.name}
                </option>
              ))}
            </select>
          </div>

          {/* 标签区域 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {editingNote?.tags?.map((tag) => (
              <div key={tag} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tag}</span>
                <button
                  onClick={() => removeTagFromNote(tag)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center">
              <select
                className="border rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    addTagToNote(e.target.value)
                    e.target.value = ""
                  }
                }}
              >
                <option value="">添加标签...</option>
                {availableTags
                  .filter((tag) => !editingNote.tags.includes(tag.name))
                  .map((tag) => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
              </select>
              <div className="flex ml-2">
                <input
                  type="text"
                  placeholder="新标签"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-24 text-sm rounded-l-full border border-r-0 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addNewTag()
                    }
                  }}
                />
                <button
                  onClick={addNewTag}
                  className="rounded-r-full border border-l-0 px-2 py-1 bg-gray-100 hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 笔记内容 */}
          <textarea
            value={editingNote.content}
            onChange={(e) => updateNoteContent(e.target.value)}
            className="w-full h-[calc(100%-120px)] border rounded-2xl p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            placeholder="在此输入笔记内容..."
          />
        </div>

        <div className="p-4 border-t">
          <CustomButton variant="destructive" onClick={deleteNote} className="px-3 py-1.5 text-sm">
            <Trash className="h-4 w-4 mr-2" />
            <span>删除</span>
          </CustomButton>
        </div>

        {/* 删除确认对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>删除笔记</DialogTitle>
              <DialogDescription>您确定要删除这个笔记吗？此操作无法撤销。</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <CustomButton variant="outline" onClick={() => setDialogOpen(false)} className="px-3 py-1.5 text-sm">
                取消
              </CustomButton>
              <CustomButton variant="destructive" onClick={deleteNote} className="px-3 py-1.5 text-sm">
                删除
              </CustomButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {editingNote && (
          <>
            <div className="fixed bottom-4 right-4 z-[9999]">
              <Chatbot 
                context={`# ${editingNote.title}\n${editingNote.content}`}
                onContextChange={(context: string) => {
                  console.log('Chatbot上下文已更新:', context);
                }}
                onMessage={(message: Message) => {
                  console.log('Chatbot消息:', message);
                }}
                onStateChange={(state: { isOpen: boolean; isLoading: boolean }) => {
                  console.log('Chatbot状态变化:', state);
                }}
              />
            </div>
            <div className="fixed bottom-4 left-4 z-[9999] bg-white p-4 rounded-lg shadow-lg max-w-md">
              <h3 className="text-sm font-medium mb-2">Chatbot上下文:</h3>
              <pre className="text-xs overflow-auto max-h-40">
                {`# ${editingNote.title}\n${editingNote.content}`}
              </pre>
            </div>
          </>
        )}

        <Toaster />
      </div>
    </div>
  )
}
