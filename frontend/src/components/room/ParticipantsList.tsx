import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Video, VideoOff, Hand, Crown } from 'lucide-react';
import type { Participant } from '@/types';

interface ParticipantsListProps {
  participants: Participant[];
  currentUser: Participant;
  isHost: boolean;
  onForceMute?: (userId: string) => void;
  onForceUnmute?: (userId: string) => void;
  onForceCamOff?: (userId: string) => void;
  onForceCamOn?: (userId: string) => void;
}

export function ParticipantsList({
  participants,
  currentUser,
  isHost,
  onForceMute,
  onForceUnmute,
  onForceCamOff,
  onForceCamOn,
}: ParticipantsListProps) {
  const allParticipants = [currentUser, ...participants];

  return (
    <div className="flex flex-col h-full border-b">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Participants</h3>
        <p className="text-sm text-muted-foreground">{allParticipants.length} in class</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {allParticipants.map((participant) => (
            <div
              key={participant.user_id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {participant.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {participant.display_name}
                      {participant.user_id === currentUser.user_id && ' (You)'}
                    </span>
                    {isHost && participant.user_id === currentUser.user_id && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    {participant.hand_raised && (
                      <Hand className="h-4 w-4 text-yellow-500 animate-bounce" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mic Status */}
                {participant.mic_muted ? (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mic className="h-4 w-4 text-green-500" />
                )}

                {/* Camera Status */}
                {participant.cam_off ? (
                  <VideoOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Video className="h-4 w-4 text-green-500" />
                )}

                {/* Host Controls */}
                {isHost && participant.user_id !== currentUser.user_id && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        participant.mic_muted
                          ? onForceUnmute?.(participant.user_id)
                          : onForceMute?.(participant.user_id)
                      }
                      title={participant.mic_muted ? 'Allow mic' : 'Mute mic'}
                    >
                      {participant.mic_muted ? (
                        <MicOff className="h-3 w-3" />
                      ) : (
                        <Mic className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        participant.cam_off
                          ? onForceCamOn?.(participant.user_id)
                          : onForceCamOff?.(participant.user_id)
                      }
                      title={participant.cam_off ? 'Allow camera' : 'Turn off camera'}
                    >
                      {participant.cam_off ? (
                        <VideoOff className="h-3 w-3" />
                      ) : (
                        <Video className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
