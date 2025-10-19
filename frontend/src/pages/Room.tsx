import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Power } from 'lucide-react';
import type { MeetResponse } from '@/services/api';
import MiroTalkMeet from '@/components/room/MiroTalkMeet';
import PasswordDialog from '@/components/PasswordDialog';

export default function Room(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [roomData, setRoomData] = useState<MeetResponse | null>(null);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isJoiningWithPassword, setIsJoiningWithPassword] = useState(false);
  
  console.log('🏠 Room component initialized with:', { 
    roomId, 
    user: user?.username, 
    authLoading,
    isLoading, 
    roomData: !!roomData, 
    isHost 
  });

  const initializeRoom = useCallback(async (password?: string) => {
    // Use password from location state if available (from Dashboard)
    const statePassword = (location.state as any)?.password;
    const finalPassword = password || statePassword;
    try {
      console.log('🏁 Joining room directly (user authenticated):', roomId);
      
      // Get room details first
      const roomInfo = await apiService.getMeet(roomId);
      console.log('📝 Room info:', roomInfo);
      
      // Check if room is password protected and we don't have password yet
      if (roomInfo.require_password && !finalPassword) {
        console.log('🔒 Room is protected, showing password dialog');
        setRoomDetails(roomInfo);
        setShowPasswordDialog(true);
        setIsLoading(false);
        return;
      }
      
      // Check if user is the host
      const userIsHost = roomInfo.host_id === user.username;
      console.log('👑 Host check:', { hostId: roomInfo.host_id, userId: user.username, isHost: userIsHost });
      
      setRoomDetails(roomInfo);
      setIsHost(userIsHost);
      
      // Join the room
      const joinData = {
        user_id: user.username,
        display_name: user.name,
        ...(finalPassword && { password: finalPassword })
      };
      console.log('🔗 Attempting to join with data:', { ...joinData, password: finalPassword ? '[HIDDEN]' : undefined });
      const response = await apiService.joinMeet(roomId, joinData);
      
      console.log('✅ Successfully joined room:', response);
      setRoomData(response);
      setIsLoading(false);
      setShowPasswordDialog(false);
      setIsJoiningWithPassword(false);
      setPasswordError(null);

      // Add room to recent history for this user
      const recentRoom = {
        room_id: roomId,
        room_title: roomInfo.room_title || 'Video Conference',
        room_description: roomInfo.room_description || '',
        created_at: new Date().toISOString(),
        is_host: userIsHost,
        host_id: roomInfo.host_id
      };
      
      const existingRooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
      // Remove existing entry for this room if present
      const filteredRooms = existingRooms.filter((room: any) => room.room_id !== roomId);
      // Add to front
      filteredRooms.unshift(recentRoom);
      // Keep only 5 most recent
      localStorage.setItem('recentRooms', JSON.stringify(filteredRooms.slice(0, 5)));

      toast({
        title: userIsHost ? 'Room opened as host' : 'Joined room successfully',
        description: `Welcome to ${roomInfo.room_title || 'the meeting'}!`,
      });
    } catch (error: unknown) {
      console.error('🛑 Failed to join room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to join room';
      
      // If we're trying with password, handle password-specific errors
      if (finalPassword) {
        setIsJoiningWithPassword(false);
        if (errorMessage.includes('Incorrect password') || errorMessage.includes('password')) {
          setPasswordError('Incorrect password. Please try again.');
          return;
        }
      }
      
      // Check specific error types
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid credentials')) {
        toast({
          title: 'Authentication Required',
          description: 'Please try signing in to join this room.',
          variant: 'destructive',
        });
        navigate('/auth');
      } else if (errorMessage.includes('Room has ended') || errorMessage.includes('ended')) {
        toast({
          title: 'Meeting Ended',
          description: 'This meeting has been ended by the host.',
          variant: 'destructive',
        });
        navigate('/dashboard', { state: { suggestedRoomCode: roomId } });
      } else if (errorMessage.includes('Room is full') || errorMessage.includes('full')) {
        toast({
          title: 'Room Full',
          description: 'This room has reached its maximum capacity.',
          variant: 'destructive',
        });
        navigate('/dashboard', { state: { suggestedRoomCode: roomId } });
      } else {
        toast({
          title: 'Unable to Join Room',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
    }
  }, [roomId, user, location.state, navigate, toast]);

  useEffect(() => {
    console.log('🚀 Room useEffect triggered with:', { roomId, user: user?.username, authLoading });
    
    // Wait for auth to load before making decisions
    if (authLoading) {
      console.log('⏳ Waiting for auth to load...');
      return;
    }
    
    if (!roomId || !user) {
      console.log('⚠️ Missing roomId or user, navigating to dashboard with pre-filled code');
      // If we have roomId but no user, pre-fill the room code in dashboard
      if (roomId) {
        navigate('/dashboard', { state: { suggestedRoomCode: roomId } });
      } else {
        navigate('/dashboard');
      }
      return;
    }

    console.log('🏃 Starting room initialization...');
    initializeRoom();
  }, [roomId, user, authLoading, navigate, toast, initializeRoom]);
  
  const handlePasswordSubmit = async (password: string) => {
    setIsJoiningWithPassword(true);
    setPasswordError(null);
    await initializeRoom(password);
  };
  
  // Listen for iframe disconnection/leave events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://sfu.mirotalk.com') {
        console.log('📬 Received message from MiroTalk:', event.data);
        
        // Check if user left the meeting
        if (event.data && 
            (event.data.type === 'leave' || 
             event.data.type === 'disconnect' ||
             event.data.action === 'leave' ||
             event.data.action === 'disconnect' ||
             String(event.data).includes('left') ||
             String(event.data).includes('disconnect'))) {
          console.log('🚀 User left meeting via MiroTalk UI, redirecting to dashboard');
          toast({
            title: 'Left Meeting',
            description: 'You have left the meeting.',
          });
          navigate('/dashboard');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, toast]);

  const copyLink = async () => {
    if (!roomId) return;
    const link = `${window.location.origin}/room/${roomId}`;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        toast({
          title: 'Link copied!',
          description: 'Share this link with others to join the room',
        });
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast({
            title: 'Link copied!',
            description: 'Share this link with others to join the room',
          });
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Show the link to user as fallback
      toast({
        title: 'Copy failed',
        description: `Please copy this link manually: ${link}`,
        variant: 'destructive',
      });
    }
  };

  const handleEndMeeting = async () => {
    if (!roomId || !isHost) return;

    try {
      console.log('📴 Host ending meeting:', roomId);
      await apiService.endMeet(roomId);
      
      toast({
        title: 'Meeting Ended',
        description: 'The meeting has been ended for all participants.',
      });
      
      // Navigate back to dashboard
      navigate('/dashboard');
      
    } catch (error: unknown) {
      console.error('❌ Failed to end meeting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to end meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            {authLoading ? 'Checking authentication...' : 'Joining room...'}
          </h2>
          <p className="text-muted-foreground">
            {authLoading ? 'Please wait while we verify your login' : 'Please wait while we connect you'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-semibold">
            {roomDetails?.room_title || 'Video Conference'}
            {isHost && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">HOST</span>}
          </h2>
          <p className="text-sm text-muted-foreground">
            Room ID: {roomId} • {roomDetails?.participants?.length || 0}/{roomDetails?.max_participants || 10} participants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          
          {isHost ? (
            <Button variant="destructive" size="sm" onClick={handleEndMeeting}>
              <Power className="h-4 w-4 mr-2" />
              End Meeting
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* Video Conference */}
      {roomData && roomId && user && (
        <MiroTalkMeet
          roomId={roomId}
          userName={user.name || user.username}
          isHost={isHost}
        />
      )}
      
      {/* Password Dialog */}
      {roomDetails && (
        <PasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          roomTitle={roomDetails.room_title || 'Meeting Room'}
          onSubmit={handlePasswordSubmit}
          isLoading={isJoiningWithPassword}
          error={passwordError}
        />
      )}
    </div>
  );
}
