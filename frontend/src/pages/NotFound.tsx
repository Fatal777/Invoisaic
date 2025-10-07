import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
      <Link to="/" className="mt-6">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}
