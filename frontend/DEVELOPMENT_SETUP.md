# Development Setup for Video Conference

## Issue Resolution Summary

### ✅ Fixed Issues:
1. **MiroTalk iframe height** - Now takes full viewport height
2. **Mobile media permissions** - Enhanced with timeout handling and fallbacks

### 🔧 Current Issue: HTTPS Requirement

The video conference requires HTTPS for camera/microphone access. Here are solutions:

## Quick Solutions

### Option 1: Use ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Run your dev server
npm run dev

# In another terminal, expose via HTTPS
ngrok http 5173
```
Then use the HTTPS URL provided by ngrok.

### Option 2: Vite with HTTPS
Update your `vite.config.ts`:
```typescript
export default defineConfig({
  // ... existing config
  server: {
    https: true,  // Enable HTTPS
    host: true,   // Allow external access
  }
})
```

### Option 3: Local SSL Certificates
```bash
# Create local SSL certs (one-time setup)
mkcert -install
mkcert localhost 192.168.43.178

# Update vite.config.ts
server: {
  https: {
    key: './localhost-key.pem',
    cert: './localhost.pem'
  }
}
```

## Browser Settings for Development

If you can't use HTTPS immediately, you can:
1. Go to `chrome://settings/content/camera` and `chrome://settings/content/microphone`
2. Add your local IP (192.168.43.178:8080) to allowed sites
3. Reload the page

## What's Already Fixed

The app now includes:
- **Enhanced permission handling** with mobile optimizations
- **Automatic retry mechanisms** for failed connections  
- **Fallback loading** for development environments
- **Manual permission request button** on loading screen
- **Better error messages** with solutions
- **Timeout handling** to prevent infinite loading

## Testing

1. Try the manual "Request Camera & Mic Access" button
2. Check browser console for permission errors
3. The iframe will load even without permissions (audio/video will be disabled)

## Next Steps

For production, ensure your server has proper SSL certificates. The enhanced error handling will guide users through permission issues.