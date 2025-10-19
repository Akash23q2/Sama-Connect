const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const checkMediaPermissions = async () => {
  try {
    // First check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('MediaDevices API not supported');
      return false;
    }

    // Check if we're in a secure context
    if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
      console.warn('Not in secure context - media access may be restricted');
      return false;
    }

    // For mobile devices, be more cautious with permission requests
    const mobile = isMobileDevice();
    
    // Get list of devices first (with timeout for mobile)
    const devicesPromise = navigator.mediaDevices.enumerateDevices();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Device enumeration timeout')), mobile ? 3000 : 5000)
    );
    
    const devices = await Promise.race([devicesPromise, timeoutPromise]);
    const hasVideoInput = devices.some(device => device.kind === 'videoinput');
    const hasAudioInput = devices.some(device => device.kind === 'audioinput');

    if (!hasVideoInput && !hasAudioInput) {
      console.warn('No media devices found');
      return false;
    }

    // For mobile, try audio first, then video
    let audioPermission = false;
    let videoPermission = false;

    if (hasAudioInput) {
      try {
        const audioStream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Audio permission timeout')), mobile ? 5000 : 8000)
          )
        ]);
        audioStream.getTracks().forEach(track => track.stop());
        audioPermission = true;
      } catch (err) {
        console.warn('Audio permission denied or failed:', err);
      }
    }

    if (hasVideoInput) {
      try {
        const videoStream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ 
            video: mobile ? { facingMode: 'user', width: 640, height: 480 } : true, 
            audio: false 
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Video permission timeout')), mobile ? 5000 : 8000)
          )
        ]);
        videoStream.getTracks().forEach(track => track.stop());
        videoPermission = true;
      } catch (err) {
        console.warn('Video permission denied or failed:', err);
      }
    }
    
    // Return true if at least one permission was granted
    const hasPermissions = audioPermission || videoPermission;
    
    // Store permission details for debugging
    localStorage.setItem('media_permissions_status', JSON.stringify({
      audio: audioPermission,
      video: videoPermission,
      mobile: mobile,
      timestamp: Date.now()
    }));
    
    return hasPermissions;
  } catch (err) {
    console.warn('Media permission check failed:', err);
    return false;
  }
};

export const initializeMedia = async () => {
  const mobile = isMobileDevice();
  
  // Check if we're in a secure context (https or localhost)
  if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
    console.warn('Not in secure context - media devices may not work properly');
    
    // For mobile on non-secure context, return false to avoid hanging
    if (mobile) {
      localStorage.setItem('mirotalk_media_initialized', 'false');
      localStorage.setItem('media_error', 'insecure_context');
      return false;
    }
  }

  try {
    // Try to initialize media permissions with timeout
    const hasPermissions = await Promise.race([
      checkMediaPermissions(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Media initialization timeout')), mobile ? 10000 : 15000)
      )
    ]);
    
    // Store the result
    localStorage.setItem('mirotalk_media_initialized', hasPermissions ? 'true' : 'false');
    localStorage.removeItem('media_error');
    
    return hasPermissions;
  } catch (error) {
    console.error('Media initialization failed:', error);
    localStorage.setItem('mirotalk_media_initialized', 'false');
    localStorage.setItem('media_error', 'initialization_failed');
    return false;
  }
};

export const ensureMediaPermissions = async () => {
  const mobile = isMobileDevice();
  
  // Check if we've already initialized recently (cache for 5 minutes on mobile, 1 hour on desktop)
  const initialized = localStorage.getItem('mirotalk_media_initialized');
  const lastCheck = localStorage.getItem('media_permissions_status');
  
  if (initialized === 'true' && lastCheck) {
    try {
      const status = JSON.parse(lastCheck);
      const cacheTime = mobile ? 5 * 60 * 1000 : 60 * 60 * 1000; // 5 min for mobile, 1 hour for desktop
      
      if (Date.now() - status.timestamp < cacheTime) {
        return true;
      }
    } catch (e) {
      console.warn('Could not parse media permission cache');
    }
  }
  
  return initializeMedia();
};

// Helper function to get media permission status for debugging
export const getMediaPermissionStatus = () => {
  const status = localStorage.getItem('media_permissions_status');
  const error = localStorage.getItem('media_error');
  const initialized = localStorage.getItem('mirotalk_media_initialized');
  
  return {
    initialized: initialized === 'true',
    error,
    permissions: status ? JSON.parse(status) : null,
    mobile: isMobileDevice()
  };
};
