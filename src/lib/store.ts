import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WhatsAppGroup {
  id: string;
  name: string;
  participantCount: number;
  participants: GroupParticipant[];
}

export interface GroupParticipant {
  id: string;
  name: string;
  number: string;
  isAdmin?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  groupName?: string;
  connectedAt?: string;
  status: 'pending' | 'sent' | 'replied' | 'saved';
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

export interface BulkProgress {
  total: number;
  sent: number;
  failed: number;
  current: string;
  isRunning: boolean;
}

interface AppState {
  // Connection
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  qrCode: string | null;
  useDemoMode: boolean;

  // Groups
  groups: WhatsAppGroup[];
  selectedGroups: string[];
  isLoadingGroups: boolean;

  // Contacts
  contacts: Contact[];
  selectedContacts: string[];

  // Messages
  messageTemplates: MessageTemplate[];
  activeTemplate: string;
  customMessage: string;

  // Bulk
  bulkProgress: BulkProgress;

  // Actions
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  setQrCode: (qr: string | null) => void;
  setUseDemoMode: (use: boolean) => void;
  setGroups: (groups: WhatsAppGroup[]) => void;
  setSelectedGroups: (ids: string[]) => void;
  toggleGroupSelection: (id: string) => void;
  setIsLoadingGroups: (loading: boolean) => void;
  setContacts: (contacts: Contact[]) => void;
  addContacts: (contacts: Contact[]) => void;
  setSelectedContacts: (ids: string[]) => void;
  toggleContactSelection: (id: string) => void;
  setMessageTemplates: (templates: MessageTemplate[]) => void;
  setActiveTemplate: (id: string) => void;
  setCustomMessage: (msg: string) => void;
  setBulkProgress: (progress: Partial<BulkProgress>) => void;
  resetBulkProgress: () => void;
  updateContactStatus: (id: string, status: Contact['status']) => void;
  removeContact: (id: string) => void;
  removeSelectedContacts: () => void;
  clearContacts: () => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  connectionStatus: 'disconnected',
  qrCode: null,
  useDemoMode: false,
  groups: [],
  selectedGroups: [],
  isLoadingGroups: false,
  contacts: [],
  selectedContacts: [],
  messageTemplates: [
    {
      id: 'default-1',
      name: 'Friendly Connect',
      content: "Hey! 👋 I found you through our WhatsApp group. I'm looking to make new friends and connect with interesting people. Would you be open to chatting sometime?",
      isDefault: true,
    },
    {
      id: 'default-2',
      name: 'Casual Intro',
      content: "Hi there! We're in the same WhatsApp group and I thought it'd be cool to connect. Always great to meet new people! 😊",
    },
  ],
  activeTemplate: 'default-1',
  customMessage: '',
  bulkProgress: {
    total: 0,
    sent: 0,
    failed: 0,
    current: '',
    isRunning: false,
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setQrCode: (qr) => set({ qrCode: qr }),
  setUseDemoMode: (use) => set({ useDemoMode: use }),
  setGroups: (groups) => set({ groups }),
  setSelectedGroups: (ids) => set({ selectedGroups: ids }),
  toggleGroupSelection: (id) =>
    set((state) => ({
      selectedGroups: state.selectedGroups.includes(id)
        ? state.selectedGroups.filter((g) => g !== id)
        : [...state.selectedGroups, id],
    })),
  setIsLoadingGroups: (loading) => set({ isLoadingGroups: loading }),
  setContacts: (contacts) => set({ contacts }),
  addContacts: (newContacts) =>
    set((state) => {
      const existingIds = new Set(state.contacts.map((c) => c.number));
      const unique = newContacts.filter((c) => !existingIds.has(c.number));
      return { contacts: [...state.contacts, ...unique] };
    }),
  setSelectedContacts: (ids) => set({ selectedContacts: ids }),
  toggleContactSelection: (id) =>
    set((state) => ({
      selectedContacts: state.selectedContacts.includes(id)
        ? state.selectedContacts.filter((c) => c !== id)
        : [...state.selectedContacts, id],
    })),
  setMessageTemplates: (templates) => set({ messageTemplates: templates }),
  setActiveTemplate: (id) => set({ activeTemplate: id }),
  setCustomMessage: (msg) => set({ customMessage: msg }),
  setBulkProgress: (progress) =>
    set((state) => ({
      bulkProgress: { ...state.bulkProgress, ...progress },
    })),
  resetBulkProgress: () =>
    set({
      bulkProgress: { total: 0, sent: 0, failed: 0, current: '', isRunning: false },
    }),
  updateContactStatus: (id, status) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? { ...c, status } : c)),
    })),
  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      selectedContacts: state.selectedContacts.filter((c) => c !== id),
    })),
  removeSelectedContacts: () =>
    set((state) => ({
      contacts: state.contacts.filter((c) => !state.selectedContacts.includes(c.id)),
      selectedContacts: [],
    })),
  clearContacts: () => set({ contacts: [], selectedContacts: [] }),
}),
{
  name: 'friend-connector-storage',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  // Only keep data that should survive a page refresh.
  // Connection status / QR / groups are session-bound, so they are NOT saved.
  partialize: (state) => ({
    contacts: state.contacts,
    messageTemplates: state.messageTemplates,
    activeTemplate: state.activeTemplate,
    customMessage: state.customMessage,
    useDemoMode: state.useDemoMode,
  }),
}));
