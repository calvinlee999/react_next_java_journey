import { NextResponse } from 'next/server';

/**
 * WebSocket Connection Handler for Next.js API Routes
 * Note: This is a fallback for environments that don't support WebSockets directly
 * For production, consider using a dedicated WebSocket server or upgrade to Next.js with WebSocket support
 */

// In-memory storage for demo purposes (use Redis or database in production)
const connections: Map<string, { id: string; lastSeen: number; metadata?: Record<string, unknown> }> = new Map();
let messageHistory: Array<{ id: string; timestamp: number; type: string; data: unknown; from?: string }> = [];

export interface WebSocketMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  from?: string;
  to?: string;
}

/**
 * GET - Retrieve connection status and message history (for HTTP fallback)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const connectionId = url.searchParams.get('connectionId');
  const lastMessageId = url.searchParams.get('lastMessageId');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  try {
    // If connection ID provided, get specific connection info
    if (connectionId) {
      const connection = connections.get(connectionId);
      if (!connection) {
        return NextResponse.json({
          error: 'Connection not found'
        }, { status: 404 });
      }

      // Update last seen
      connection.lastSeen = Date.now();

      // Get messages since lastMessageId
      let messages = messageHistory;
      if (lastMessageId) {
        const lastIndex = messageHistory.findIndex(msg => msg.id === lastMessageId);
        if (lastIndex !== -1) {
          messages = messageHistory.slice(lastIndex + 1);
        }
      }

      return NextResponse.json({
        connection,
        messages: messages.slice(-limit),
        totalConnections: connections.size,
        serverTime: Date.now()
      });
    }

    // Return general WebSocket info
    return NextResponse.json({
      totalConnections: connections.size,
      recentMessages: messageHistory.slice(-limit),
      supportedEvents: [
        'chat.message',
        'user.join',
        'user.leave',
        'typing.start',
        'typing.stop',
        'notification.broadcast',
        'game.move',
        'document.edit'
      ],
      serverTime: Date.now()
    });

  } catch (error) {
    console.error('WebSocket API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST - Send message or establish connection (for HTTP fallback)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data, connectionId, to } = body;

    // Create connection if not exists
    if (!connections.has(connectionId)) {
      connections.set(connectionId, {
        id: connectionId,
        lastSeen: Date.now(),
        metadata: { userAgent: request.headers.get('user-agent') }
      });

      // Broadcast user join
      const joinMessage: WebSocketMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user.join',
        data: { connectionId, timestamp: Date.now() },
        timestamp: Date.now(),
        from: 'system'
      };

      messageHistory.push(joinMessage);
      console.log(`💬 WebSocket: User joined - ${connectionId}`);
    }

    // Create message
    const message: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      from: connectionId,
      to
    };

    // Store message
    messageHistory.push(message);

    // Keep only last 1000 messages
    if (messageHistory.length > 1000) {
      messageHistory = messageHistory.slice(-1000);
    }

    // Update connection last seen
    const connection = connections.get(connectionId);
    if (connection) {
      connection.lastSeen = Date.now();
    }

    console.log(`📨 WebSocket message: ${type} from ${connectionId}`);

    // Process specific message types
    const result = await processWebSocketMessage(message);

    return NextResponse.json({
      success: true,
      message: 'Message sent',
      messageId: message.id,
      processed: result,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('WebSocket POST error:', error);
    return NextResponse.json({
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE - Disconnect user
 */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const connectionId = url.searchParams.get('connectionId');

  if (!connectionId) {
    return NextResponse.json({
      error: 'Connection ID required'
    }, { status: 400 });
  }

  try {
    if (connections.has(connectionId)) {
      connections.delete(connectionId);

      // Broadcast user leave
      const leaveMessage: WebSocketMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user.leave',
        data: { connectionId, timestamp: Date.now() },
        timestamp: Date.now(),
        from: 'system'
      };

      messageHistory.push(leaveMessage);
      console.log(`👋 WebSocket: User left - ${connectionId}`);

      return NextResponse.json({
        success: true,
        message: 'Connection disconnected',
        remainingConnections: connections.size
      });
    }

    return NextResponse.json({
      error: 'Connection not found'
    }, { status: 404 });

  } catch (error) {
    console.error('WebSocket DELETE error:', error);
    return NextResponse.json({
      error: 'Failed to disconnect',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Process different types of WebSocket messages
 */
async function processWebSocketMessage(message: WebSocketMessage): Promise<{ action: string; status: string; [key: string]: unknown }> {
  const { type, data, from } = message;

  switch (type) {
    case 'chat.message':
      return {
        action: 'broadcast_chat',
        status: 'sent',
        recipients: connections.size - 1,
        messageLength: typeof data === 'string' ? data.length : JSON.stringify(data).length
      };

    case 'typing.start':
      return {
        action: 'broadcast_typing_indicator',
        status: 'active',
        user: from,
        notified: connections.size - 1
      };

    case 'typing.stop':
      return {
        action: 'clear_typing_indicator',
        status: 'cleared',
        user: from
      };

    case 'notification.broadcast':
      return {
        action: 'send_notification',
        status: 'broadcasted',
        recipients: connections.size,
        notificationType: typeof data === 'object' && data !== null ? 
          (data as Record<string, unknown>).type : 'general'
      };

    case 'game.move':
      return {
        action: 'update_game_state',
        status: 'processed',
        player: from,
        move: data
      };

    case 'document.edit':
      return {
        action: 'sync_document_changes',
        status: 'applied',
        editor: from,
        changeType: typeof data === 'object' && data !== null ? 
          (data as Record<string, unknown>).operation : 'unknown'
      };

    case 'user.join':
    case 'user.leave':
      return {
        action: 'update_user_list',
        status: 'updated',
        totalUsers: connections.size,
        event: type
      };

    default:
      return {
        action: 'log_message',
        status: 'logged',
        messageType: type
      };
  }
}

// Cleanup old connections periodically (in production, use a proper cleanup service)
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [connectionId, connection] of connections.entries()) {
      if (now - connection.lastSeen > timeout) {
        connections.delete(connectionId);
        console.log(`🧹 Cleaned up stale connection: ${connectionId}`);
      }
    }
  }, 60 * 1000); // Check every minute
}