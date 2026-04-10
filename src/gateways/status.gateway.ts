import { Inject, Optional } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { LoggerService } from '@services/logger.service';
import type { WorldStateService } from '@services/worldstate.service';
import { type Server, WebSocket } from 'ws';

interface WSRequest {
  event: string;
  packet?: {
    platform?: string;
    language?: string;
  };
}

/**
 * WebSocket Gateway for real-time updates
 */
@WebSocketGateway({ path: '/socket' })
export class StatusGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    @Inject('LOGGER_SERVICE')
    private readonly logger: LoggerService,
    @Optional()
    @Inject('WORLDSTATE_SERVICE')
    private readonly worldStateService?: WorldStateService,
  ) {
    // Logger scope is already set in LoggerService constructor
  }

  /**
   * Initialize gateway after server is created
   */
  afterInit(server: Server): void {
    this.logger.info('WebSocket gateway initialized');
    this.setupHeartbeat();
    this.setupWorldStateListeners();
  }

  /**
   * Handle client connection
   */
  handleConnection(client: WebSocket, req: any): void {
    const remoteAddress = req.socket?.remoteAddress || 'unknown';
    this.logger.info(`Socket connection established with ${remoteAddress}`);

    // Set up client heartbeat tracking
    (client as any).isAlive = true;
    client.on('pong', function heartbeat() {
      (this as any).isAlive = true;
    });

    // Send connected event
    client.send(JSON.stringify({ event: 'connected', status: 200 }));

    // Handle incoming messages
    client.on('message', (data: any) => {
      try {
        const request = JSON.parse(data.toString());
        this.handleMessage(client, request);
      } catch (error) {
        this.logger.error('Error parsing WebSocket message', error);
        client.send(
          JSON.stringify({ status: 400, error: 'Invalid message format' }),
        );
      }
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: WebSocket): void {
    this.logger.warn('Socket disconnected');
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(client: WebSocket, request: any): void {
    const { event, packet } = request;
    this.logger.info(`Socket received request for ${event}`);

    switch (event) {
      case 'ws:req':
        this.handleWorldStateRequest(packet, client);
        break;
      case 'twitter':
        this.handleTwitterRequest(packet, client);
        break;
      case 'rss':
        this.handleRssRequest(packet, client);
        break;
      default:
        client.send(JSON.stringify({ status: 400 }));
        break;
    }
  }

  /**
   * Handle WebSocket request
   */
  private handleWorldStateRequest(packet: any, client: WebSocket): void {
    if (!this.worldStateService) {
      client.send(
        JSON.stringify({
          event: 'ws:provide',
          packet: {
            code: 500,
            message: 'WorldState service not available',
          },
        }),
      );
      return;
    }

    const { platform, language } = packet || {};

    if (!platform && !language) {
      client.send(
        JSON.stringify({
          event: 'ws:provide',
          packet: {
            code: 500,
            message: `Provided platform (${platform}) or language (${language}) not provided.`,
          },
        }),
      );
      return;
    }

    try {
      const ws = this.worldStateService.getWorldstate(language || 'en');
      client.send(
        JSON.stringify({
          event: 'ws:provide',
          packet: { platform, language, ws },
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message.split('.')[0] : String(error);
      client.send(
        JSON.stringify({
          event: 'ws:provide',
          packet: { platform, language, code: 500, message },
        }),
      );
    }
  }

  /**
   * Handle Twitter request
   */
  private async handleTwitterRequest(
    packet: any,
    client: WebSocket,
  ): Promise<void> {
    if (!this.worldStateService) {
      client.send(JSON.stringify({ status: 400 }));
      return;
    }

    try {
      const twitterData = await this.worldStateService.getTwitter();
      client.send(
        JSON.stringify({
          event: 'twitter:provide',
          packet: twitterData,
        }),
      );
    } catch (error) {
      client.send(JSON.stringify({ status: 400 }));
    }
  }

  /**
   * Handle RSS request
   */
  private async handleRssRequest(
    packet: any,
    client: WebSocket,
  ): Promise<void> {
    if (!this.worldStateService) {
      client.send(JSON.stringify({ status: 400 }));
      return;
    }

    try {
      const rssData = await this.worldStateService.getRss();
      client.send(
        JSON.stringify({
          event: 'rss:provide',
          packet: rssData,
        }),
      );
    } catch (error) {
      client.send(JSON.stringify({ status: 400 }));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(event: string, packet: any): void {
    if (!this.server) return;

    const message = JSON.stringify({ event, packet });
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Setup heartbeat/ping-pong to keep connections alive
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.server) return;

      this.server.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 30000); // 30 seconds

    // Clean up on server close
    this.server.on('close', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });
  }

  /**
   * Setup WorldState event listeners for broadcasting
   */
  private setupWorldStateListeners(): void {
    if (!this.worldStateService) {
      this.logger.warn('WorldState service not available for broadcasting');
      return;
    }

    // Get the underlying emitter from worldstate-emitter
    const emitter = this.worldStateService.getEmitter();
    if (!emitter) {
      this.logger.warn('WorldState emitter not available');
      return;
    }

    // Subscribe to WorldState events
    emitter.on('tweet', (packet: any) => {
      this.broadcast('tweet', packet);
    });

    emitter.on('rss', (packet: any) => {
      this.broadcast('rss', packet);
    });

    emitter.on('ws:update:event', (packet: any) => {
      this.broadcast('ws:event', packet);
      this.broadcast(packet.key, packet);
    });

    emitter.on('ws:update:parsed', (packet: any) => {
      this.broadcast('ws:update', packet);
    });

    this.logger.info('WorldState event listeners setup for broadcasting');
  }
}
