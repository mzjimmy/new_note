import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { NOTEBOOK_PATH } from "@/lib/config"

// 递归读取目录中的所有文件
async function readFilesRecursively(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir)
  const allFiles: string[] = []

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stats = await fs.stat(filePath)

    if (stats.isDirectory()) {
      const subFiles = await readFilesRecursively(filePath)
      allFiles.push(...subFiles)
    } else if (file.endsWith('.md') || file.match(/\.(png|jpe?g|gif|svg|webp)$/i)) {
      allFiles.push(filePath)
    }
  }

  return allFiles
}

// 获取所有笔记或单个笔记
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // 获取单个笔记
      const content = await fs.readFile(id, 'utf-8')
      const relativePath = path.relative(NOTEBOOK_PATH, id)
      const notebookId = path.dirname(relativePath).split(path.sep)[0] || 'default'
      const stats = await fs.stat(id)

      return NextResponse.json({
        id,
        title: path.basename(id, '.md'),
        content,
        tags: [], // 从内容中提取标签
        notebookId,
        timestamp: "just now",
        preview: content.substring(0, 60) + "...",
        lastUpdated: stats.mtime.getTime(),
        filePath: id
      })
    }

    // 获取所有笔记和图片
    const files = await readFilesRecursively(NOTEBOOK_PATH)
    const notes = []

    for (const filePath of files) {
      const stats = await fs.stat(filePath)
      const relativePath = path.relative(NOTEBOOK_PATH, filePath)
      const notebookId = path.dirname(relativePath).split(path.sep)[0] || 'default'
      const isMarkdown = filePath.endsWith('.md')

      if (isMarkdown) {
        const content = await fs.readFile(filePath, 'utf-8')
        notes.push({
          id: filePath,
          title: path.basename(filePath, '.md'),
          content,
          tags: [], // 从内容中提取标签
          notebookId,
          timestamp: "just now",
          preview: content.substring(0, 60) + "...",
          lastUpdated: stats.mtime.getTime(),
          filePath,
          type: 'markdown'
        })
      } else {
        // 对于图片文件
        notes.push({
          id: filePath,
          title: path.basename(filePath),
          content: '',
          tags: [],
          notebookId,
          timestamp: "just now",
          preview: '',
          lastUpdated: stats.mtime.getTime(),
          filePath,
          type: 'image'
        })
      }
    }

    return NextResponse.json(notes)
  } catch (error) {
    console.error('获取笔记时出错:', error)
    return NextResponse.json({ error: '无法获取笔记' }, { status: 500 })
  }
}

// 创建新笔记
export async function POST(request: Request) {
  try {
    const { title, content, notebookId } = await request.json()
    const timestamp = Date.now()
    const fileName = `${title || 'note'}-${timestamp}.md`
    const filePath = path.join(NOTEBOOK_PATH, notebookId || '', fileName)

    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content || '')

    return NextResponse.json({
      id: filePath,
      title: path.basename(filePath, '.md'),
      content: content || '',
      tags: [],
      notebookId: notebookId || 'default',
      timestamp: "just now",
      preview: (content || '').substring(0, 60) + "...",
      lastUpdated: timestamp,
      filePath
    })
  } catch (error) {
    console.error('创建笔记时出错:', error)
    return NextResponse.json({ error: '无法创建笔记' }, { status: 500 })
  }
}

// 更新笔记
export async function PUT(request: Request) {
  try {
    const { id, content } = await request.json()

    await fs.writeFile(id, content)

    return NextResponse.json({
      id,
      content,
      lastUpdated: Date.now()
    })
  } catch (error) {
    console.error('更新笔记时出错:', error)
    return NextResponse.json({ error: '无法更新笔记' }, { status: 500 })
  }
}

// 删除笔记
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await fs.unlink(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除笔记时出错:', error)
    return NextResponse.json({ error: '无法删除笔记' }, { status: 500 })
  }
} 