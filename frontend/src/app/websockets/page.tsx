'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket, useChat } from '@/hooks/useWebSocket';

/**
 * WebSocket Demo Page
 * Demonstrates real-time communication capabilities including chat, notifications, and collaborative features
 */

interface GameState {
  board: string[][];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  gameId: string;
}

const WebSocketDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'notifications' | 'game' | 'collaboration'>('chat');
  const [isMounted, setIsMounted] = useState(false);

  // WebSocket connection for general features
  const ws = useWebSocket({
    autoConnect: true,
    debug: true,
    fallbackToHttp: true,
    onConnect: () => console.log('🔗 WebSocket connected'),
    onDisconnect: () => console.log('🔌 WebSocket disconnected'),
    onError: (error) => console.error('❌ WebSocket error:', error)
  });

  // Chat functionality
  const chat = useChat({
    autoConnect: true,
    maxMessages: 50
  });

  // Track client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Component state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; timestamp: number; type: string }>>([]);

  // Game state (Tic-tac-toe)
  const [gameState, setGameState] = useState<GameState>({
    board: [['', '', ''], ['', '', ''], ['', '', '']],
    currentPlayer: 'X',
    winner: null,
    gameId: `game-${Date.now()}`
  });

  // Collaborative document state
  const [documentContent, setDocumentContent] = useState('# Collaborative Document\n\nStart typing to see real-time collaboration...');
  const [collaborators] = useState<string[]>([]);
  const documentRef = useRef<HTMLTextAreaElement>(null);

  // Chat message input
  const [chatMessage, setChatMessage] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Listen for notifications
  useEffect(() => {
    const unsubscribe = ws.subscribe('notification.broadcast', (data) => {
      const notification = data as { id: string; title: string; message: string; timestamp: number; type: string };
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    });

    return unsubscribe;
  }, [ws]);

  // Listen for game moves
  useEffect(() => {
    const handleGameMove = (data: unknown) => {
      const moveData = data as { move: { row: number; col: number; player: 'X' | 'O' }; gameId: string };
      
      if (moveData.gameId === gameState.gameId) {
        setGameState(prev => {
          const newBoard = prev.board.map(row => [...row]);
          newBoard[moveData.move.row][moveData.move.col] = moveData.move.player;
          
          // Check for winner
          const winner = checkWinner(newBoard);
          
          return {
            ...prev,
            board: newBoard,
            currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
            winner
          };
        });
      }
    };

    const unsubscribe = ws.subscribe('game.move', handleGameMove);
    return unsubscribe;
  }, [ws, gameState.gameId]);

  // Listen for document edits
  useEffect(() => {
    const handleDocumentEdit = (data: unknown) => {
      const editData = data as { operation: { type: 'insert' | 'delete' | 'replace'; position: number; content: string }; documentId: string };
      
      // Apply document operation
      if (editData.operation.type === 'replace') {
        setDocumentContent(editData.operation.content);
      }
    };

    const unsubscribe = ws.subscribe('document.edit', handleDocumentEdit);
    return unsubscribe;
  }, [ws]);

  // Handle chat message submission
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      chat.sendMessage(chatMessage);
      setChatMessage('');
    }
  };

  // Handle chat typing
  const handleChatTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    if (e.target.value.length > 0) {
      chat.startTyping();
    } else {
      chat.stopTyping();
    }
  };

  // Handle notification sending
  const handleSendNotification = () => {
    if (notificationTitle.trim() && notificationMessage.trim()) {
      ws.sendNotification(notificationTitle, notificationMessage, 'info');
      setNotificationTitle('');
      setNotificationMessage('');
    }
  };

  // Handle game move
  const handleGameMove = (row: number, col: number) => {
    if (gameState.board[row][col] === '' && !gameState.winner) {
      // Send move to other players
      ws.sendGameMove({
        row,
        col,
        player: gameState.currentPlayer,
        gameId: gameState.gameId
      });

      // Update local state
      const updateGameState = (prev: GameState): GameState => {
        const newBoard = prev.board.map(r => [...r]);
        newBoard[row][col] = prev.currentPlayer;
        
        const winner = checkWinner(newBoard);
        
        return {
          ...prev,
          board: newBoard,
          currentPlayer: (prev.currentPlayer === 'X' ? 'O' : 'X') as 'X' | 'O',
          winner
        };
      };

      setGameState(updateGameState);
    }
  };

  // Reset game
  const resetGame = () => {
    const newGameState: GameState = {
      board: [['', '', ''], ['', '', ''], ['', '', '']],
      currentPlayer: 'X',
      winner: null,
      gameId: `game-${Date.now()}`
    };
    setGameState(newGameState);
    
    // Notify other players
    ws.sendGameMove({
      type: 'reset',
      gameId: newGameState.gameId
    });
  };

  // Handle document editing
  const handleDocumentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setDocumentContent(newContent);
    
    // Send document edit to other collaborators
    ws.sendDocumentEdit({
      type: 'replace',
      position: 0,
      content: newContent
    });
  };

  // Check tic-tac-toe winner
  const checkWinner = (board: string[][]): string | null => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
        return board[i][0];
      }
    }
    
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
        return board[0][i];
      }
    }
    
    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }
    
    return null;
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get connection status display
  const getConnectionStatus = () => {
    if (!isMounted) return '⚪ Loading...';
    
    switch (ws.connectionStatus) {
      case 'connected': return '🟢 Connected (WebSocket)';
      case 'fallback': return '🟡 Connected (HTTP Fallback)';
      case 'connecting': return '🔄 Connecting...';
      case 'disconnected': return '🔴 Disconnected';
      case 'error': return '❌ Error';
      default: return '⚪ Unknown';
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-4">Loading WebSocket Demo...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              WebSocket Real-Time Communication Demo
            </h1>

            {/* Connection Status */}
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">Connection Status</h3>
                    <p className="text-sm text-blue-800" suppressHydrationWarning>
                      {getConnectionStatus()}
                    </p>
                    {ws.connectionId && (
                      <p className="text-xs text-blue-600 mt-1">
                        Connection ID: {ws.connectionId.slice(-8)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={ws.connect}
                      disabled={ws.isConnected}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Connect
                    </button>
                    <button
                      onClick={ws.disconnect}
                      disabled={!ws.isConnected}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'chat', label: 'Live Chat', icon: '💬' },
                  { id: 'notifications', label: 'Push Notifications', icon: '🔔' },
                  { id: 'game', label: 'Real-time Game', icon: '🎮' },
                  { id: 'collaboration', label: 'Collaborative Editing', icon: '📝' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Live Chat</h2>
                
                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                  {chat.messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chat.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.from === chat.connectionId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.from === chat.connectionId
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 border'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Typing Indicators */}
                  {chat.typingUsers.length > 0 && (
                    <div className="text-sm text-gray-500 mt-4">
                      {chat.typingUsers.join(', ')} {chat.typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChatMessage} className="flex space-x-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatMessage}
                    onChange={handleChatTyping}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!ws.isConnected}
                  />
                  <button
                    type="submit"
                    disabled={!ws.isConnected || !chatMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Send
                  </button>
                </form>

                <button
                  onClick={chat.clearMessages}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear Messages
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
                
                {/* Send Notification */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Send Notification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="Notification title..."
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Notification message..."
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSendNotification}
                    disabled={!ws.isConnected || !notificationTitle.trim() || !notificationMessage.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Send Notification
                  </button>
                </div>

                {/* Received Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
                  {notifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No notifications received yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Game Tab */}
            {activeTab === 'game' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Real-time Tic-Tac-Toe</h2>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg">
                      Current Player: <span className="font-bold text-blue-600">{gameState.currentPlayer}</span>
                    </p>
                    {gameState.winner && (
                      <p className="text-lg font-bold text-green-600">
                        Winner: {gameState.winner}!
                      </p>
                    )}
                  </div>
                  <button
                    onClick={resetGame}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    New Game
                  </button>
                </div>

                {/* Game Board */}
                <div className="inline-block">
                  <div className="grid grid-cols-3 gap-2 bg-gray-200 p-2 rounded-lg">
                    {gameState.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleGameMove(rowIndex, colIndex)}
                          disabled={!ws.isConnected || cell !== '' || gameState.winner !== null}
                          className="w-20 h-20 bg-white border-2 border-gray-300 rounded-lg text-2xl font-bold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed"
                        >
                          {cell}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Game ID: {gameState.gameId}</p>
                  <p>Play with other connected users in real-time!</p>
                </div>
              </div>
            )}

            {/* Collaboration Tab */}
            {activeTab === 'collaboration' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Collaborative Document Editing</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Real-time Collaboration:</strong> Changes made here are instantly shared with all connected users.
                    Try opening this page in multiple browser tabs to see live collaboration!
                  </p>
                </div>

                <div>
                  <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                    Shared Document
                  </label>
                  <textarea
                    ref={documentRef}
                    id="document"
                    value={documentContent}
                    onChange={handleDocumentChange}
                    disabled={!ws.isConnected}
                    rows={12}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Start typing to collaborate..."
                  />
                </div>

                {collaborators.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Active collaborators: {collaborators.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* WebSocket Information */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">WebSocket Features Demonstrated</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium">Real-time Communication:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Instant bidirectional messaging</li>
                    <li>Live typing indicators</li>
                    <li>Automatic reconnection with fallback</li>
                    <li>Connection status monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Advanced Features:</h4>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>HTTP fallback for unreliable connections</li>
                    <li>Event-based message routing</li>
                    <li>Multi-user game synchronization</li>
                    <li>Collaborative document editing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo;