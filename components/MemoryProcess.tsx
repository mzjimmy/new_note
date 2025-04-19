import { useState, useEffect } from 'react';
import { saveNoteAsMemory, formatMemoryResult } from '@/lib/knowledge-memory';
import ProcessingStatus, { ProcessStage } from './ProcessingStatus';

interface MemoryProcessProps {
  noteContent: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

const MemoryProcess: React.FC<MemoryProcessProps> = ({
  noteContent,
  isOpen,
  onClose,
  onComplete
}) => {
  const [stage, setStage] = useState<ProcessStage>(ProcessStage.Idle);
  const [streamingData, setStreamingData] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 处理记忆
  const processMemory = async () => {
    try {
      setStage(ProcessStage.Understanding);
      setStreamingData('');
      setResult('');
      setError('');

      const memoryResult = await saveNoteAsMemory(
        noteContent,
        (data: any) => {
          // 处理回调
          if (data.status === 'function_call_start') {
            setStage(ProcessStage.Understanding);
          } else if (data.status === 'function_call') {
            setStage(ProcessStage.GeneratingParameters);
            // 追加流式数据
            if (data.data) {
              setStreamingData((prev) => prev + (data.data || ''));
            }
          } else if (data.status === 'save') {
            setStage(ProcessStage.Saving);
          }
        }
      );

      if (memoryResult.success && memoryResult.data) {
        // 格式化结果
        const formattedResult = formatMemoryResult(memoryResult.data);
        setResult(formattedResult);
        setStage(ProcessStage.Done);

        // 通知完成
        if (onComplete) {
          onComplete(memoryResult.data);
        }
      } else {
        throw new Error(memoryResult.error || '处理失败');
      }
    } catch (err) {
      console.error('记忆处理出错:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setStage(ProcessStage.Error);
    }
  };

  // 当组件打开时自动处理
  useEffect(() => {
    if (isOpen && noteContent) {
      processMemory();
    }
  }, [isOpen, noteContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-4 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">记忆处理</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <ProcessingStatus
          stage={stage}
          isInspiration={false}
          result={result}
          error={error}
          streamingData={streamingData}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 mr-2"
          >
            关闭
          </button>
          {stage === ProcessStage.Error && (
            <button
              onClick={processMemory}
              className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
            >
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryProcess; 