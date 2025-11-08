import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { Duplex } from 'stream';

declare module '@fastify/websocket' {
  export interface SocketStream extends Duplex {
    socket: WebSocket;
  }

  export type WebsocketHandler<RouteGeneric = any> = (
    connection: SocketStream,
    request: FastifyRequest<RouteGeneric>
  ) => void | Promise<void>;

  export interface WebSocketPluginOptions {
    errorHandler?: (error: Error, connection: SocketStream, request: FastifyRequest) => void;
    options?: {
      maxPayload?: number;
      perMessageDeflate?: boolean | object;
      clientTracking?: boolean;
      verifyClient?: (info: { origin: string; secure: boolean; req: any }) => boolean;
    };
  }

  const fastifyWebsocket: FastifyPluginAsync<WebSocketPluginOptions>;
  export default fastifyWebsocket;
}

declare module 'fastify' {
  interface RouteShorthandOptions {
    websocket?: boolean;
  }

  interface FastifyInstance {
    get(
      path: string,
      options: { websocket: true },
      handler: import('@fastify/websocket').WebsocketHandler
    ): FastifyInstance;
  }
}