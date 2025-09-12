import { NextResponse } from 'next/server';

// Mock user data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', company: { name: 'Acme Corp' } },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', company: { name: 'Tech Inc' } },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', company: { name: 'Dev Co' } },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', company: { name: 'Start LLC' } },
  { id: 5, name: 'Charlie Davis', email: 'charlie@example.com', company: { name: 'Build Inc' } },
  { id: 6, name: 'Diana Wilson', email: 'diana@example.com', company: { name: 'Code Corp' } },
  { id: 7, name: 'Eve Martinez', email: 'eve@example.com', company: { name: 'Tech Start' } },
  { id: 8, name: 'Frank Garcia', email: 'frank@example.com', company: { name: 'Web Co' } },
  { id: 9, name: 'Grace Lee', email: 'grace@example.com', company: { name: 'App Inc' } },
  { id: 10, name: 'Henry Taylor', email: 'henry@example.com', company: { name: 'Dev Start' } },
  { id: 11, name: 'Ivy Anderson', email: 'ivy@example.com', company: { name: 'Tech Corp' } },
  { id: 12, name: 'Jack Thomas', email: 'jack@example.com', company: { name: 'Build Co' } },
  { id: 13, name: 'Kelly White', email: 'kelly@example.com', company: { name: 'Code Inc' } },
  { id: 14, name: 'Leo Harris', email: 'leo@example.com', company: { name: 'Web Start' } },
  { id: 15, name: 'Mia Clark', email: 'mia@example.com', company: { name: 'App Corp' } },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  // Filter users by search term
  let filteredUsers = mockUsers;
  if (search) {
    filteredUsers = mockUsers.filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.company.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Calculate pagination
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const data = filteredUsers.slice(offset, offset + limit);
  
  const response = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
  
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'ETag': `W/"${JSON.stringify(response).length}-${Date.now()}"`,
    },
  });
}
