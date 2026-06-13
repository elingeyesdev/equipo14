import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase";
import { parseLiveTracking, type LiveTracking } from "@/domain/tracking";

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

    const db = getFirebaseDatabase();
    const trackingsRef = ref(db, "trackings");

    const unsubscribe = onValue(
      trackingsRef,
      (snapshot) => {
        setConnected(true);
        setError(null);

        if (!snapshot.exists()) {
          setTrackings([]);
          return;
        }

        const data = snapshot.val() as Record<string, Record<string, unknown>>;
        const parsed = Object.entries(data)
          .map(([id, value]) => parseLiveTracking(id, value ?? {}))
          .filter((t): t is LiveTracking => t != null);

        setTrackings(parsed);
      },
      (err) => {
        setConnected(false);
        setError(err.message);
        setTrackings([]);
      },
    );

    return () => unsubscribe();
  }, [enabled]);

  return { trackings, error, connected };
}
