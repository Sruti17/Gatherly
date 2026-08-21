import axios from 'axios';

/*
 * Local:
 *
 * http://localhost:8081/api
 *
 * Production:
 *
 * VITE_API_BASE_URL=https://your-api.onrender.com/api
 */
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8081/api',

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 90000,
});

export default api;