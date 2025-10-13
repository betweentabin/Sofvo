import React from 'react'
import { useAuth } from '../../contexts/AuthContext'

const ChatMessage = ({ message }) => {
  const { user } = useAuth()
  const isOwn = message.sender_id === user?.id
  const time = new Date(message.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  const senderName = message.sender?.display_name || message.sender?.username || ''

  return (
    <div className={`dm-message${isOwn ? ' own' : ''}`}>
      {!isOwn && (
        <div className="dm-sender">
          <div className="dm-sender-avatar" />
          <span className="dm-sender-name">{senderName}</span>
        </div>
      )}
      <div className={`dm-bubble${isOwn ? ' own' : ''}`}>
        {message.type === 'text' && <p className="dm-text">{message.content}</p>}
        {message.type === 'image' && <img src={message.file_url} alt="image" className="dm-image" />}
        {message.type === 'file' && (
          <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="dm-file">
            {message.content}
          </a>
        )}
      </div>
      <div className={`dm-time${isOwn ? ' own' : ''}`}>{time}{message.edited_at ? ' (編集済み)' : ''}</div>
    </div>
  )
}

export default ChatMessage
