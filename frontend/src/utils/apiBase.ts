export const getBackendHost = () => {
  return window.location.hostname;
};

// Default backend port is 8888. It can be made dynamic via a config file if needed.
const BACKEND_PORT = 8888;
const FRONTEND_PORT = 7070;

export const getApiBase = () => {
  const protocol = window.location.protocol;
  return `${protocol}//${getBackendHost()}:${BACKEND_PORT}`;
};

export const getWsBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${getBackendHost()}:${BACKEND_PORT}`;
};

export const getFrontendBase = () => {
  const protocol = window.location.protocol;
  return `${protocol}//${getBackendHost()}:${FRONTEND_PORT}`;
};
