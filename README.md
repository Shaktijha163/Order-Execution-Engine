# Order Execution Engine

[Public URL](https://order-execution-engine-production-4c70.up.railway.app) • https://order-execution-engine-production-4c70.up.railway.app

A high-performance order execution engine with DEX routing and real-time WebSocket updates.

## Why Market Orders?

We chose to implement **Market Orders** as they are the most fundamental order type that demonstrates the core functionality of immediate execution at current market prices. This provides a solid foundation for:

- **DEX Routing Logic**: Real-time price comparison between Raydium and Meteora
- **WebSocket Lifecycle**: Complete order status streaming from pending to confirmed/failed
- **Queue Management**: Concurrent order processing with rate limiting

## Extending to Other Order Types

### Limit Orders
Add price monitoring and conditional execution - the engine would periodically check market prices and only execute when the target price is reached, reusing the existing DEX routing and execution infrastructure.

### Sniper Orders
Implement event listeners for new token launches - the core execution engine remains the same, but we add monitoring capabilities for liquidity pool creation and immediate order submission on detection.

## Architecture

- **Fastify**: High-performance web framework with built-in WebSocket support
- **BullMQ**: Redis-based queue for concurrent order processing
- **PostgreSQL**: Persistent order storage
- **Redis**: Queue backend and real-time data

## Setup

1. **Clone and install dependencies**
       npm install