import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '../../hooks/useChat'
import { useChatRailway } from '../../hooks/useChatRailway'
import ChatMessage from './ChatMessage'

const ChatRoom = ({ conversationId, useRailway = false, asUserId = null }) => {
  const chat = useRailway ? useChatRailway(conversationId, asUserId) : useChat(conversationId)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">エラー: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            メッセージがありません。最初のメッセージを送信してください。
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500 min-h-[40px] max-h-[120px]"
            rows="1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !inputMessage.trim() || sending
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {sending ? '送信中...' : '送信'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatRoom
