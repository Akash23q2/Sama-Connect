import { useEffect, useRef } from 'react';
import type { Participant } from '@/types';
import { Mic, MicOff, VideoOff, Hand } from 'lucide-react';

interface VideoGridProps {
  localStream: MediaStream | null;
  streams: Map<string, MediaStream>;
  participants: Map<string, Participant>;
  currentUserId: string;
}

export function VideoGrid({
  localStream,
  streams,
  participants,
  currentUserId,
}: VideoGridProps) {
  const totalParticipants = streams.size + 1;
  const gridCols = totalParticipants <= 1 ? 1 : totalParticipants <= 4 ? 2 : 3;

  return (
    <div
      className={`grid gap-4 h-full ${
        gridCols === 1
          ? 'grid-cols-1'
          : gridCols === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {/* Local Video */}
      <VideoTile
        stream={localStream}
        participant={{
          user_id: currentUserId,
          display_name: 'You',
          mic_muted: false,
          cam_off: false,
          hand_raised: false,
        }}
        isLocal
      />

      {/* Remote Videos */}
      {Array.from(streams.entries()).map(([peerId, stream]) => {
        const participant = participants.get(peerId) || {
          user_id: peerId,
          display_name: peerId,
          mic_muted: false,
          cam_off: false,
          hand_raised: false,
        };

        return <VideoTile key={peerId} stream={stream} participant={participant} />;
      })}
    </div>
  );
}

interface VideoTileProps {
  stream: MediaStream | null;
  participant: Participant;
  isLocal?: boolean;
}

function VideoTile({ stream, participant, isLocal = false }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isCameraOff = participant.cam_off || !stream?.getVideoTracks().some((t) => t.enabled);

  return (
    <div className="relative bg-card rounded-xl overflow-hidden shadow-lg aspect-video">
      {isCameraOff ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
          <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-4">
            {participant.display_name.charAt(0).toUpperCase()}
          </div>
          <VideoOff className="h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{participant.display_name}</span>
            {participant.hand_raised && (
              <Hand className="h-4 w-4 text-yellow-400 animate-bounce" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {participant.mic_muted ? (
              <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                <MicOff className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {isLocal && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
          You
        </div>
      )}
    </div>
  );
}
