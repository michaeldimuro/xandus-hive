import { useRef, useEffect } from 'react';
import { useAgentConsole, type ConsoleLine } from '@/hooks/useAgentConsole';

interface AgentConsoleProps {
  groupFolder: string | null;
  className?: string;
}

const lineColors: Record<ConsoleLine['type'], string> = {
  stdout: 'text-gray-400',
  tool: 'text-cyan-400',
  response: 'text-green-400',
  system: 'text-yellow-500',
};

export function AgentConsole({ groupFolder, className = '' }: AgentConsoleProps) {
  const { lines, isAttached } = useAgentConsole(groupFolder);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className={`bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a3a] bg-[#0f0f23]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAttached ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-400 font-mono">
            {groupFolder ? `console://${groupFolder}` : 'No agent selected'}
          </span>
        </div>
        <span className="text-xs text-gray-600">{lines.length} lines</span>
      </div>
      <div
        ref={scrollRef}
        className="p-3 font-mono text-xs leading-relaxed overflow-y-auto"
        style={{ maxHeight: '400px', minHeight: '200px' }}
      >
        {lines.length === 0 ? (
          <span className="text-gray-600">Waiting for output...</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={lineColors[line.type]}>
              <span className="text-gray-600 mr-2">
                {new Date(line.timestamp).toLocaleTimeString()}
              </span>
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
