import React, { useState, useRef, useEffect } from 'react'
import { useChatRailway } from '../../hooks/useChatRailway'
import ChatMessage from './ChatMessage'

const ChatRoom = ({ conversationId, asUserId = null }) => {
  const chat = useChatRailway(conversationId, asUserId)
  const { messages, loading, error, sendMessage } = chat
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!inputMessage.trim() || sending) return

    const messageContent = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    try {
      await sendMessage(messageContent)
      inputRef.current?.focus()
    } catch (err) {
      console.error('Failed to send message:', err)

      // Handle specific error cases
      if (err?.response?.status === 403) {
        const errorCode = err?.response?.data?.code;
        const errorMessage = err?.response?.data?.error;

        if (errorCode === 'BLOCKED') {
          alert('メッセージを送信できません。');
        } else {
          alert(errorMessage || 'メッセージの送信に失敗しました。');
        }
      } else {
        alert('メッセージの送信に失敗しました。');
      }

      setInputMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  return (
    <div className="dm-chatroom">
      <div className="dm-messages" ref={messagesEndRef}>
        {loading ? (
          <div className="dm-center dm-muted">読み込み中...</div>
        ) : error ? (
          <div className="dm-center dm-error">エラー: {error}</div>
        ) : messages.length === 0 ? (
          <div className="dm-center dm-muted">メッセージがありません。最初のメッセージを送信してください。</div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="dm-inputbar">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力..."
          className="dm-textarea"
          rows="1"
          disabled={sending}
        />
        <button type="submit" disabled={!inputMessage.trim() || sending} className="dm-send">
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  )
}

export default ChatRoom
