import { NextResponse } from 'next/server';

// Mock user data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', company: { name: 'Acme Corp' }, bio: 'Software Engineer with 5 years experience' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', company: { name: 'Tech Inc' }, bio: 'Product Manager and UX enthusiast' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', company: { name: 'Dev Co' }, bio: 'Full-stack developer and team lead' },
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));
  
  const user = mockUsers.find(u => u.id === id);
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(user, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'ETag': `W/"user-${id}-${Date.now()}"`,
    },
  });
}
