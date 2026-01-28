"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Minimize2, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [mounted, setMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Inicializar mensajes solo en el cliente para evitar errores de hidratación
  useEffect(() => {
    setMounted(true)
    setMessages([
      {
        id: "1",
        content: "¡Hola! 👋 Bienvenido al chat de soporte de Cofrem. ¿En qué puedo ayudarte hoy?",
        sender: "agent",
        timestamp: new Date(),
      },
    ])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Simular respuesta del agente
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Gracias por tu mensaje. Un agente te responderá pronto. ¿Hay algo más en lo que pueda ayudarte?",
        sender: "agent",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentResponse])
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl bg-card shadow-2xl transition-all duration-300 ease-in-out border border-border",
          isOpen && !isMinimized
            ? "h-[500px] w-[380px] opacity-100 scale-100"
            : "h-0 w-0 opacity-0 scale-95 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary-foreground/20">
                <AvatarImage src="/support-agent-avatar.png" alt="Asistente Cofrem" />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">🤖</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-primary bg-green-400" />
            </div>
            <div>
              <p className="text-primary-foreground/80 font-medium">Asistente Cofrem</p>
              <p className="text-xs text-primary-foreground/80">En línea</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-neutral-200 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-2", message.sender === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {message.sender === "agent" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src="/support-agent.png" alt="Asistente Cofrem" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">🤖</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card text-card-foreground shadow-sm border border-border rounded-bl-sm",
                  )}
                >
                  <p className="leading-relaxed">{message.content}</p>
                  {mounted && (
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        message.sender === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">🤖</AvatarFallback>
                </Avatar>
                <div className="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-sm border border-border">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1 border-0 bg-secondary/20 focus-visible:ring-1 focus-visible:ring-primary rounded-full"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Minimized Bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex w-[280px] items-center gap-3 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg transition-all hover:shadow-xl"
        >
            <div className="relative">
            <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">🤖</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-green-400" />
          </div>
          <span className="flex-1 text-left text-sm text-white">Asistente Cofrem</span>
          <X
            className="h-4 w-4 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
              setIsMinimized(false)
            }}
          />
        </button>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
        >
          <MessageCircle className="h-6 w-6" />
          {/* Notification Badge */}
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            1
          </span>
          {/* Pulse Animation */}
          <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-25" />
        </button>
      )}
    </div>
  )
}
