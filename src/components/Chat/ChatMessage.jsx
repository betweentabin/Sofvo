import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const ChatMessage = ({ message }) => {
  const { user } = useAuth()
  const isOwnMessage = message.sender_id === user?.id
  const messageTime = new Date(message.created_at).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center mb-1">
            {message.sender?.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt={message.sender.display_name || message.sender.username}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                <span className="text-xs">
                  {(message.sender?.display_name || message.sender?.username || '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">
              {message.sender?.display_name || message.sender?.username}
            </span>
          </div>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {message.type === 'text' && (
            <p className="break-words">{message.content}</p>
          )}
          {message.type === 'image' && (
            <img
              src={message.file_url}
              alt="Shared image"
              className="max-w-full rounded"
            />
          )}
          {message.type === 'file' && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${
                isOwnMessage ? 'text-white' : 'text-blue-500'
              }`}
            >
              {message.content}
            </a>
          )}
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {messageTime}
          {message.edited_at && ' (編集済み)'}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage