// Read at module-load time — dotenv/config must be imported before this module
export const WS_PORT = parseInt(process.env.WS_PORT ?? '3001', 10);
export const PROXY_WS_TARGET = process.env.PROXY_WS_TARGET ?? 'ws://localhost:8080';
export const PROXY_REST_TARGET = process.env.PROXY_REST_TARGET ?? 'http://localhost:8080';
export const PROXY_REST_PATH = process.env.PROXY_REST_PATH ?? '/audio';
