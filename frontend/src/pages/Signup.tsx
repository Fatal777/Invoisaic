import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/components/Logo';
import Navbar from '@/components/Navbar';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      // For demo purposes, use login after signup
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Signup failed:', error);
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
              <CardTitle className="text-3xl text-white">Create Account</CardTitle>
              <CardDescription className="mt-2 text-gray-400">
                Start automating your invoices with AI
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0 focus:border-transparent transition-all"
                  placeholder="Acme Inc."
                  required
                />
              </div>
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
                  placeholder="you@company.com"
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
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#F97272] to-[#EFA498] hover:from-[#f85c5c] hover:to-[#F97272] text-white py-3 rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg shadow-[#F97272]/30" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-[#EFA498] hover:text-[#F76B5E] font-medium transition-colors">
                  Sign In
                </Link>
              </p>
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
