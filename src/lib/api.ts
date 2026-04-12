import axios from 'axios'
import { auth } from './firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15-second timeout prevents silent hangs
})

// Attach Firebase ID token to every request
// Waits for auth to be ready if currentUser isn't available yet
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    try {
      // forceRefresh=false uses the cached token if still valid (< 1hr old)
      const token = await user.getIdToken(false)
      config.headers.Authorization = `Bearer ${token}`
    } catch (tokenErr) {
      console.warn('[api] Could not get ID token:', tokenErr)
    }
  }
  return config
})

// Normalise errors: always reject with a plain Error whose message is readable
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Is the server running?'))
    }
    if (!err.response) {
      return Promise.reject(new Error('Cannot reach the server. Please check your connection.'))
    }
    let msg = err.response?.data?.error || err.response?.data?.message || err.response?.statusText || err.message
    if (typeof msg !== 'string') {
      try {
        msg = JSON.stringify(msg)
      } catch (e) {
        msg = 'Unknown error object'
      }
    }
    const error = new Error(msg)
    ;(error as any).status = err.response?.status
    ;(error as any).response = err.response
    return Promise.reject(error)
  }
)

export default api
