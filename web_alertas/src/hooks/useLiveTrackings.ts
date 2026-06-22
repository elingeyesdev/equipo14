import { useEffect, useState } from "react";
import { type LiveTracking } from "@/domain/tracking";
import { trackingSocketService } from "@/services/trackingSocket.service";

export function useLiveTrackings(enabled = true) {
  const [trackings, setTrackings] = useState<LiveTracking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setTrackings([]);
      setConnected(false);
      return;
    }

    // Connect if not already connected
    trackingSocketService.connect();

    const unsubscribeTrackings = trackingSocketService.subscribe((updatedTrackings) => {
      setTrackings(updatedTrackings);
    });

    const unsubscribeConnection = trackingSocketService.subscribeConnection((isConnected) => {
      setConnected(isConnected);
      setError(null);
    });

    return () => {
      unsubscribeTrackings();
      unsubscribeConnection();
    };
  }, [enabled]);

  return { trackings, error, connected };
}
