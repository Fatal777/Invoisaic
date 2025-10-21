import { apiClient } from './api';
import { AIAgent, APIResponse, AgentPerformance } from '../types';

export const agentService = {
  async getAgents(): Promise<APIResponse<AIAgent[]>> {
    return apiClient.get<APIResponse<AIAgent[]>>('/agents');
  },

  async getAgent(id: string): Promise<APIResponse<AIAgent>> {
    return apiClient.get<APIResponse<AIAgent>>(`/agents/${id}`);
  },

  async getAgentPerformance(): Promise<APIResponse<AgentPerformance[]>> {
    return apiClient.get<APIResponse<AgentPerformance[]>>('/agents/performance');
  },

  async getAgentLogs(agentId: string, limit?: number): Promise<APIResponse<any[]>> {
    return apiClient.get<APIResponse<any[]>>(`/agents/${agentId}/logs`, { limit });
  },
};
