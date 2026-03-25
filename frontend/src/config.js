// API Configuration
// Uses environment variables in production, falls back to localhost in development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export { API_URL, SOCKET_URL };
