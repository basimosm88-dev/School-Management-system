export const getSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Local development support: allows mocking subdomains in localStorage
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('test_subdomain') || null;
  }

  const parts = hostname.split('.');
  
  // E.g. alqasimischool.coresa.app -> ['alqasimischool', 'coresa', 'app']
  // E.g. alqasimischool.vercel.app -> ['alqasimischool', 'vercel', 'app']
  if (parts.length > 2) {
    return parts[0].toLowerCase();
  }
  
  return null;
};
