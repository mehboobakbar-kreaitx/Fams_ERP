import { useState } from 'react'
import { axiosClient } from '../../api/axiosClient'

type Message = { role: 'user' | 'assistant'; content: string }

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help with attendance, fees, results, and more. Ask me anything.' },
  ])
  const [sending, setSending] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const { data } = await axiosClient.post<{ reply: string }>('/chatbot/message', { message: text })
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? 'Sorry, I could not generate a response.' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'I am temporarily unavailable. Please try again later.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 bg-primary-700 text-white rounded-full w-14 h-14 shadow-lg hover:bg-primary-800 flex items-center justify-center"
        aria-label="Open chatbot"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl border border-border shadow-2xl flex flex-col h-96">
          <div className="bg-primary-700 text-white px-4 py-3 rounded-t-xl">
            <p className="font-semibold">FAMS Assistant</p>
            <p className="text-xs text-primary-200">AI-powered helper</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  m.role === 'user'
                    ? 'bg-primary-700 text-white ml-auto'
                    : 'bg-white border border-border text-gray-800'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="text-xs text-muted-foreground">Thinking…</div>}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
              placeholder="Type a message…"
              className="flex-1 px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="bg-primary-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-primary-800"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}
