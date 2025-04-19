import marked from 'marked';

/**
 * 渲染Markdown文本为HTML
 * 
 * @param text Markdown文本
 * @returns 渲染后的HTML
 */
export const renderMarkdown = (text: string): string => {
  if (!text) return '';
  try {
    return marked.parse(text);
  } catch (error) {
    console.error('Markdown渲染错误:', error);
    return `<p>渲染错误: ${error instanceof Error ? error.message : '未知错误'}</p>`;
  }
}; 