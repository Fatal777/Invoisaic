/**
 * Agents Demo - Terminal-style Agent Orchestration
 * Minimalist black/white/grey/red design
 */

import React, { useState, useRef } from 'react';
import { Terminal, Upload, Play, Square, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LogEntry {
  timestamp: string;
  agent: string;
  level: 'info' | 'success' | 'error' | 'warn';
  message: string;
}

interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  tasks: number;
  time: number;
}

export default function AgentsDemo() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'textract', status: 'idle', tasks: 0, time: 0 },
    { name: 'bedrock', status: 'idle', tasks: 0, time: 0 },
    { name: 'sagemaker', status: 'idle', tasks: 0, time: 0 },
    { name: 'compliance', status: 'idle', tasks: 0, time: 0 },
  ]);

  const addLog = (agent: string, level: LogEntry['level'], message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, { timestamp, agent, level, message }]);
  };

  const updateAgentStatus = (agentName: string, status: AgentStatus['status'], tasks?: number, time?: number) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.name === agentName
          ? { ...agent, status, tasks: tasks ?? agent.tasks, time: time ?? agent.time }
          : agent
      )
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      addLog('system', 'info', `File loaded: ${selectedFile.name}`);
    }
  };

  const runAgents = async () => {
    if (!file) {
      addLog('system', 'error', 'No file uploaded');
      return;
    }

    setRunning(true);
    setLogs([]);
    
    // Reset agents
    agents.forEach(agent => updateAgentStatus(agent.name, 'idle', 0, 0));

    addLog('system', 'info', '>>> Starting multi-agent workflow');
    await new Promise(r => setTimeout(r, 500));

    // Agent 1: Textract
    addLog('textract', 'info', 'Initializing Amazon Textract...');
    updateAgentStatus('textract', 'running');
    await new Promise(r => setTimeout(r, 800));

    addLog('textract', 'info', 'Uploading document to S3...');
    await new Promise(r => setTimeout(r, 1000));

    addLog('textract', 'info', 'Running OCR analysis...');
    await new Promise(r => setTimeout(r, 1500));

    addLog('textract', 'success', 'Extracted 12 fields with 99.8% confidence');
    updateAgentStatus('textract', 'complete', 12, 2.3);
    await new Promise(r => setTimeout(r, 500));

    // Agent 2: Bedrock (parallel)
    addLog('bedrock', 'info', 'Initializing Amazon Bedrock...');
    updateAgentStatus('bedrock', 'running');
    await new Promise(r => setTimeout(r, 600));

    addLog('bedrock', 'info', 'Analyzing business logic...');
    await new Promise(r => setTimeout(r, 1200));

    addLog('bedrock', 'success', 'Invoice categorized: Professional Services');
    updateAgentStatus('bedrock', 'complete', 1, 1.8);
    await new Promise(r => setTimeout(r, 500));

    // Agent 3: SageMaker
    addLog('sagemaker', 'info', 'Initializing SageMaker endpoint...');
    updateAgentStatus('sagemaker', 'running');
    await new Promise(r => setTimeout(r, 700));

    addLog('sagemaker', 'info', 'Running payment prediction model...');
    await new Promise(r => setTimeout(r, 1400));

    addLog('sagemaker', 'success', 'Payment predicted: 15 days with 91.2% confidence');
    updateAgentStatus('sagemaker', 'complete', 1, 2.1);
    await new Promise(r => setTimeout(r, 500));

    // Agent 4: Compliance
    addLog('compliance', 'info', 'Running compliance checks...');
    updateAgentStatus('compliance', 'running');
    await new Promise(r => setTimeout(r, 900));

    addLog('compliance', 'success', 'All tax regulations verified');
    updateAgentStatus('compliance', 'complete', 3, 0.9);
    await new Promise(r => setTimeout(r, 500));

    addLog('system', 'success', '>>> Workflow complete - Total time: 7.1s, Cost: $0.0042');
    setRunning(false);
  };

  const stopAgents = () => {
    setRunning(false);
    addLog('system', 'warn', 'Workflow stopped by user');
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running': return 'text-yellow-500';
      case 'complete': return 'text-green-500';
      case 'error': return 'text-[#EFA498]';
      default: return 'text-gray-600';
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-[#EFA498]';
      case 'warn': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/demo')}
                className="p-2 hover:bg-gray-900 rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-[#F97272]" />
                <div>
                  <h1 className="text-xl font-bold">agent-orchestration-terminal</h1>
                  <p className="text-xs text-gray-600">Multi-agent AI workflow monitor</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${running ? 'bg-[#F97272] animate-pulse' : 'bg-gray-700'}`} />
              <span className="text-xs text-gray-600">{running ? 'RUNNING' : 'IDLE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border border-gray-800 bg-gray-950 p-6">
              <div className="text-xs text-gray-600 mb-3">[INPUT]</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border border-gray-700 hover:border-[#F97272] bg-black rounded text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-gray-600 group-hover:text-[#F97272] transition-colors" />
                  <div className="flex-1 min-w-0">
                    {file ? (
                      <>
                        <div className="text-sm font-semibold truncate">{file.name}</div>
                        <div className="text-xs text-gray-600">{(file.size / 1024).toFixed(1)} KB</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600">Click to upload invoice</div>
                    )}
                  </div>
                </div>
              </button>

              {/* Run Button */}
              <button
                onClick={running ? stopAgents : runAgents}
                disabled={!file}
                className={`w-full mt-4 p-4 rounded font-bold transition-colors ${
                  running
                    ? 'bg-[#F97272] hover:bg-[#f85c5c] text-white'
                    : 'bg-white hover:bg-gray-200 text-black disabled:bg-gray-900 disabled:text-gray-700 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {running ? (
                    <>
                      <Square className="w-4 h-4" />
                      STOP
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      RUN AGENTS
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Agent Status */}
            <div className="border border-gray-800 bg-gray-950 p-6">
              <div className="text-xs text-gray-600 mb-4">[AGENTS]</div>
              <div className="space-y-3">
                {agents.map(agent => (
                  <div key={agent.name} className="p-3 border border-gray-800 bg-black">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                          agent.status === 'complete' ? 'bg-green-500' :
                          'bg-gray-700'
                        }`} />
                        <span className="text-xs font-bold uppercase">{agent.name}</span>
                      </div>
                      <span className={`text-xs ${getStatusColor(agent.status)}`}>
                        {agent.status.toUpperCase()}
                      </span>
                    </div>
                    {agent.status !== 'idle' && (
                      <div className="text-xs text-gray-600 flex justify-between">
                        <span>Tasks: {agent.tasks}</span>
                        <span>Time: {agent.time}s</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="border border-gray-800 bg-gray-950 p-6">
              <div className="text-xs text-gray-600 mb-4">[METRICS]</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-bold">{agents.reduce((sum, a) => sum + a.time, 0).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-bold text-green-500">$0.0042</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agents:</span>
                  <span className="font-bold">{agents.filter(a => a.status === 'complete').length}/4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Terminal Logs */}
          <div className="lg:col-span-2">
            <div className="border border-gray-800 bg-gray-950 p-6 h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-600">[LOGS]</div>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-gray-600 hover:text-white transition-colors"
                >
                  CLEAR
                </button>
              </div>
              
              <div className="bg-black border border-gray-800 p-4 h-[calc(100%-48px)] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-xs text-gray-700">
                    <div>$ waiting for input...</div>
                    <div className="mt-2 text-gray-800">Upload a file and click RUN AGENTS to start</div>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-gray-700">[{log.timestamp}]</span>
                      {' '}
                      <span className="text-gray-600">[{log.agent}]</span>
                      {' '}
                      <span className={getLogColor(log.level)}>{log.message}</span>
                    </div>
                  ))
                )}
                
                {logs.length > 0 && (
                  <div className="mt-2">
                    <span className="text-gray-700">$ </span>
                    <span className="animate-pulse">_</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
