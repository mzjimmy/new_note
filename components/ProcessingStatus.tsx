import React from 'react';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { renderMarkdown } from '@/services/Markdown';


export enum ProcessStage {
  Idle = 'idle',
  Understanding = 'understanding',
  GeneratingParameters = 'generating_parameters',
  Saving = 'saving',
  Done = 'done',
  // Inspiration-specific stages
  FetchingKnowledge = 'fetching_knowledge',
  GeneratingInspiration = 'generating_inspiration',
  Error = 'error'
}

interface ProcessingStatusProps {
  stage: ProcessStage;
  isInspiration?: boolean;
  result?: string;
  error?: string;
  streamingData?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  stage, 
  isInspiration = false, 
  result,
  error,
  streamingData
}) => {
  const getStageText = (stage: ProcessStage, isInspiration: boolean): string => {
    switch (stage) {
      case ProcessStage.Understanding:
        return 'LLM 开始理解...';
      case ProcessStage.GeneratingParameters:
        return 'function call 参数生成中...';
      case ProcessStage.Saving:
        return '正在保存...';
      case ProcessStage.FetchingKnowledge:
        return '从 MCP 读取知识...';
      case ProcessStage.GeneratingInspiration:
        return 'LLM 生成新知识中...';
      case ProcessStage.Done:
        return isInspiration ? '灵感生成完成' : '保存结果完成';
      case ProcessStage.Error:
        return '处理出错';
      default:
        return '等待处理...';
    }
  };

  const getStages = (isInspiration: boolean): ProcessStage[] => {
    if (isInspiration) {
      return [
        ProcessStage.FetchingKnowledge,
        ProcessStage.GeneratingInspiration,
        ProcessStage.Done
      ];
    } else {
      return [
        ProcessStage.Understanding,
        ProcessStage.GeneratingParameters,
        ProcessStage.Saving,
        ProcessStage.Done
      ];
    }
  };

  const stages = getStages(isInspiration);
  const currentStageIndex = stages.indexOf(stage);

  return (
    <Card className="w-full h-full">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">
          {isInspiration ? '灵感生成进度' : '笔记处理进度'}
        </h3>
        
        <div className="space-y-4">
          {stages.map((s, index) => {
            const isActive = stage !== ProcessStage.Done && currentStageIndex === index;
            const isCompleted = currentStageIndex > index || stage === ProcessStage.Done;
            
            return (
              <div key={s} className="flex items-center">
                <div className={`
                  flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                  ${isActive ? 'bg-primary text-primary-foreground animate-pulse' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {isCompleted ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : isActive ? (
                    <Loader2Icon className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {getStageText(s, isInspiration)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 显示流式数据 */}
        {stage === ProcessStage.GeneratingParameters && streamingData && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md overflow-auto max-h-[200px]">
            <h4 className="text-sm font-medium mb-2 text-blue-700">处理进度实时输出：</h4>
            <pre className="text-xs whitespace-pre-wrap text-blue-800">{streamingData}</pre>
          </div>
        )}

        {stage === ProcessStage.Error && error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {stage === ProcessStage.Done && result && (
          <div className="mt-4 p-3 bg-accent border border-accent-foreground/20 rounded-md">
            <div className="flex items-center mb-2">
              <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm font-medium text-white-700">
                {isInspiration ? '灵感生成成功' : '笔记保存成功'}
              </p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
