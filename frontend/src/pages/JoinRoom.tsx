import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Lock, User } from 'lucide-react';

interface RoomDetails {
  room_id: string;
  host_id: string;
  room_title: string;
  room_description: string;
  is_protected: boolean;
}

export default function JoinRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadRoomDetails();
  }, [roomId, user]);

  const loadRoomDetails = async () => {
    try {
      const data = await apiService.get(`/meet/room/${roomId}`);
      setRoom(data);
      setDisplayName(user?.name || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load meeting details. The meeting may have ended.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!room || !user) return;

    setIsJoining(true);
    try {
      const response = await apiService.post(`/meet/room/${roomId}/join`, {
        user_id: user.username,
        display_name: displayName,
        password: room.is_protected ? password : undefined
      });

      navigate(`/room/${roomId}/meeting`, {
        state: { embed_url: response.embed_url }
      });
    } catch (error: any) {
      toast({
        title: 'Failed to join',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) return null;

  const isHost = user?.username === room.host_id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{room.room_title}</CardTitle>
          <CardDescription>{room.room_description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="relative">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="pl-10"
              />
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {room.is_protected && !isHost && (
            <div className="space-y-2">
              <Label htmlFor="password">Meeting Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter meeting password"
                  className="pl-10"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={handleJoin}
            disabled={!displayName || isJoining || (room.is_protected && !isHost && !password)}
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </>
            ) : (
              'Join Meeting'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}