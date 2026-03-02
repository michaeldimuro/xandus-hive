/**
 * EndpointActions — Action buttons displayed per endpoint row.
 */

import React, { useState } from 'react';
import { Wrench, Database, X } from 'lucide-react';
import type { ApiEndpoint } from '@/stores/apiExplorerStore';

interface Props {
  endpoint: ApiEndpoint;
}

export const EndpointActions: React.FC<Props> = ({ endpoint }) => {
  const [showDataPullDialog, setShowDataPullDialog] = useState(false);

  const handleCreateMcpTool = () => {
    alert(
      `MCP Tool creation for ${endpoint.method} ${endpoint.path} is not yet implemented. This will generate an MCP tool definition that agents can invoke.`
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCreateMcpTool}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition"
          title="Create MCP Tool"
        >
          <Wrench size={13} />
          MCP Tool
        </button>
        <button
          onClick={() => setShowDataPullDialog(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
          title="Create Data Pull"
        >
          <Database size={13} />
          Data Pull
        </button>
      </div>

      {/* Data Pull placeholder dialog */}
      {showDataPullDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDataPullDialog(false)}
          />
          <div className="relative bg-[#12122a] border border-[#2a2a4a] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-[#2a2a4a] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Configure Data Pull
              </h2>
              <button
                onClick={() => setShowDataPullDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#1a1a3a] rounded-lg p-4">
                <p className="text-sm text-gray-300 font-mono">
                  {endpoint.method} {endpoint.path}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Data pull configuration will be available once the trigger system
                integration is complete. You will be able to set a schedule,
                transform rules, and a destination table.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowDataPullDialog(false)}
                  className="px-4 py-2 text-gray-400 hover:bg-[#1a1a3a] rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
