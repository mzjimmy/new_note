import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { NOTEBOOK_PATH } from "@/lib/config"

// 获取所有笔记本
export async function GET() {
  try {
    // 读取笔记本目录
    const entries = await fs.readdir(NOTEBOOK_PATH, { withFileTypes: true })
    
    // 过滤出目录
    const notebooks = entries
      .filter(entry => entry.isDirectory())
      .map(dir => ({
        id: dir.name,
        name: dir.name,
        path: path.join(NOTEBOOK_PATH, dir.name)
      }))

    // 如果没有笔记本，创建默认笔记本
    if (notebooks.length === 0) {
      const defaultNotebook = {
        id: 'default',
        name: '默认笔记本',
        path: path.join(NOTEBOOK_PATH, 'default')
      }
      await fs.mkdir(defaultNotebook.path, { recursive: true })
      notebooks.push(defaultNotebook)
    }

    return NextResponse.json(notebooks)
  } catch (error) {
    console.error('获取笔记本时出错:', error)
    return NextResponse.json({ error: '无法获取笔记本列表' }, { status: 500 })
  }
}

// 创建新笔记本
export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: '笔记本名称不能为空' }, { status: 400 })
    }

    const notebookPath = path.join(NOTEBOOK_PATH, name)
    await fs.mkdir(notebookPath, { recursive: true })

    return NextResponse.json({
      id: name,
      name,
      path: notebookPath
    })
  } catch (error) {
    console.error('创建笔记本时出错:', error)
    return NextResponse.json({ error: '无法创建笔记本' }, { status: 500 })
  }
}

// 删除笔记本
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    if (!id || id === 'default') {
      return NextResponse.json({ error: '无法删除默认笔记本' }, { status: 400 })
    }

    const notebookPath = path.join(NOTEBOOK_PATH, id)
    await fs.rm(notebookPath, { recursive: true, force: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除笔记本时出错:', error)
    return NextResponse.json({ error: '无法删除笔记本' }, { status: 500 })
  }
} 