import { processKnowledgeTools } from '@/components/KnowledgeTools';
import { getMCPConfig } from './mcp-utils';

/**
 * 将笔记内容保存为知识记忆
 * 
 * @param content 笔记内容
 * @param callback 处理过程回调函数
 * @returns 处理结果
 */
export const saveNoteAsMemory = async (
  content: string,
  callback?: (data: any) => void
) => {
  try {
    // 获取MCP配置
    const mcpConfig = getMCPConfig();
    
    // 默认API配置
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-miiciyfktmetnvvqptyukjiqbmjdybvvhvcetscitwazxzgl';
    const apiUrl = process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
    const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    
    // 处理并保存知识
    const result = await processKnowledgeTools(
      content,
      mcpConfig.url,
      model,
      mcpConfig.apiKey || apiKey,
      apiUrl,
      // 确保callback非空
      callback || ((data: any) => {})
    );
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('保存知识记忆失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 格式化记忆处理结果为可读文本
 * 
 * @param result 处理结果
 * @returns 格式化的结果文本
 */
export const formatMemoryResult = (result: any[]): string => {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return '无处理结果';
  }
  
  let output = '## 记忆处理结果\n\n';
  
  for (const item of result) {
    output += `### ${item.name === 'create_entities' ? '实体' : '关系'}\n\n`;
    
    if (item.result && Array.isArray(item.result)) {
      if (item.name === 'create_entities') {
        // 处理实体结果
        output += '| 实体 | 类型 | 描述 |\n';
        output += '| ---- | ---- | ---- |\n';
        for (const entity of item.result) {
          output += `| ${entity.name || '-'} | ${entity.type || '-'} | ${entity.properties?.description || '-'} |\n`;
        }
      } else if (item.name === 'create_relations') {
        // 处理关系结果
        output += '| 源实体 | 关系 | 目标实体 |\n';
        output += '| ------ | ---- | ------ |\n';
        for (const relation of item.result) {
          output += `| ${relation.source || '-'} | ${relation.relation || '-'} | ${relation.target || '-'} |\n`;
        }
      }
    } else {
      output += '无数据\n';
    }
    
    output += '\n';
  }
  
  return output;
}; 