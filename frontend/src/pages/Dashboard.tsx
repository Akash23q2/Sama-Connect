import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Video, Calendar, Copy, ExternalLink } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import PasswordDialog from '@/components/PasswordDialog';

export default function Dashboard(): JSX.Element {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingRoom, setPendingRoom] = useState<any>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isJoiningWithPassword, setIsJoiningWithPassword] = useState(false);

  const [newClass, setNewClass] = useState({
    room_title: '',
    room_description: '',
    max_participants: 10,
    password: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Load recent rooms from localStorage
    const rooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    setRecentRooms(rooms);
    
    // Check if redirected from failed room URL with suggested code
    const suggestedCode = (location.state as any)?.suggestedRoomCode;
    if (suggestedCode) {
      console.log('📎 Pre-filling room code from failed URL:', suggestedCode);
      toast({
        title: 'Room Access Failed',
        description: `Couldn't access room ${suggestedCode}. You can try joining again below.`,
        variant: 'destructive'
      });
      
      // Pre-fill the room code input
      setTimeout(() => {
        const codeInput = document.querySelector('input[name="code"]') as HTMLInputElement;
        if (codeInput) {
          codeInput.value = suggestedCode;
          codeInput.focus();
        }
      }, 100);
    }
  }, [location.state, toast]);

  const handleJoinRoom = async (code: string, password?: string) => {
    try {
      console.log('🔍 Checking room:', code);
      // Check if room exists and is active
      const roomData = await apiService.getMeet(code);
      console.log('✅ Room found:', roomData);
      
      // Check if room is active
      if (!roomData.is_active) {
        toast({
          title: 'Meeting Ended',
          description: 'This meeting has been ended by the host.',
          variant: 'destructive'
        });
        return;
      }
      
      // Check participant limit
      if (roomData.participants && roomData.participants.length >= roomData.max_participants) {
        toast({
          title: 'Room Full',
          description: `This room is full (${roomData.max_participants} participants).`,
          variant: 'destructive'
        });
        return;
      }
      
      // Check if room is password protected and we don't have password yet
      if (roomData.require_password && !password) {
        console.log('🔒 Room is protected, showing password dialog');
        setPendingRoom({ code, roomData });
        setShowPasswordDialog(true);
        return;
      }
      
      // Navigate to room
      console.log('🚀 Joining room:', code);
      navigate(`/room/${code}`);
      
    } catch (error: any) {
      console.error('❌ Room check failed:', error);
      
      const errorMessage = error.message || 'Unknown error';
      
      // Handle password error specifically
      if (password && errorMessage.includes('Incorrect password')) {
        setPasswordError('Incorrect password. Please try again.');
        setIsJoiningWithPassword(false);
        return;
      }
      
      toast({
        title: 'Room Not Found',
        description: errorMessage.includes('Room has ended') ? 'This meeting has been ended.' : errorMessage,
        variant: 'destructive'
      });
    }
  };
  
  const handlePasswordSubmit = async (password: string) => {
    if (!pendingRoom) return;
    
    setIsJoiningWithPassword(true);
    setPasswordError(null);
    
    // Navigate to room with password - let Room component handle the password
    navigate(`/room/${pendingRoom.code}`, { 
      state: { 
        password,
        roomData: pendingRoom.roomData 
      } 
    });
    
    setShowPasswordDialog(false);
    setPendingRoom(null);
    setIsJoiningWithPassword(false);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      const params = new URLSearchParams();
      params.append('host_id', user.username);
      params.append('room_title', newClass.room_title);
      params.append('room_description', newClass.room_description);
      params.append('max_participants', newClass.max_participants.toString());
      if (newClass.password) {
        params.append('password', newClass.password);
      }
      const response = await fetch(`${apiService.getBaseUrl()}/meet/room/create?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create class');
      }
      
      const result = await response.json();

      // Save to recent rooms
      const room = {
        room_id: result.room_id,
        room_title: newClass.room_title,
        room_description: newClass.room_description,
        created_at: new Date().toISOString(),
        is_host: true,
        join_link: result.join_link
      };
      
      const rooms = JSON.parse(localStorage.getItem('recentRooms') || '[]');
      rooms.unshift(room);
      localStorage.setItem('recentRooms', JSON.stringify(rooms.slice(0, 5)));

      toast({
        title: 'Meeting room created!',
        description: 'Redirecting to the room...',
      });

      setCreateDialogOpen(false);
      navigate(`/room/${result.room_id}`);
    } catch (error: any) {
      toast({
        title: 'Failed to create meeting',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = async (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        toast({
          title: 'Link copied!',
          description: 'Meeting link has been copied to clipboard',
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
            description: 'Meeting link has been copied to clipboard',
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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-muted-foreground">
            Manage your classes and start teaching
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Create New Class</CardTitle>
                  <CardDescription>
                    Start a live video class and invite students
                  </CardDescription>
                </CardHeader>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Fill in the details to create your live class
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Class Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Math Class - Algebra Basics"
                    value={newClass.room_title}
                    onChange={(e) =>
                      setNewClass({ ...newClass, room_title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What will you teach today?"
                    value={newClass.room_description}
                    onChange={(e) =>
                      setNewClass({ ...newClass, room_description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Maximum Participants</Label>
                  <Input
                    id="max"
                    type="number"
                    min="2"
                    max="50"
                    value={newClass.max_participants}
                    onChange={(e) =>
                      setNewClass({
                        ...newClass,
                        max_participants: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Set a password for the class"
                    value={newClass.password}
                    onChange={(e) =>
                      setNewClass({ ...newClass, password: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Class'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-2">
                <Video className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Join with Code</CardTitle>
              <CardDescription>
                Enter a class code to join as a participant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const code = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value.trim();
                  if (code) {
                    await handleJoinRoom(code);
                  }
                }}
              >
                <Input 
                  name="code"
                  placeholder="Enter room code" 
                  minLength={8} 
                  maxLength={8}
                  pattern="[A-Za-z0-9]+"
                  title="Please enter a valid 8-character room code"
                  required
                />
                <Button type="submit">Join</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Classes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Recent Classes
          </h2>

          {recentRooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No classes yet. Create your first class to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRooms.slice(0, 5).map((room) => (
                <Card key={room.room_id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{room.room_title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {room.room_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(room.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleJoinRoom(room.room_id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {room.is_host ? 'Enter' : 'Join'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLink(room.room_id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Password Dialog */}
      {pendingRoom && (
        <PasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          roomTitle={pendingRoom.roomData?.room_title || 'Meeting Room'}
          onSubmit={handlePasswordSubmit}
          isLoading={isJoiningWithPassword}
          error={passwordError}
        />
      )}
    </div>
  );
}
