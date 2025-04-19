import {
  prepareTools,
  callOpenAIFunctionAndProcessToolCalls
} from 'mcp-uiux/dist/MCPClient.js'

export const processKnowledgeTools = async (
  text: string,
  mcpUrl: string,
  model: string,
  apiKey: string,
  apiUrl: string,
  callback: (data: any) => void
) => {
  let { mcpClient, tools, toolsFunctionCall, systemPrompts }: any =
    await prepareTools(mcpUrl)

  if (mcpClient) {
    const knowledgeExtractorPrompt = systemPrompts.find(
      (s: any) => s.name === 'knowledge_extractor'
    )

    const knowledgeTools = toolsFunctionCall.filter((t: any) =>
      ['create_relations', 'create_entities'].includes(t.function.name)
    )

    if (callback)
      callback({
        status: 'function_call_start'
      })

    const toolsResult = await callOpenAIFunctionAndProcessToolCalls(
      knowledgeExtractorPrompt?.systemPrompt,
      text,
      knowledgeTools,
      model,
      apiKey,
      apiUrl,
      (chunk: any) => {
        if (callback)
          callback({
            status: 'function_call',
            data: chunk?.choices?.[0]?.delta?.tool_calls?JSON.stringify(chunk?.choices?.[0]?.delta?.tool_calls):""
          })
      }
    )

    let saveResult=[];
    for (const item of toolsResult) {
      let tool = tools.find((tool: any) => tool.name == item.name)
      let result = await tool.execute(item.arguments)
      console.log('工具执行结果', item.name, result)
      saveResult.push({
        name: item.name,
        result
      })
      if (callback)
        callback({
          status: 'save',
          data: {
            name: item.name,
            result
          }
        })
    }

    mcpClient.disconnect()
    return saveResult
  } else {
    return 
  }
}
