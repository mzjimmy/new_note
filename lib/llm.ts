import { NOTEBOOK_PATH } from "./config"

const API_KEY = "sk-eudcwozxipqucmymqwwcphujvaduleuykwsbgqjiajpjkloh"
const API_URL = "https://api.siliconflow.cn/v1/chat/completions"

export interface LLMResponse {
  id: string
  choices: {
    message: {
      content: string
    }
  }[]
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function generateTagsFromContent(content: string): Promise<string[]> {
  console.log("开始生成标签...")
  console.log("输入内容:", content)

  try {
    console.log("准备发送 API 请求...")
    const requestBody = {
      model: "Qwen/Qwen2.5-32B-Instruct",
      messages: [
        {
          role: "system",
          content: "你是一个专业的标签生成助手。请根据提供的 Markdown 内容，生成 3-5 个最相关的标签。标签应该是简洁的英文单词或短语，用逗号分隔。"
        },
        {
          role: "user",
          content: `请为以下内容生成标签：\n\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    }
    console.log("请求体:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log("API 响应状态:", response.status)
    console.log("API 响应头:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API 响应错误:", errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data: LLMResponse = await response.json()
    console.log("API 响应数据:", JSON.stringify(data, null, 2))

    const rawTags = data.choices[0].message.content
    console.log("原始标签字符串:", rawTags)

    const tags = rawTags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    console.log("处理后的标签数组:", tags)
    console.log("标签生成完成")

    return tags
  } catch (error) {
    console.error("生成标签时出错:", error)
    if (error instanceof Error) {
      console.error("错误详情:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}

export async function chat(messages: Message[], context: string): Promise<string> {
  try {
    const requestBody = {
      model: "Qwen/Qwen2.5-32B-Instruct",
      messages: [
        {
          role: "system",
          content: `你是一个智能助手。请根据以下上下文信息回答问题：\n${context}`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data: LLMResponse = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("聊天时出错:", error)
    throw error
  }
} 