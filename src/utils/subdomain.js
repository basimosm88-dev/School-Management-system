export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Local development support: allows mocking subdomains in localStorage
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('test_subdomain') || null;
  }

  const parts = hostname.split('.');
  
  // E.g. alqasimischool.coresa.app -> ['alqasimischool', 'coresa', 'app']
  if (parts.length > 2) {
    // Ignore default vercel domains
    if (parts[1] === 'vercel' && parts[2] === 'app') {
      return null;
    }
    return parts[0].toLowerCase();
  }
  
  return null;
};
