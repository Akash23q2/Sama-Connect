import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Copy } from 'lucide-react';

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [room, setRoom] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  // Get embed_url from location state or fetch it
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const initializeMeeting = async () => {
      try {
        // Get room details
        const roomData = await apiService.get(`/meet/room/${roomId}`);
        setRoom(roomData);
        setIsHost(user.username === roomData.host_id);

        // If no embed_url in state, rejoin to get it
        if (!location.state?.embed_url) {
          const joinResponse = await apiService.post(`/meet/room/${roomId}/join`, {
            user_id: user.username,
            display_name: user.name
          });
          
          const iframe = document.getElementById('mirotalk-frame') as HTMLIFrameElement;
          if (iframe) {
            iframe.src = joinResponse.embed_url;
          }
        } else {
          const iframe = document.getElementById('mirotalk-frame') as HTMLIFrameElement;
          if (iframe) {
            iframe.src = location.state.embed_url;
          }
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
    };

    initializeMeeting();

    // Add beforeunload event listener
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';

      try {
        if (isHost) {
          await apiService.post(`/meet/room/${roomId}/end`, {}, { keepalive: true });
        } else {
          await apiService.post(`/meet/room/${roomId}/leave`, {
            user_id: user.username
          }, { keepalive: true });
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, user]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied!',
      description: 'Meeting link has been copied to clipboard',
    });
  };

  const handleLeave = async () => {
    try {
      await apiService.post(`/meet/room/${roomId}/leave`, {
        user_id: user?.username
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEndMeeting = async () => {
    try {
      await apiService.post(`/meet/room/${roomId}/end`);
      toast({
        title: 'Meeting ended',
        description: 'The meeting has been ended for all participants',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-black/20 backdrop-blur-sm px-4 py-3 flex items-center justify-between text-white">
        <div>
          <h1 className="font-semibold text-lg">{room?.room_title}</h1>
          <p className="text-sm opacity-80">Room ID: {roomId}</p>
        </div>
        <div className="bg-green-500 px-3 py-1 rounded-full text-sm">
          {isHost ? 'Host' : 'Participant'}
        </div>
      </div>

      <div className="flex-1 p-4">
        <iframe
          id="mirotalk-frame"
          className="w-full h-full rounded-xl shadow-2xl bg-black/50"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          allowFullScreen
        ></iframe>
      </div>

      <div className="bg-black/20 backdrop-blur-sm p-4 flex items-center justify-center gap-4">
        <Button variant="outline" onClick={handleCopyLink}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </Button>
        {isHost ? (
          <Button variant="destructive" onClick={() => setShowEndDialog(true)}>
            🛑 End Meeting
          </Button>
        ) : (
          <Button variant="destructive" onClick={handleLeave}>
            🚪 Leave Meeting
          </Button>
        )}
      </div>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End meeting for everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the meeting for all participants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndMeeting} className="bg-destructive text-destructive-foreground">
              End Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}