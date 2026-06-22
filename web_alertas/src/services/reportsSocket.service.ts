import { io, Socket } from "socket.io-client";
import { type Report } from "../domain/types";

export const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "").replace(/\/api$/, "");
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
    return window.location.origin;
  }
  return "http://localhost:3000";
};

class ReportsSocketService {
  private static instance: ReportsSocketService | null = null;
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Set<(report: Report) => void> = new Set();

  private constructor() {}

  public static getInstance(): ReportsSocketService {
    if (!this.instance) {
      this.instance = new ReportsSocketService();
    }
    return this.instance;
  }

  public connect() {
    const baseUrl = getSocketUrl();
    if (this.isConnected && this.socket?.connected) {
      console.log("WebSockets de Reportes ya está conectado o conectándose");
      return;
    }
    this.initSocket(baseUrl);
  }

  private initSocket(baseUrl: string) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.close();
    }

    const socketUrl = `${baseUrl}/reports`;
    console.log("Conectando a Reports Socket:", socketUrl);

    this.socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("Conectado al servidor de WebSockets de Reportes");
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("Desconectado del servidor de WebSockets de Reportes");
    });

    this.socket.on("newReport", (data: any) => {
      try {
        if (data) {
          console.log("Nuevo reporte recibido por socket:", data);
          this.listeners.forEach((listener) => listener(data));
        }
      } catch (e) {
        console.error("Error procesando nuevo reporte desde socket:", e);
      }
    });
  }

  public subscribe(callback: (report: Report) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
    console.log("Conexión de WebSockets de Reportes cerrada.");
  }
}

export const reportsSocketService = ReportsSocketService.getInstance();
