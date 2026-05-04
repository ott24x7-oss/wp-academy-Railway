'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  { icon: '✍️', label: 'Generate Post', prompt: 'Generate a social media post about digital marketing for small businesses' },
  { icon: '📚', label: 'Summarize', prompt: 'Summarize the key principles of effective Google Ads campaigns' },
  { icon: '🔍', label: 'Ad Audit', prompt: 'What metrics should I track for my Meta ads campaign?' },
  { icon: '💡', label: 'Strategy', prompt: 'Suggest a content strategy for a new YouTube channel' },
]

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message, timestamp: new Date() },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Error: ${data.error || 'Failed to get response'}`,
            timestamp: new Date(),
          },
        ])
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Connection error. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="text-amber" />
          AI Assistant
        </h1>
        <p className="text-text-dim">Powered by Claude — get instant help with marketing</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-bg-2 border border-line rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-amber mb-4" />
              <h2 className="font-serif text-xl font-bold mb-2">Start a conversation</h2>
              <p className="text-text-dim mb-6 max-w-md">
                Ask anything about marketing, content creation, ads, or use a quick prompt below
              </p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.prompt)}
                    className="p-4 bg-bg border border-line rounded-lg hover:border-amber hover:bg-bg-3 transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-semibold text-sm">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-amber text-bg'
                        : 'bg-bg border border-line text-text'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    <div
                      className={`text-xs mt-2 ${
                        msg.role === 'user' ? 'text-bg/70' : 'text-text-dim'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-bg border border-line rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-amber" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-line p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-3 bg-bg border border-line rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-sky"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-text-dim mt-2">
            💎 850 AI credits remaining this month
          </p>
        </div>
      </div>
    </div>
  )
}
