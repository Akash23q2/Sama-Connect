// This script runs before the MiroTalk interface loads
window.addEventListener('DOMContentLoaded', () => {
  // Prevent third-party script blocking warnings
  const originalErr = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.('ERR_BLOCKED_BY_CLIENT') ||
      args[0]?.includes?.('ERR_HTTP2_PROTOCOL_ERROR') ||
      args[0]?.toString?.()?.includes?.('MiroTalkWidget')
    ) {
      return;
    }
    originalErr.apply(console, args);
  };
});