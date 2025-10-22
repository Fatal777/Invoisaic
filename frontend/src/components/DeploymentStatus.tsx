import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Server, 
  Database,
  Cloud,
  Cpu,
  Network,
  RefreshCw
} from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string;
  status: 'PREPARED' | 'NOT_PREPARED' | 'FAILED' | 'UNKNOWN';
  aliasId?: string;
}

export default function DeploymentStatus() {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { 
      id: import.meta.env.VITE_ORCHESTRATOR_AGENT_ID || 'orchestrator-id', 
      name: 'Orchestrator', 
      status: 'UNKNOWN', 
      aliasId: import.meta.env.VITE_ORCHESTRATOR_ALIAS_ID || 'alias-id'
    },
    { 
      id: import.meta.env.VITE_EXTRACTION_AGENT_ID || 'extraction-id', 
      name: 'Extraction', 
      status: 'UNKNOWN', 
      aliasId: import.meta.env.VITE_EXTRACTION_ALIAS_ID || 'alias-id'
    },
    { 
      id: import.meta.env.VITE_COMPLIANCE_AGENT_ID || 'compliance-id', 
      name: 'Compliance', 
      status: 'UNKNOWN', 
      aliasId: import.meta.env.VITE_COMPLIANCE_ALIAS_ID || 'alias-id'
    },
    { 
      id: import.meta.env.VITE_VALIDATION_AGENT_ID || 'validation-id', 
      name: 'Validation', 
      status: 'UNKNOWN', 
      aliasId: import.meta.env.VITE_VALIDATION_ALIAS_ID || 'alias-id'
    },
  ]);

  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkDeploymentStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkDeploymentStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkDeploymentStatus = async () => {
    try {
      // Check API status
      const apiUrl = import.meta.env.VITE_API_URL || 'https://your-api-url';
      
      try {
        const response = await fetch(`${apiUrl}/health`, { method: 'GET' });
        setApiStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        setApiStatus('offline');
      }

      // Check agent status (if agent status endpoint is available)
      const agentStatusUrl = import.meta.env.VITE_AGENT_STATUS_URL || 'https://your-agent-status-url';
      
      try {
        const response = await fetch(agentStatusUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.agents) {
            setAgents(data.agents);
          }
        }
      } catch (error) {
        console.warn('Could not fetch agent status');
      }

      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking deployment status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PREPARED':
      case 'online':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAILED':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'NOT_PREPARED':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PREPARED':
      case 'online':
        return <Badge variant="success">Ready</Badge>;
      case 'FAILED':
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'NOT_PREPARED':
        return <Badge variant="warning">Not Ready</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* API Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Gateway Status</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(apiStatus)}
              <span className="text-2xl font-bold capitalize">{apiStatus}</span>
            </div>
            {getStatusBadge(apiStatus)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Main API: {import.meta.env.VITE_API_URL || 'Not configured'}
          </p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground mt-1">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bedrock Agents Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bedrock Agents</CardTitle>
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={checkDeploymentStatus}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(agent.status)}
                  <div>
                    <p className="font-medium">{agent.name} Agent</p>
                    <p className="text-xs text-muted-foreground">ID: {agent.id}</p>
                    {agent.aliasId && (
                      <p className="text-xs text-muted-foreground">Alias: {agent.aliasId}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Resources */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Infrastructure</CardTitle>
          <Cloud className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm">DynamoDB Tables</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Lambda Functions</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Network className="h-4 w-4 text-green-500" />
                <span className="text-sm">API Gateway</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-orange-500" />
                <span className="text-sm">S3 Bucket</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tax Compliance KB</p>
              <p className="text-xs text-muted-foreground">
                ID: {import.meta.env.VITE_KNOWLEDGE_BASE_ID || 'Not configured'}
              </p>
            </div>
            <Badge variant="success">Ready</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
