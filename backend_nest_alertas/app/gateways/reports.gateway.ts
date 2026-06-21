import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'reports',
})
export class ReportsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Cliente conectado al canal de reportes: ${client.id}`);
    }
    handleDisconnect(client: Socket) {
        console.log(`Cliente desconectado del canal de reportes: ${client.id}`);
    }

    sendNewReportNotification(report: any) {
        console.log(`Nuevo reporte creado ${report.id}`)
        this.server.emit('newReport', report);
    }
}