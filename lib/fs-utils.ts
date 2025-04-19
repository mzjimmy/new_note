import fs from 'fs'
import path from 'path'
import { NOTEBOOK_PATH } from './config'

// 读取文件夹中的所有 Markdown 文件
export const readMarkdownFiles = async (dirPath: string): Promise<string[]> => {
  const files: string[] = []
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await readMarkdownFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

// 读取文件内容
export const readFileContent = async (filePath: string): Promise<string> => {
  return fs.promises.readFile(filePath, 'utf-8')
}

// 写入文件内容
export const writeFileContent = async (filePath: string, content: string): Promise<void> => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
  return fs.promises.writeFile(filePath, content, 'utf-8')
}

// 获取文件信息
export const getFileInfo = (filePath: string) => {
  const stats = fs.statSync(filePath)
  return {
    name: path.basename(filePath, '.md'),
    path: filePath,
    size: stats.size,
    createdAt: stats.birthtime,
    updatedAt: stats.mtime
  }
}

// 获取文件夹结构
export const getDirectoryStructure = async (dirPath: string): Promise<any> => {
  const structure: any = {}
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      structure[entry.name] = await getDirectoryStructure(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      structure[entry.name] = getFileInfo(fullPath)
    }
  }

  return structure
} 