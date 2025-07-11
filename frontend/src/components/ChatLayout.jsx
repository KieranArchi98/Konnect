import React from 'react';

function ChatLayout() {
  return (
    <div className='border rounded p-4 mb-4'>
      <div className='h-64 bg-gray-100 overflow-y-auto mb-2'>Chat messages will appear here...</div>
      <input type='text' className='w-full p-2 border' placeholder='Type your query...' />
    </div>
  );
}

export default ChatLayout;
