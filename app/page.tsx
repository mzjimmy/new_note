"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, ChevronDown, ChevronRight, File, Hash, Search, Folder, FolderPlus, X, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { NOTEBOOK_PATH } from "@/lib/config"
import { readMarkdownFiles, readFileContent, writeFileContent, getDirectoryStructure } from "@/lib/fs-utils"
import path from "path"
import { Chatbot } from "@/components/chatbot"

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
  type: 'markdown' | 'image'
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

// 格式化日期
const formatDate = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  // 如果不到1分钟
  if (diff < 60 * 1000) {
    return "just now"
  }

  // 如果不到1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  }

  // 如果不到24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} hour${hours > 1 ? "s" : ""} ago`
  }

  // 如果不到7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  // 否则显示完整日期
  const date = new Date(timestamp)
  return date.toLocaleDateString()
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

export default function HomePage() {
  const router = useRouter()

  // 所有可用标签
  const [availableTags, setAvailableTags] = useState<Tag[]>([])

  // 笔记本数据
  const [notebooks, setNotebooks] = useState<Notebook[]>([])

  // 笔记数据
  const [notes, setNotes] = useState<Note[]>([])

  const [expandedSections, setExpandedSections] = useState({
    notebooks: true,
    tags: true,
  })

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const [allNotesContent, setAllNotesContent] = useState("")

  // 从文件系统加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('开始从文件系统加载数据...')
        
        // 从 API 获取笔记数据
        const response = await fetch('/api/notes')
        if (!response.ok) {
          throw new Error('获取笔记数据失败')
        }
        const notes = await response.json()
        setNotes(notes)

        // 从笔记数据中提取笔记本和标签
        const notebooksSet = new Set<string>()
        const tagsSet = new Set<string>()

        notes.forEach((note: Note) => {
          notebooksSet.add(note.notebookId)
          note.tags.forEach(tag => tagsSet.add(tag))
        })

        const newNotebooks: Notebook[] = Array.from(notebooksSet).map(id => ({
          id,
          name: id,
          path: path.join(NOTEBOOK_PATH, id)
        }))

        const newTags: Tag[] = Array.from(tagsSet).map((name, index) => ({
          id: `tag-${index}`,
          name
        }))

        setNotebooks(newNotebooks)
        setAvailableTags(newTags)
        
        console.log('数据加载完成')

        // 获取所有笔记内容作为上下文
        const allContent = notes
          .map((note: Note) => `# ${note.title}\n${note.content}`)
          .join("\n\n")
        setAllNotesContent(allContent)
      } catch (error) {
        console.error('加载数据时出错:', error)
        toast({
          title: "加载数据失败",
          description: "无法从文件系统读取笔记数据",
          variant: "destructive"
        })
      }
    }

    loadData()
  }, [])

  // 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem("tags", JSON.stringify(availableTags))
  }, [availableTags])

  useEffect(() => {
    localStorage.setItem("notebooks", JSON.stringify(notebooks))
  }, [notebooks])

  // 统计每个标签的使用次数
  const getTagCounts = () => {
    const counts: Record<string, number> = {}
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return counts
  }

  // 统计每个笔记本的笔记数量
  const getNotebookCounts = () => {
    const counts: Record<string, number> = {}
    notes.forEach((note) => {
      counts[note.notebookId] = (counts[note.notebookId] || 0) + 1
    })
    return counts
  }

  const tagCounts = getTagCounts()
  const notebookCounts = getNotebookCounts()

  // 过滤笔记
  const filteredNotes = notes
    .filter((note) => {
      // 如果有搜索查询
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      // 如果有标签过滤
      if (activeFilter && activeFilter.startsWith("tag:")) {
        const tagName = activeFilter.substring(4)
        return note.tags.includes(tagName)
      }

      // 如果有笔记本过滤
      if (activeFilter && activeFilter.startsWith("notebook:")) {
        const notebookId = activeFilter.substring(9)
        return note.notebookId === notebookId
      }

      // 否则显示所有笔记
      return true
    })
    .sort((a, b) => b.lastUpdated - a.lastUpdated) // 按最后更新时间排序

  const toggleSection = (section: "notebooks" | "tags") => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  // 创建新笔记
  const createNewNote = async () => {
    try {
      // 确定默认笔记本
      let defaultNotebookId = "default"
      if (activeFilter && activeFilter.startsWith("notebook:")) {
        defaultNotebookId = activeFilter.substring(9)
      }

      // 调用 API 创建新笔记
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "新笔记",
          content: "",
          notebookId: defaultNotebookId
        }),
      })

      if (!response.ok) {
        throw new Error('创建笔记失败')
      }

      const newNote = await response.json()

      // 更新状态
      setNotes([newNote, ...notes])

      // 导航到编辑页面
      router.push(`/edit/${encodeURIComponent(newNote.filePath)}`)

      // 显示成功提示
      toast({
        title: "已创建新笔记",
        description: "您可以开始编辑新笔记了。",
        duration: 3000,
      })
    } catch (error) {
      console.error('创建笔记时出错:', error)
      toast({
        title: "创建笔记失败",
        description: "无法创建新笔记文件",
        variant: "destructive"
      })
    }
  }

  // 设置过滤器
  const setFilter = (type: "tag" | "notebook", id: string) => {
    if (type === "tag") {
      const tagName = availableTags.find((tag) => tag.id === id)?.name
      if (tagName) {
        setActiveFilter(`tag:${tagName}`)
        setSearchQuery("")
      }
    } else {
      setActiveFilter(`notebook:${id}`)
      setSearchQuery("")
    }
  }

  // 清除过滤器
  const clearFilter = () => {
    setActiveFilter(null)
    setSearchQuery("")
  }

  // 打开笔记编辑页面
  const openNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note?.type === 'image') {
      // 对于图片类型，使用/view路由
      router.push(`/view/${encodeURIComponent(noteId)}`);
    } else {
      // 对于普通笔记，使用/edit路由
      router.push(`/edit/${encodeURIComponent(noteId)}`);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-medium mb-4">笔记本</h1>
          <CustomButton onClick={createNewNote} className="w-full py-2 px-4 text-sm font-medium">
            <PlusCircle className="h-4 w-4 mr-2" />
            <span>新建笔记</span>
          </CustomButton>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setActiveFilter(null)
              }}
              className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-3">
            <div className="mb-2">
              <button
                className={cn(
                  "flex items-center w-full px-3 py-2 rounded-full transition-colors text-sm",
                  activeFilter === null ? "bg-gray-100" : "hover:bg-gray-100",
                )}
                onClick={clearFilter}
              >
                <File className="h-4 w-4 mr-2" />
                <span>所有笔记</span>
                <span className="ml-auto text-xs text-gray-500">{notes.length}</span>
              </button>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between px-2 py-1">
                <button
                  className="flex items-center text-gray-700 hover:text-gray-900"
                  onClick={() => toggleSection("notebooks")}
                >
                  {expandedSections.notebooks ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <Folder className="h-4 w-4 mr-2" />
                  <span>笔记本</span>
                </button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => {}} className="p-1 rounded-full hover:bg-gray-100">
                        <FolderPlus className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>新建笔记本</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {expandedSections.notebooks && (
                <div className="ml-6 mt-1 space-y-1">
                  {notebooks.map((notebook) => (
                    <div key={notebook.id} className="flex items-center justify-between group">
                      <button
                        className={cn(
                          "flex items-center text-gray-600 hover:text-gray-900 py-1.5 px-3 rounded-full flex-grow transition-colors text-sm",
                          activeFilter === `notebook:${notebook.id}` && "bg-gray-100",
                        )}
                        onClick={() => setFilter("notebook", notebook.id)}
                      >
                        <span>{notebook.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({notebookCounts[notebook.id] || 0})</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-2">
              <button
                className="flex items-center text-gray-700 hover:text-gray-900 px-2 py-1"
                onClick={() => toggleSection("tags")}
              >
                {expandedSections.tags ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <Hash className="h-4 w-4 mr-2" />
                <span>标签</span>
              </button>

              {expandedSections.tags && (
                <div className="ml-6 mt-1 space-y-1">
                  {availableTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between group">
                      <button
                        className={cn(
                          "flex items-center text-gray-600 hover:text-gray-900 py-1.5 px-3 rounded-full flex-grow transition-colors text-sm",
                          activeFilter === `tag:${tag.name}` && "bg-gray-100",
                        )}
                        onClick={() => setFilter("tag", tag.id)}
                      >
                        <span>{tag.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({tagCounts[tag.name] || 0})</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Notes Grid */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {activeFilter
              ? activeFilter.startsWith("tag:")
                ? `标签: ${activeFilter.substring(4)}`
                : `笔记本: ${notebooks.find((nb) => nb.id === activeFilter.substring(9))?.name || ""}`
              : searchQuery
                ? `搜索: ${searchQuery}`
                : "所有笔记"}
          </h2>
          {(activeFilter || searchQuery) && (
            <button onClick={clearFilter} className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
                  onClick={() => openNote(note.id)}
                >
                  <h3 className="font-medium text-lg mb-2 pr-8">{note.title}</h3>
                  {note.type === 'markdown' && note.content && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {note.preview || generatePreview(note.content)}
                    </p>
                  )}
                  {note.type === 'image' && (
                    <div className="relative w-full h-40 mb-3">
                      <img
                        src={`/api/images?path=${encodeURIComponent(note.id)}`}
                        alt={note.title}
                        className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-3">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{notebooks.find((nb) => nb.id === note.notebookId)?.name}</span>
                    <span>{formatDate(note.lastUpdated)}</span>
                  </div>
                  <button
                    className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      openNote(note.id)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
              <File className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg mb-2">没有找到匹配的笔记</p>
              <p className="mb-4">尝试使用不同的搜索词或过滤条件</p>
              <CustomButton onClick={clearFilter} className="px-4 py-2 text-sm">
                清除过滤器
              </CustomButton>
            </div>
          )}
        </div>
      </div>

      <Chatbot context={allNotesContent} />
      <Toaster />
    </div>
  )
}
