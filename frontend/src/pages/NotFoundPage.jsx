import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center font-bold text-2xl text-cyan mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-main">Page Not Found</h1>
      <p className="text-xs text-muted max-w-sm mt-2 mb-6">
        The requested page does not exist or you do not have permission to access it.
      </p>
      <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
        Return Home
      </Button>
    </div>
  );
};

export default NotFoundPage;
