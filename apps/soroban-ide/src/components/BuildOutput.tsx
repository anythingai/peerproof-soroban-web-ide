import { Terminal, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Message {
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  timestamp: string;
}

interface BuildOutputProps {
  messages: Message[];
}

export function BuildOutput({ messages }: BuildOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '✗';
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      default:
        return '•';
    }
  };

  const clearMessages = () => {
    // This would be handled by parent component
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-300">Build Output</span>
        </div>
        <button
          onClick={clearMessages}
          className="p-1 hover:bg-gray-700 rounded"
          title="Clear output"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
      
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 bg-gray-900 font-mono text-xs"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Build output will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-gray-500 text-xs min-w-[60px]">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                <span className={`${getMessageColor(message.type)} min-w-[12px]`}>
                  {getMessageIcon(message.type)}
                </span>
                <span className={`${getMessageColor(message.type)} flex-1`}>
                  {message.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Build Statistics */}
      {messages.length > 0 && (
        <div className="border-t border-gray-700 p-2 bg-gray-800">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Total messages: {messages.length}</span>
            <span>
              Errors: {messages.filter(m => m.type === 'error').length} | 
              Warnings: {messages.filter(m => m.type === 'warning').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
