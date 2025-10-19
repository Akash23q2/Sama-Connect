import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface MiroTalkMeetProps {
  roomId: string;
  userName: string;
  isHost?: boolean;
}

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function MiroTalkMeet({ roomId, userName, isHost = false }: MiroTalkMeetProps) {
  console.log('🎬 MiroTalkMeet initialized for room:', roomId);
  
  const [isLoading, setIsLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeLoadedRef = useRef(false);
  const mobile = isMobileDevice();
  
  console.log('📱 Mobile device:', mobile, '| Secure context:', window.isSecureContext);

  // Step 1: Pre-request permissions, then set up MiroTalk iframe  
  useEffect(() => {
    console.log('🎬 Step 1: Pre-requesting permissions then setting up MiroTalk...');
    
    const setupWithPermissions = async () => {
      try {
        setError(null);
        
        // Check if we're in a secure context or localhost
        const isLocalhost = window.location.hostname.includes('localhost') || 
                           window.location.hostname.includes('127.0.0.1') ||
                           window.location.hostname.includes('192.168.');
        
        console.log('🔒 Security check:', { 
          isSecureContext: window.isSecureContext, 
          isLocalhost,
          hasMediaDevices: !!navigator.mediaDevices 
        });
        
        let permissionGranted = false;
        
        // Try to pre-request permissions (PC approach) but be gentle on mobile
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            if (!mobile) {
              // PC: Pre-request permissions to activate them
              console.log('🖥️ PC: Pre-requesting media permissions...');
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
              });
              console.log('✅ PC: Permissions granted! Stopping stream...');
              stream.getTracks().forEach(track => track.stop());
              permissionGranted = true;
            } else {
              // Mobile: Just check if media devices are available, let iframe handle requests
              console.log('📱 Mobile: Media devices available - letting iframe handle permissions');
              permissionGranted = true; // Let MiroTalk handle mobile permissions
            }
          } catch (permError) {
            console.warn('⚠️ Permission pre-request failed:', permError);
            // Don't set error, let MiroTalk try to handle it
            permissionGranted = false;
          }
        } else {
          console.log('❌ navigator.mediaDevices.getUserMedia not available');
          if (!window.isSecureContext && !isLocalhost) {
            setError('HTTPS required for camera and microphone access');
            return;
          }
        }
        
        // Set up MiroTalk iframe
        console.log('🔗 Constructing MiroTalk URL...');
        const baseUrl = 'https://sfu.mirotalk.com/join';
        const params = new URLSearchParams({
          room: `SamaConnect_${roomId}`,
          name: userName,
          // Set audio/video based on permission status
          audio: permissionGranted ? '1' : '0',
          video: permissionGranted ? '1' : '0',
          theme: 'dark',
          notify: '1',
          // Mobile optimizations
          ...(mobile && {
            quality: 'medium'
          })
        });
        
        const finalUrl = `${baseUrl}?${params.toString()}`;
        console.log('🌐 Final MiroTalk URL:', finalUrl);
        console.log('📎 Permissions pre-granted:', permissionGranted);

        setIframeUrl(finalUrl);
        console.log('✅ Iframe URL set successfully');
        
        // Reset states for new iframe
        iframeLoadedRef.current = false;
        setIframeLoaded(false);
        
        // Set very generous timeout - only as last resort
        const timeoutMs = 60000; // 60 seconds
        console.log('⏰ Setting generous loading timeout:', timeoutMs, 'ms');
        timeoutRef.current = setTimeout(() => {
          console.log('⏰ Loading timeout reached after 60s');
          if (!iframeLoadedRef.current) {
            console.log('⚠️ Still loading after 60s, but iframe might still work');
            // Just hide loading, don't show error - let iframe continue
            setIsLoading(false);
          }
        }, timeoutMs);
        
      } catch (err) {
        console.error('🛑 Failed to setup MiroTalk:', err);
        setError('Failed to initialize video conference');
      }
    };

    console.log('🚀 Starting permission and iframe setup...');
    setupWithPermissions();
  }, [roomId, userName, mobile, toast]);


  // Cleanup timeout on unmount and add iframe ready detection
  useEffect(() => {
    // Listen for messages from iframe that indicate readiness
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://sfu.mirotalk.com') {
        console.log('📬 Received message from MiroTalk:', event.data);
        // If we get any message from MiroTalk, it's likely ready
        if (isLoading) {
          console.log('✅ MiroTalk appears ready, hiding loading');
          setIsLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  const handleRetry = () => {
    console.log('🔄 Retrying connection without reload...');
    setError(null);
    setIsLoading(true);
    setLoadingTimeout(false);
    iframeLoadedRef.current = false;
    setIframeLoaded(false);
    
    // Just reload the iframe URL by changing it slightly
    if (iframeUrl) {
      const url = new URL(iframeUrl);
      url.searchParams.set('retry', Date.now().toString());
      setIframeUrl(url.toString());
    }
  };

  const requestPermissionsManually = async () => {
    try {
      console.log('💆 Manual permission request (mobile fallback)');
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Media devices not available');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Manual permissions granted!');
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: 'Permissions Granted!',
        description: 'Refreshing video conference...',
      });
      
      // Just refresh the iframe instead of full page reload
      if (iframeUrl) {
        const url = new URL(iframeUrl);
        url.searchParams.set('audio', '1');
        url.searchParams.set('video', '1');
        url.searchParams.set('refresh', Date.now().toString());
        setIframeUrl(url.toString());
      }
      
    } catch (err) {
      console.error('❌ Manual permission failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Permission denied';
      toast({
        title: 'Permission Failed',
        description: `${errorMsg}. Try browser settings.`,
        variant: 'destructive'
      });
    }
  };



  const handleIframeLoad = () => {
    console.log('🎬 Iframe onLoad event triggered');
    if (timeoutRef.current) {
      console.log('⏹️ Clearing timeout due to successful load');
      clearTimeout(timeoutRef.current);
    }
    
    // Mark iframe as loaded and hide loading
    console.log('✅ Iframe loaded, hiding loading screen');
    iframeLoadedRef.current = true;
    setIframeLoaded(true);
    setIsLoading(false);
    setLoadingTimeout(false); // Reset any timeout state
  };

  // Show error state with retry option
  console.log('🌨️ Render check - Error state:', { error, iframeUrl, showErrorState: error && !iframeUrl });
  
  if (error && !iframeUrl) {
    console.log('🚨 Rendering error state');
    const isInsecureContext = !window.isSecureContext && !window.location.hostname.includes('localhost');
    console.log('🔒 Insecure context check:', isInsecureContext);
    
    return (
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <div className="text-center text-white p-8 max-w-lg">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isInsecureContext ? 'HTTPS Required' : 'Connection Issue'}
          </h3>
          <p className="text-gray-300 mb-6">{error}</p>
          
          {isInsecureContext ? (
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-2 text-yellow-300">How to fix this:</h4>
              <div className="text-sm text-gray-300 space-y-2">
                <p>1. Use HTTPS instead of HTTP in your URL</p>
                <p>2. Or set up SSL certificates for your local server</p>
                <p>3. For development, you can use tools like ngrok or localtunnel</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
              {mobile && (
                <p className="text-sm text-gray-400">
                  On mobile, please ensure you're using HTTPS and grant camera/microphone permissions when prompted.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  console.log('🎬 Rendering main component with state:', { 
    isLoading, 
    loadingTimeout, 
    error, 
    iframeUrl: !!iframeUrl,
    showLoadingOverlay: (isLoading && !loadingTimeout)
  });
  
  return (
    <div className="relative flex-1 bg-black">
      {/* Loading overlay */}
      {(isLoading && !loadingTimeout) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4 mx-auto"></div>
            <div className="text-white text-lg animate-pulse mb-4">
              Loading video conference...
            </div>
            <p className="text-gray-300 text-sm mb-4">
              {mobile 
                ? 'Please allow camera/microphone access when prompted'
                : 'Setting up video conference with permissions'
              }
            </p>
            
            {/* Manual permission button for mobile fallback */}
            {mobile && navigator.mediaDevices?.getUserMedia && (
              <Button onClick={requestPermissionsManually} variant="outline" size="sm">
                🎥 Request Camera & Mic Access
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Timeout/Error state */}
      {(loadingTimeout || (error && iframeUrl)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center text-white p-6">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">
              {loadingTimeout ? 'Connection Timeout' : 'Connection Issue'}
            </h3>
            <p className="text-gray-300 mb-4">
              {error || 'The video conference is taking longer than expected to load'}
            </p>
            <Button onClick={handleRetry} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* MiroTalk iframe */}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          id="mirotalk-frame"
          src={iframeUrl}
          allow="camera *; microphone *; display-capture *; fullscreen *; autoplay *; encrypted-media *"
          allowFullScreen
          className="w-full h-full border-none block"
          style={{
            height: 'calc(100vh - 73px)',
            minHeight: 'calc(100vh - 73px)',
            backgroundColor: '#000'
          }}
          onLoad={handleIframeLoad}
          onError={() => {
            setError('Failed to load video conference');
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
}