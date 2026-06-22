import { io, Socket } from "socket.io-client";
import { type LiveTracking } from "../domain/tracking";
import { getSocketUrl } from "./reportsSocket.service";

class TrackingSocketService {
  private static instance: TrackingSocketService | null = null;
  private socket: Socket | null = null;
  private isConnected = false;
  private activeTrackings: LiveTracking[] = [];
  private listeners: Set<(trackings: LiveTracking[]) => void> = new Set();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  private constructor() {}

  public static getInstance(): TrackingSocketService {
    if (!this.instance) {
      this.instance = new TrackingSocketService();
    }
    return this.instance;
  }

  public connect() {
    const baseUrl = getSocketUrl();
    if (this.isConnected && this.socket?.connected) {
      console.log("WebSockets de Tracking ya está conectado o conectándose");
      return;
    }
    this.initSocket(baseUrl);
  }

  private initSocket(baseUrl: string) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.close();
    }

    console.log("Conectando a Tracking Socket:", baseUrl);

    this.socket = io(baseUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("Conectado al servidor de WebSockets de Tracking");
      this.notifyConnectionListeners(true);
      this.socket?.emit("getTrackings");
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("Desconectado del servidor de WebSockets de Tracking");
      this.notifyConnectionListeners(false);
    });

    this.socket.on("trackings", (data: any[]) => {
      try {
        if (Array.isArray(data)) {
          this.activeTrackings = data.map((t) => this.parseBackendTracking(t));
          this.notifyListeners();
        }
      } catch (e) {
        console.error("Error procesando lista de trackings:", e);
      }
    });

    this.socket.on("tracking_started", (data: any) => {
      try {
        if (data && (data.id || data.userId)) {
          const parsed = this.parseBackendTracking(data);
          const index = this.activeTrackings.findIndex((t) => t.id === parsed.id);
          if (index !== -1) {
            this.activeTrackings[index] = parsed;
          } else {
            this.activeTrackings.push(parsed);
          }
          this.notifyListeners();
        }
      } catch (e) {
        console.error("Error procesando tracking_started:", e);
      }
    });

    this.socket.on("tracking_stopped", (data: { userId: string }) => {
      try {
        if (data && data.userId) {
          this.activeTrackings = this.activeTrackings.filter((t) => t.id !== data.userId);
          this.notifyListeners();
        }
      } catch (e) {
        console.error("Error procesando tracking_stopped:", e);
      }
    });
  }

  private parseBackendTracking(data: any): LiveTracking {
    return {
      id: data.id || data.userId || "",
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      incidentLatitude: data.incidentLatitude !== undefined ? Number(data.incidentLatitude) : undefined,
      incidentLongitude: data.incidentLongitude !== undefined ? Number(data.incidentLongitude) : undefined,
      reportId: data.reportId !== undefined ? Number(data.reportId) : undefined,
      type: data.type || "",
      description: data.description || "",
      route: Array.isArray(data.route)
        ? data.route.map((p: any) => ({
            lat: Number(p.lat ?? p.latitude ?? 0),
            lng: Number(p.lng ?? p.longitude ?? 0),
          }))
        : [],
      status: data.status || "",
    };
  }

  public subscribe(callback: (trackings: LiveTracking[]) => void) {
    this.listeners.add(callback);
    callback([...this.activeTrackings]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeConnection(callback: (connected: boolean) => void) {
    this.connectionListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.activeTrackings]));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.activeTrackings = [];
    this.listeners.clear();
    this.connectionListeners.clear();
    console.log("Conexión de WebSockets de Tracking cerrada.");
  }
}

export const trackingSocketService = TrackingSocketService.getInstance();
