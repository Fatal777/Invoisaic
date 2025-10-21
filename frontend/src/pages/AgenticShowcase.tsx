import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Brain, 
  Zap, 
  Shield, 
  TrendingUp, 
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  Network,
  Database,
  RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function AgenticShowcase() {
  const [activeComparison, setActiveComparison] = useState<'traditional' | 'agentic'>('agentic');

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            This Is NOT Just Another Invoice Maker
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            See the difference between traditional automation and autonomous AI agents
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveComparison('traditional')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeComparison === 'traditional'
                  ? 'bg-gray-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Traditional Invoice Software
            </button>
            <button
              onClick={() => setActiveComparison('agentic')}
              className={`px-6 py-3 rounded-lg transition-all ${
                activeComparison === 'agentic'
                  ? 'bg-[#EFA498] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🤖 Our Agentic AI
            </button>
          </div>
        </div>

        {/* Traditional View */}
        {activeComparison === 'traditional' && (
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-[#EFA498]" />
                  Traditional Invoice Software
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Static Workflow */}
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      Static Workflow (No Intelligence)
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
                          1. User Clicks "Generate"
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
                          2. Fill Template
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
                          3. Apply Tax (Hardcoded)
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                        <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
                          4. Done
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">
                        ❌ No reasoning • ❌ No adaptation • ❌ No intelligence • ❌ No learning
                      </p>
                    </div>
                  </div>

                  {/* Hardcoded Rules */}
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Hardcoded Tax Rules (Breaks When Laws Change)
                    </h3>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300">
                      <code>
                        {`const TAX_RATES = {
  "India": 0.18,  // What if this changes to 0.12?
  "USA": 0.07,    // What about state taxes?
  "Germany": 0.19 // What about reverse charge?
}

// Every law change = code update + deployment`}
                      </code>
                    </div>
                    <p className="text-[#F76B5E] text-sm mt-4">
                      ⚠️ Law changes? Wait 2 weeks for update. Generate wrong invoices meanwhile.
                    </p>
                  </div>

                  {/* Single AI Model */}
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      One AI Model for Everything (Slow + Expensive)
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-[#d42e2e]/20 border border-[#FEF5F4]0/30 rounded-lg p-4">
                        <div className="text-[#F76B5E] font-bold mb-2">GPT-4</div>
                        <div className="text-white text-2xl mb-1">$30</div>
                        <div className="text-gray-400 text-sm">per 1,000 invoices</div>
                      </div>
                      <div className="bg-[#d42e2e]/20 border border-[#FEF5F4]0/30 rounded-lg p-4">
                        <div className="text-[#F76B5E] font-bold mb-2">Speed</div>
                        <div className="text-white text-2xl mb-1">5 sec</div>
                        <div className="text-gray-400 text-sm">per invoice</div>
                      </div>
                      <div className="bg-[#d42e2e]/20 border border-[#FEF5F4]0/30 rounded-lg p-4">
                        <div className="text-[#F76B5E] font-bold mb-2">Accuracy</div>
                        <div className="text-white text-2xl mb-1">92%</div>
                        <div className="text-gray-400 text-sm">error rate 8%</div>
                      </div>
                    </div>
                  </div>

                  {/* Reactive Only */}
                  <div className="bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Reactive (Find Errors AFTER Invoice Created)
                    </h3>
                    <div className="space-y-2 text-gray-300">
                      <p>✅ Invoice generated</p>
                      <p>❌ Error found after sending to customer</p>
                      <p>😰 Customer disputes</p>
                      <p>📞 Manual resolution required</p>
                      <p>💸 Chargeback + reputation damage</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agentic View */}
        {activeComparison === 'agentic' && (
          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-[#EFA498]" />
                  Autonomous Agentic AI Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Autonomous Agent */}
                  <div className="bg-gradient-to-r from-[#d42e2e]/20 to-purple-900/20 border border-[#FEF5F4]0/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-[#F76B5E]" />
                      Autonomous Agent (Makes Intelligent Decisions)
                    </h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-5 gap-2">
                        <div className="bg-[#EFA498]/20 text-white px-3 py-2 rounded-lg text-center text-sm">
                          Detects Purchase
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#F76B5E] mx-auto my-auto" />
                        <div className="bg-purple-500/20 text-white px-3 py-2 rounded-lg text-center text-sm">
                          Reasons About Context
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#F76B5E] mx-auto my-auto" />
                        <div className="bg-blue-500/20 text-white px-3 py-2 rounded-lg text-center text-sm">
                          Orchestrates AI Models
                        </div>
                      </div>
                      <div className="grid md:grid-cols-5 gap-2">
                        <div className="bg-green-500/20 text-white px-3 py-2 rounded-lg text-center text-sm">
                          Validates Results
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#F76B5E] mx-auto my-auto" />
                        <div className="bg-yellow-500/20 text-white px-3 py-2 rounded-lg text-center text-sm">
                          Predicts Issues
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#F76B5E] mx-auto my-auto" />
                        <div className="bg-pink-500/20 text-white px-3 py-2 rounded-lg text-center text-sm">
                          Takes Action
                        </div>
                      </div>
                      <p className="text-green-400 text-sm">
                        ✅ Autonomous • ✅ Intelligent • ✅ Adaptive • ✅ Learning
                      </p>
                    </div>
                  </div>

                  {/* Real-time Knowledge Base */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-green-900/20 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-400" />
                      Real-Time Knowledge Base (RAG) - Never Outdated
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300">
                        <code>
                          {`// No hardcoded rules!
Agent queries Knowledge Base in real-time:

Query: "Current GST rate for electronics in India?"
Knowledge Base → Retrieves latest tax rules
Agent → Applies correct rate (18% or 12% or whatever is current)

Law changes? → Update markdown file
→ Agent uses new rules immediately
→ NO code deployment needed!`}
                        </code>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-green-500/20 text-green-400">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Updates in 5 minutes
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          195 countries
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          <Zap className="h-3 w-3 mr-1" />
                          Always correct
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Model Intelligence */}
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Network className="h-5 w-5 text-purple-400" />
                      Multi-Model Intelligence (Right AI for Right Task)
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="text-green-400 font-bold mb-2">Nova Micro (90%)</div>
                        <div className="text-white text-2xl mb-1">$0.07</div>
                        <div className="text-gray-400 text-sm mb-2">per 1,000 invoices</div>
                        <div className="text-xs text-gray-400">Fast decisions: 100ms</div>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="text-green-400 font-bold mb-2">Nova Pro (10%)</div>
                        <div className="text-white text-2xl mb-1">$1.20</div>
                        <div className="text-gray-400 text-sm mb-2">for complex cases</div>
                        <div className="text-xs text-gray-400">Legal reasoning: 1.5s</div>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="text-green-400 font-bold mb-2">Combined</div>
                        <div className="text-white text-2xl mb-1">99.9%</div>
                        <div className="text-gray-400 text-sm mb-2">accuracy</div>
                        <div className="text-xs text-gray-400">428x cheaper!</div>
                      </div>
                    </div>
                    <p className="text-green-400 text-sm mt-4">
                      💡 Agent intelligently routes: simple → Nova Micro, complex → Nova Pro
                    </p>
                  </div>

                  {/* Predictive Intelligence */}
                  <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yellow-400" />
                      Predictive Intelligence (Prevent Problems BEFORE They Happen)
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-yellow-400 mt-1" />
                          <div>
                            <div className="font-semibold text-white mb-1">BEFORE Invoice Created:</div>
                            <p className="text-gray-300 text-sm">
                              ⚠️ "This will likely be flagged in audit because amount is 25% above historical average"
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                          <div>
                            <div className="font-semibold text-white mb-1">Agent Suggests Fix:</div>
                            <p className="text-gray-300 text-sm">
                              ✅ "Add proof of delivery documentation"<br />
                              ✅ "Include purchase order reference"
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-blue-400 mt-1" />
                          <div>
                            <div className="font-semibold text-white mb-1">Result:</div>
                            <p className="text-gray-300 text-sm">
                              Problem prevented, not just detected!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Agent Collaboration */}
                  <div className="bg-gradient-to-r from-pink-900/20 to-[#d42e2e]/20 border border-pink-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Network className="h-5 w-5 text-pink-400" />
                      Multi-Agent Collaboration (Specialized Experts Working Together)
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { name: 'Pricing Agent', role: 'Market analysis', icon: DollarSign, color: 'green' },
                        { name: 'Fraud Agent', role: 'Risk detection', icon: Shield, color: 'red' },
                        { name: 'Compliance Agent', role: 'Legal validation', icon: CheckCircle, color: 'blue' },
                        { name: 'Tax Agent', role: 'Optimization', icon: TrendingUp, color: 'yellow' },
                        { name: 'Vendor Agent', role: 'Reputation check', icon: Network, color: 'purple' },
                        { name: 'Orchestrator', role: 'Coordinates all', icon: Brain, color: 'pink' },
                      ].map((agent, idx) => {
                        const Icon = agent.icon;
                        return (
                          <div key={idx} className={`bg-${agent.color}-900/20 border border-${agent.color}-500/30 rounded-lg p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`h-5 w-5 text-${agent.color}-400`} />
                              <div className="font-semibold text-white text-sm">{agent.name}</div>
                            </div>
                            <div className="text-xs text-gray-400">{agent.role}</div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-pink-400 text-sm mt-4">
                      🤝 All agents work autonomously and collaborate to make the best decision
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom CTA */}
            <Card className="bg-gradient-to-r from-[#d42e2e]/20 to-purple-900/20 border-[#FEF5F4]0/30">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  This Is the Future of Invoice Intelligence
                </h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Not just automation. Not just AI features. True autonomous intelligence that thinks, reasons, and acts like a team of experts.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    className="bg-[#EFA498] hover:bg-[#F97272]"
                    onClick={() => window.location.href = '/demo'}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    See It In Action
                  </Button>
                  <Button 
                    className="bg-white/10 hover:bg-white/20"
                    onClick={() => window.location.href = '/'}
                  >
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
