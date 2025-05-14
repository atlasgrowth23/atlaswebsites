import { NextRequest } from 'next/server';
import { queryOne } from '../../../lib/db';

const connectedClients = new Map();

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return new Response('Company slug is required', { status: 400 });
  }
  
  // Check if company exists
  return queryOne('SELECT id FROM companies WHERE slug = $1', [slug])
    .then((company) => {
      if (!company) {
        return new Response('Company not found', { status: 404 });
      }
      
      // Set up the WebSocket connection
      const { socket, response } = new WebSocketPair();
      
      // Store the socket in our clients map
      if (!connectedClients.has(company.id)) {
        connectedClients.set(company.id, new Set());
      }
      connectedClients.get(company.id).add(socket);
      
      // Handle WebSocket events
      socket.addEventListener('close', () => {
        // Clean up when the connection is closed
        if (connectedClients.has(company.id)) {
          connectedClients.get(company.id).delete(socket);
          if (connectedClients.get(company.id).size === 0) {
            connectedClients.delete(company.id);
          }
        }
      });
      
      // Accept the connection
      socket.accept();
      
      return response;
    })
    .catch((error) => {
      console.error('WebSocket setup error:', error);
      return new Response('Internal server error', { status: 500 });
    });
}

// Helper function to create a WebSocket pair
function WebSocketPair() {
  const { readable, writable } = new TransformStream();
  const socket = {
    accept: () => {},
    addEventListener: (event: string, callback: () => void) => {},
    send: (data: string) => {},
    close: () => {},
  };
  
  return { socket, response: new Response(readable, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Upgrade': 'websocket',
    },
    status: 101,
  })};
}

// Helper function to broadcast a message to all connected clients for a company
export function broadcastToCompany(companyId: string, data: any) {
  const clients = connectedClients.get(companyId);
  if (clients) {
    const message = JSON.stringify(data);
    clients.forEach((socket) => {
      try {
        socket.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    });
  }
}