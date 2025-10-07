import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, Brain, DollarSign, Shield, Users } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { apiClient } from '@/services/api';

const iconMap: Record<string, any> = {
  supervisor: Brain,
  pricing: DollarSign,
  compliance: Shield,
  customer_intelligence: Users,
};

export default function AgentMonitor() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await apiClient.get<any>('/agents');
      setAgents(response.data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Monitor</h1>
        <p className="text-gray-500 mt-1">Real-time monitoring of AI agent activities</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading agents...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent) => {
              const Icon = iconMap[agent.type] || Brain;
          return (
            <Card key={agent.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {agent.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                  
                  {agent.currentTask && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {agent.currentTask}
                    </p>
                  )}
                  
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Tasks Completed</span>
                      <span className="font-semibold">{agent.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Success Rate</span>
                      <span className="font-semibold text-green-600">{agent.successRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg Time</span>
                      <span className="font-semibold">{agent.avgProcessingTime}s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
            })}
          </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2 min ago', agent: 'Supervisor', action: 'Completed invoice processing for INV-2025-044', status: 'success' },
              { time: '5 min ago', agent: 'Pricing', action: 'Calculated optimal pricing for new customer', status: 'success' },
              { time: '8 min ago', agent: 'Compliance', action: 'Validated tax compliance for 3 invoices', status: 'success' },
              { time: '12 min ago', agent: 'Customer Intelligence', action: 'Generated payment prediction report', status: 'success' },
              { time: '15 min ago', agent: 'Supervisor', action: 'Delegated task to Pricing Agent', status: 'info' },
            ].map((log, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.agent} Agent</p>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
