import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  lastRead: Record<string, number>
  setLastRead: (contactId: string, timestamp: number) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      lastRead: {},
      setLastRead: (contactId, timestamp) =>
        set((state) => ({
          lastRead: { ...state.lastRead, [contactId]: timestamp }
        })),
    }),
    { name: 'edusync-chat-store' }
  )
)
