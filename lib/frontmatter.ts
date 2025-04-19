import { Note } from "@/types/note"

// 从 markdown 内容中提取 frontmatter
export function extractFrontmatter(content: string): { tags: string[] } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = content.match(frontmatterRegex)
  
  if (!match) {
    return { tags: [] }
  }

  const frontmatter = match[1]
  const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.*\n)*)/)
  
  if (!tagsMatch) {
    return { tags: [] }
  }

  const tags = tagsMatch[1]
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^\s*-\s*/, '').trim())
    .filter(tag => tag.length > 0)

  return { tags }
}

// 更新 markdown 内容中的 frontmatter
export function updateFrontmatter(content: string, note: Note): string {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = content.match(frontmatterRegex)
  
  let frontmatter = ''
  if (match) {
    frontmatter = match[1]
  }

  // 更新或添加 tags
  const tagsSection = `tags:\n${note.tags.map(tag => `  - ${tag}`).join('\n')}`
  
  if (frontmatter.includes('tags:')) {
    frontmatter = frontmatter.replace(/tags:[\s\S]*?(?=\n\w|$)/, tagsSection)
  } else {
    frontmatter = frontmatter ? `${frontmatter}\n${tagsSection}` : tagsSection
  }

  // 构建新的 frontmatter
  const newFrontmatter = `---\n${frontmatter}\n---\n`
  
  // 如果原来有 frontmatter，替换它；否则在开头添加
  if (match) {
    return content.replace(frontmatterRegex, newFrontmatter)
  } else {
    return `${newFrontmatter}${content}`
  }
} 