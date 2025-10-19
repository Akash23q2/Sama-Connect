import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Hand, PhoneOff, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isHost: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onHandToggle: () => void;
  onLeave: () => void;
  onEndClass?: () => void;
}

export function ControlBar({
  isMicOn,
  isCameraOn,
  isHandRaised,
  isHost,
  onMicToggle,
  onCameraToggle,
  onHandToggle,
  onLeave,
  onEndClass,
}: ControlBarProps) {
  return (
    <div className="bg-video-control border-t px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mic Control */}
          <Button
            size="lg"
            variant={isMicOn ? 'default' : 'destructive'}
            className="rounded-full h-12 w-12"
            onClick={onMicToggle}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Camera Control */}
          <Button
            size="lg"
            variant={isCameraOn ? 'default' : 'destructive'}
            className="rounded-full h-12 w-12"
            onClick={onCameraToggle}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Raise Hand */}
          <Button
            size="lg"
            variant={isHandRaised ? 'default' : 'outline'}
            className="rounded-full h-12 w-12"
            onClick={onHandToggle}
          >
            <Hand className={`h-5 w-5 ${isHandRaised ? 'animate-bounce' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" variant="outline" className="rounded-full h-12 w-12">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Audio Settings</DropdownMenuItem>
              <DropdownMenuItem disabled>Video Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Leave/End Controls */}
          {isHost && onEndClass ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" variant="destructive" className="rounded-full">
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLeave}>Leave Class</DropdownMenuItem>
                <DropdownMenuItem onClick={onEndClass} className="text-destructive">
                  End Class for All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full"
              onClick={onLeave}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Leave
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
