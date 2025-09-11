import { NextResponse } from 'next/server';

const mockPosts = [
  { 
    id: 1, 
    title: 'Introduction to React Caching', 
    content: 'Learn about different caching strategies in React applications...',
    author: 'John Doe',
    publishedAt: '2024-01-15T10:00:00Z'
  },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 600 + 300));
  
  const post = mockPosts.find(p => p.id === id);
  
  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(post, {
    headers: {
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=1200',
      'ETag': `W/"post-${id}-${Date.now()}"`,
    },
  });
}
