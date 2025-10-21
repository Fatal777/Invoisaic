import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/components/Logo';
import Navbar from '@/components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* Navbar */}
      <Navbar variant="dark" />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[#d42e2e]/20 to-gray-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-gray-800/15 to-black/10 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4 relative">
        <Card className="w-full max-w-md bg-gradient-to-br from-gray-950/90 to-black/90 backdrop-blur-xl border-white/10 relative z-10 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <div>
            <CardTitle className="text-3xl text-white">Welcome Back</CardTitle>
            <CardDescription className="mt-2 text-gray-400">
              Sign in to access your AI-powered invoice platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0 focus:border-transparent transition-all"
                placeholder="demo@invoisaic.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#F97272] to-[#EFA498] hover:from-[#f85c5c] hover:to-[#F97272] text-white py-3 rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg shadow-[#F97272]/30" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
            <p className="text-xs text-white font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-[#EFA498]" />
              Demo Credentials
            </p>
            <p className="text-xs text-gray-400">Email: demo@invoisaic.com</p>
            <p className="text-xs text-gray-400">Password: demo123</p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Built for AWS AI Agent Global Hackathon 2025
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Powered by AWS Bedrock AgentCore & Amazon Nova
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
