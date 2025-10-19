import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import type { MeetResponse } from '@/services/api';

export default function Room(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [roomData, setRoomData] = useState<MeetResponse | null>(null);

  useEffect(() => {
    if (!roomId || !user) {
      navigate('/dashboard');
      return;
    }

    const initializeRoom = async () => {
      try {
        // Join the room
        const response = await apiService.joinMeet(roomId, {
          user_id: user.username,
          display_name: user.name
        });

        setRoomData(response);
        setIsLoading(false);

        toast({
          title: 'Joined room successfully',
          description: 'Loading video conference...',
        });
      } catch (error: any) {
        console.error('Failed to join room:', error);
        toast({
          title: 'Failed to join room',
          description: error.message,
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
    };

    initializeRoom();
  }, [roomId, user, navigate, toast]);

  const copyLink = () => {
    if (!roomId) return;
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied!',
      description: 'Share this link with others to join the room',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Joining room...</h2>
          <p className="text-muted-foreground">Please wait while we connect you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Video Conference</h2>
          <p className="text-sm text-muted-foreground">Room ID: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Video Conference */}
      {roomData && (
        <div className="flex-1 bg-black flex justify-center">
          <div className="w-[95%] h-full">
            <iframe
              src={`${roomData.embed_url}`}
              allow="camera *; microphone *; display-capture *; fullscreen *; clipboard-read *; clipboard-write *; screen-wake-lock *"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals allow-presentation"
              className="w-full border-none"
              style={{ 
                height: 'calc(100vh - 57px)',
                aspectRatio: '16/9',
                minHeight: '600px'
              }}
              title="Video Conference"
              referrerPolicy="origin"
              loading="eager"
            />
          </div>
        </div>
      )}
    </div>
  );
}