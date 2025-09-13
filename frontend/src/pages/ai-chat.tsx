// Server-Side Rendering integration for AI features
// File: /frontend/src/pages/ai-chat.tsx

import { GetServerSideProps } from 'next';
import { useState } from 'react';

interface AIPageProps {
  userFeatures: Record<string, unknown>;
  recommendations: Array<{
    id: string;
    content: string;
    score: number;
  }>;
}

export default function AIChatPage({ userFeatures, recommendations }: AIPageProps) {
  const [messages, setMessages] = useState<Array<{role: string, content: string, id: string}>>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setLoading(true);
    const userMessage = { role: 'user', content, id: `user_${Date.now()}` };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: `req_${Date.now()}`,
          inferenceType: 'chat',
          payload: {
            messages: [...messages, { role: 'user', content }]
          },
          context: {
            userId: 'demo_user',
            sessionId: `session_${Date.now()}`,
            deviceType: 'desktop',
            preferences: userFeatures
          }
        })
      });

      const result = await response.json();
      
      if (result.success && result.result?.content) {
        const assistantMessage = { 
          role: 'assistant', 
          content: result.result.content, 
          id: `assistant_${Date.now()}` 
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        console.error('AI inference failed:', result.error);
        const errorMessage = { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.', 
          id: `error_${Date.now()}` 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered a network error. Please try again.', 
        id: `error_${Date.now()}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Chat with GPT-5 Mini</h1>
      
      {/* Personalized Recommendations (SSR) */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Personalized for you:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="p-3 bg-white rounded border">
              <p className="text-sm">{rec.content}</p>
              <span className="text-xs text-gray-500">Score: {rec.score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-3 rounded-lg ${
            msg.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'
          }`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ask AI anything..."
            className="flex-1 p-2 border rounded"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value && !loading) {
                sendMessage(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button 
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Server-Side Rendering with AI SDK integration
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Mock user features and recommendations for demo
    const userFeatures = {
      interests: ['technology', 'ai', 'development'],
      experienceLevel: 'intermediate',
      preferredTopics: ['nextjs', 'azure', 'typescript']
    };
    
    const recommendations = [
      { id: '1', content: 'Learn about GPT-5 Mini capabilities', score: 0.95 },
      { id: '2', content: 'Explore Azure OpenAI integration', score: 0.88 },
      { id: '3', content: 'Try real-time AI personalization', score: 0.82 }
    ];

    return {
      props: {
        userFeatures,
        recommendations
      }
    };
  } catch (error) {
    console.error('SSR AI integration error:', error);
    return {
      props: {
        userFeatures: {},
        recommendations: []
      }
    };
  }
};