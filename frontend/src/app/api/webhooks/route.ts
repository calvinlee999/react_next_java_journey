import { NextResponse } from 'next/server';

/**
 * Webhook Receiver API Endpoint
 * Handles incoming webhook requests from external services
 */

// In-memory storage for demo purposes (use database in production)
let webhookEvents: WebhookEvent[] = [];

export interface WebhookEvent {
  id: string;
  timestamp: number;
  source: string;
  event: string;
  data: unknown;
  headers: Record<string, string>;
  verified: boolean;
}

export interface WebhookRegistration {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: number;
}

// In-memory webhook registrations
const webhookRegistrations: WebhookRegistration[] = [
  {
    id: 'default-webhook',
    name: 'Default Demo Webhook',
    url: '/api/webhooks',
    events: ['user.created', 'order.completed', 'payment.processed'],
    active: true,
    createdAt: Date.now()
  }
];

/**
 * POST - Receive webhook events
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get('source') || 'unknown';
    const event = url.searchParams.get('event') || 'generic';
    
    // Get headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Parse request body
    let data: unknown;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    } else {
      data = await request.text();
    }

    // Create webhook event
    const webhookEvent: WebhookEvent = {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      source,
      event,
      data,
      headers,
      verified: verifyWebhookSignature(headers)
    };

    // Store event (limit to last 100 events)
    webhookEvents.unshift(webhookEvent);
    if (webhookEvents.length > 100) {
      webhookEvents = webhookEvents.slice(0, 100);
    }

    console.log(`📨 Webhook received: ${source}/${event}`, {
      id: webhookEvent.id,
      timestamp: new Date(webhookEvent.timestamp).toISOString(),
      dataKeys: typeof data === 'object' && data !== null ? Object.keys(data as Record<string, unknown>) : 'text'
    });

    // Process webhook based on event type
    const result = await processWebhookEvent(webhookEvent);

    return NextResponse.json({
      success: true,
      message: 'Webhook received and processed',
      eventId: webhookEvent.id,
      processed: result
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - Retrieve webhook events and registrations
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const source = url.searchParams.get('source');

  if (type === 'registrations') {
    return NextResponse.json({
      registrations: webhookRegistrations,
      total: webhookRegistrations.length
    });
  }

  // Filter events if source specified
  let filteredEvents = webhookEvents;
  if (source) {
    filteredEvents = webhookEvents.filter(event => event.source === source);
  }

  return NextResponse.json({
    events: filteredEvents.slice(0, limit),
    total: filteredEvents.length,
    sources: [...new Set(webhookEvents.map(e => e.source))],
    eventTypes: [...new Set(webhookEvents.map(e => e.event))]
  });
}

/**
 * Simple webhook signature verification (demo implementation)
 */
function verifyWebhookSignature(headers: Record<string, string>): boolean {
  // In production, implement proper HMAC signature verification
  // Example: GitHub uses X-Hub-Signature-256, Stripe uses Stripe-Signature
  const signature = headers['x-webhook-signature'] || headers['x-hub-signature'];
  
  if (!signature) return false;
  
  // Demo verification - in production use crypto.createHmac
  return signature.includes('sha256=') || signature.includes('webhook-verified');
}

interface WebhookProcessingResult {
  action: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Process webhook events based on type
 */
async function processWebhookEvent(event: WebhookEvent): Promise<WebhookProcessingResult> {
  const { source, event: eventType, data } = event;

  // Type guard helper
  const getDataField = (field: string): unknown => {
    return data && typeof data === 'object' && data !== null ? 
      (data as Record<string, unknown>)[field] : undefined;
  };

  const getNestedField = (path: string[]): unknown => {
    let current = data;
    for (const key of path) {
      if (current && typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return current;
  };

  switch (eventType) {
    case 'user.created':
      return {
        action: 'send_welcome_email',
        userId: getDataField('id'),
        email: getDataField('email'),
        status: 'queued'
      };

    case 'order.completed':
      return {
        action: 'process_order_fulfillment',
        orderId: getDataField('order_id'),
        amount: getDataField('total'),
        status: 'processing'
      };

    case 'payment.processed':
      return {
        action: 'update_payment_status',
        paymentId: getDataField('payment_id'),
        paymentStatus: getDataField('status'),
        amount: getDataField('amount'),
        status: 'processing'
      };

    case 'repository.push':
      return {
        action: 'trigger_deployment',
        repository: getNestedField(['repository', 'name']),
        branch: getDataField('ref'),
        commits: Array.isArray(getDataField('commits')) ? 
          (getDataField('commits') as unknown[]).length : 0,
        status: 'triggered'
      };

    case 'issue.opened':
      return {
        action: 'notify_team',
        issueId: getNestedField(['issue', 'id']),
        title: getNestedField(['issue', 'title']),
        assignee: getNestedField(['issue', 'assignee', 'login']),
        status: 'notified'
      };

    default:
      return {
        action: 'log_event',
        eventType,
        source,
        status: 'logged'
      };
  }
}

/**
 * DELETE - Clear webhook events (for testing)
 */
export async function DELETE() {
  webhookEvents = [];
  return NextResponse.json({
    success: true,
    message: 'All webhook events cleared'
  });
}
