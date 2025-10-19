import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTitle: string;
  onSubmit: (password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function PasswordDialog({ 
  open, 
  onOpenChange, 
  roomTitle, 
  onSubmit, 
  isLoading = false,
  error 
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
    }
  };

  const handleClose = () => {
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-yellow-600" />
            Protected Room
          </DialogTitle>
          <DialogDescription>
            "{roomTitle}" is password protected. Enter the password to join.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-password">Room Password</Label>
            <Input
              id="room-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              required
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}