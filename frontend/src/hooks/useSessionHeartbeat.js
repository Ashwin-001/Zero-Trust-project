import { useEffect, useRef, useCallback } from 'react';
import { sessionAPI, setAuthToken } from '../services/api';

/**
 * Custom hook for continuous verification via heartbeat.
 *
 * Sends periodic heartbeats to the backend with current device context.
 * If the backend revokes the session, the user is logged out automatically.
 *
 * @param {string|null} sessionId     - Active session ID from access request
 * @param {number}      deviceTrust   - Current device trust score (0-100)
 * @param {string}      location      - Current location (Office|Remote|Mobile)
 * @param {function}    onRevoked     - Callback when session is revoked
 * @param {function}    onWarning     - Callback when session has warnings
 * @param {number}      intervalMs    - Heartbeat interval in ms (default 30s)
 */
export default function useSessionHeartbeat(
  sessionId,
  deviceTrust,
  location,
  onRevoked,
  onWarning,
  intervalMs = 30000
) {
  const intervalRef = useRef(null);
  const sessionIdRef = useRef(sessionId);

  // Keep ref in sync so the interval callback always uses latest value
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const sendHeartbeat = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    try {
      const data = await sessionAPI.sendHeartbeat(sid, deviceTrust, location);
      const result = data.result;

      if (!result) return;

      if (result.session_status === 'REVOKED') {
        // Session was revoked by continuous verification
        if (onRevoked) {
          onRevoked(result.warnings?.[0] || 'Session revoked due to risk change');
        }
        // Clear auth and force logout
        setAuthToken(null);
      } else if (result.action_taken === 'downgraded' && onWarning) {
        onWarning(result.warnings || []);
      }
    } catch (err) {
      // Heartbeat failures are non-fatal; they may indicate token expiry
      console.warn('Heartbeat failed:', err.message);
    }
  }, [deviceTrust, location, onRevoked, onWarning]);

  useEffect(() => {
    if (!sessionId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send an initial heartbeat immediately
    sendHeartbeat();

    // Set up periodic heartbeats
    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, intervalMs, sendHeartbeat]);
}
