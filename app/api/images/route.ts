import { NextResponse } from "next/server"
import fs from "fs/promises"
import { NOTEBOOK_PATH } from "@/lib/config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: '未提供文件路径' }, { status: 400 })
    }

    // 读取图片文件
    const imageBuffer = await fs.readFile(filePath)
    
    // 根据文件扩展名设置正确的 Content-Type
    const ext = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'image/jpeg' // 默认值

    switch (ext) {
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'webp':
        contentType = 'image/webp'
        break
    }

    // 返回图片数据
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 缓存一年
      },
    })
  } catch (error) {
    console.error('获取图片时出错:', error)
    return NextResponse.json({ error: '无法获取图片' }, { status: 500 })
  }
} 