import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface LogConsoleProps {
  logs: string[];
}

export default function LogConsole({ logs }: LogConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2">
        <Terminal className="h-5 w-5" />
        <h3 className="font-semibold">Live Log Console</h3>
      </div>
      <div
        ref={consoleRef}
        className="bg-gray-950 text-green-400 font-mono text-sm p-4 h-96 overflow-y-auto"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500">Waiting for logs...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-words">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
