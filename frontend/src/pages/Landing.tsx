import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Video, Users, Shield, Zap } from 'lucide-react';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Educational Video Conferencing Platform
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to{' '}
            <span className="text-primary">SamaConnect</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect teachers and students through seamless video classes.
            Create, share, and join live educational sessions with ease.
          </p>

          <div className="flex gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-card border rounded-xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Live Classes</h3>
            <p className="text-muted-foreground">
              Create and host live video classes with multiple participants
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Easy Sharing</h3>
            <p className="text-muted-foreground">
              Generate unique links and share them instantly with students
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Host Controls</h3>
            <p className="text-muted-foreground">
              Full control over participant audio, video, and permissions
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-card border rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of educators using SamaConnect for online teaching
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Create Your First Class
          </Button>
        </div>
      </div>
    </div>
  );
}
