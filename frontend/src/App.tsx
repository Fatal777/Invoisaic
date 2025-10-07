import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceList from './pages/InvoiceList';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceDetail from './pages/InvoiceDetail';
import DocumentUpload from './pages/DocumentUpload';
import Vendors from './pages/Vendors';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import AIInsights from './pages/AIInsights';
import AgentMonitor from './pages/AgentMonitor';
import DemoSimulator from './pages/DemoSimulator';
import AgenticShowcase from './pages/AgenticShowcase';
import AutonomousAgent from './pages/AutonomousAgent';
import ArchitectureView from './pages/ArchitectureView';
import Features from './pages/Features';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import DemoHub from './pages/DemoHub';
import EcommerceDemo from './pages/demos/EcommerceDemo';
import OCRDemo from './pages/demos/OCRDemo';
import OnboardingDemo from './pages/demos/OnboardingDemo';
import AgentsDemo from './pages/demos/AgentsDemo';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes - no auth required */}
      <Route path="/" element={<Landing />} />
      
      {/* New Demo Hub */}
      <Route path="/demo" element={<DemoHub />} />
      <Route path="/demo/ecommerce" element={<EcommerceDemo />} />
      <Route path="/demo/ocr" element={<OCRDemo />} />
      <Route path="/demo/onboarding" element={<OnboardingDemo />} />
      <Route path="/demo/agents" element={<AgentsDemo />} />
      
      {/* Legacy demos */}
      <Route path="/demo-simulator" element={<DemoSimulator />} />
      <Route path="/autonomous" element={<AutonomousAgent />} />
      <Route path="/architecture" element={<ArchitectureView />} />
      <Route path="/why-agentic" element={<AgenticShowcase />} />
      <Route path="/features" element={<Features />} />
      <Route path="/login" element={<Login />} />
      
      {isAuthenticated ? (
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/list" element={<InvoiceList />} />
          <Route path="invoices/create" element={<InvoiceCreate />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="documents" element={<DocumentUpload />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="insights" element={<AIInsights />} />
          <Route path="agents" element={<AgentMonitor />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      ) : (
        <Route path="/app/*" element={<Navigate to="/login" replace />} />
      )}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
