'use client';

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAppStore } from '@/lib/store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPhone } from '@/lib/phone';

/* ---------------- icons (inline, no extra package needed) ---------------- */

type IconProps = { className?: string };
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const IconLink = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconUsers = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconContact = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <circle cx="8" cy="11" r="2" />
    <path d="M5.5 15.5c.6-1.4 4.4-1.4 5 0" />
    <path d="M14 10h5" />
    <path d="M14 14h5" />
  </svg>
);

const IconChat = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconGlobe = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconCheck = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconTrash = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const IconDownload = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconSearch = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconRefresh = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const IconSend = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const IconAlert = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const IconArrowRight = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconBookmark = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const IconSelectAll = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...S} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="m8.5 12 2.5 2.5 5-5" />
  </svg>
);

/* ---------------- demo data ---------------- */

const DEMO_GROUPS = [
  { id: 'demo-1', name: 'Tech Enthusiasts Nairobi', participantCount: 247, participants: [] },
  { id: 'demo-2', name: 'Young Professionals KE', participantCount: 182, participants: [] },
  { id: 'demo-3', name: 'Football Fans East Africa', participantCount: 415, participants: [] },
  { id: 'demo-4', name: 'Startup Founders Africa', participantCount: 89, participants: [] },
  { id: 'demo-5', name: 'Music Lovers Kenya', participantCount: 312, participants: [] },
];

const DEMO_PARTICIPANTS = [
  'Amina Wanjiku', 'Brian Odhiambo', 'Charity Mwangi', 'David Kiprop', 'Esther Achieng',
  'Felix Mutua', 'Grace Wambui', 'Hassan Omar', 'Irene Njeri', 'James Karanja',
  'Khadija Ali', 'Luther Wekesa', 'Mary Chebet', 'Nathan Kibet', 'Olivia Towett',
  'Peter Musyoka', 'Queenter Auma', 'Ronald Ngugi', 'Sarah Jebet', 'Thomas Ruto',
  'Ummer Hassan', 'Vivian Nyaboke', 'William Ochieng', 'Xavier Mwenda', 'Yusuf Noor',
];

function generateDemoContacts(groupId: string, groupName: string) {
  const count = Math.floor(Math.random() * 15) + 10;
  const contacts = [];
  for (let i = 0; i < count; i++) {
    const name = DEMO_PARTICIPANTS[i % DEMO_PARTICIPANTS.length];
    contacts.push({
      id: `contact-${groupId}-${i}`,
      name,
      number: `+2547${Math.floor(10000000 + Math.random() * 90000000)}`,
      groupName,
      status: 'pending' as const,
    });
  }
  return contacts;
}

/* minimum group size enforced everywhere (UI + WhatsApp service) */
const MIN_GROUP_SIZE = 20;

/* status chip colours */
const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  sent: 'bg-sky-100 text-sky-800 border-sky-200',
  replied: 'bg-violet-100 text-violet-800 border-violet-200',
  saved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function Home() {
  const store = useAppStore();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [activeTab, setActiveTab] = useState('connect');
  const [messageDelay, setMessageDelay] = useState(3);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupSearch, setGroupSearch] = useState('');
  const [showSmallGroups, setShowSmallGroups] = useState(false);
  const [skippedGroups, setSkippedGroups] = useState<{ groupName: string; count: number }[]>([]);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  /* Socket connection to WhatsApp service */
  useEffect(() => {
    if (store.useDemoMode) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WHATSAPP_URL || 'http://localhost:3003', {
      transports: ['websocket'],
      autoConnect: false,
    });

    newSocket.on('qr', (qr: string) => {
      const s = useAppStore.getState();
      s.setQrCode(qr);
      s.setConnectionStatus('connecting');
    });

    newSocket.on('connected', () => {
      const s = useAppStore.getState();
      s.setConnectionStatus('connected');
      s.setQrCode(null);
    });

    newSocket.on('disconnected', () => {
      const s = useAppStore.getState();
      s.setConnectionStatus('disconnected');
      s.setQrCode(null);
    });

    newSocket.on('groups', (groups: any[]) => {
      const s = useAppStore.getState();
      s.setGroups(groups);
      s.setIsLoadingGroups(false);
    });

    newSocket.on('contacts-extracted', (data: { groupId: string; contacts: any[] }) => {
      const s = useAppStore.getState();
      const existing = new Set(s.contacts.map((c) => c.number.replace(/\D/g, '')));
      const newContacts = data.contacts
        .map((c) => {
          const phone = formatPhone(c.number || c.id?.split('@')[0] || '');
          return {
            id: c.id || `c-${Date.now()}-${Math.random()}`,
            name: c.name || c.pushName || 'Unknown',
            number: phone.e164,
            groupName: s.groups.find((g) => g.id === data.groupId)?.name,
            status: 'pending' as const,
          };
        })
        .filter((c) => c.number && !existing.has(c.number.replace(/\D/g, '')));
      newContacts.forEach((c) => existing.add(c.number.replace(/\D/g, '')));
      if (newContacts.length) s.addContacts(newContacts);
    });

    newSocket.on('extract-skipped', (data: { groupName: string; count: number }) => {
      setSkippedGroups((prev) =>
        prev.some((g) => g.groupName === data.groupName)
          ? prev
          : [...prev, { groupName: data.groupName, count: data.count }]
      );
    });

    newSocket.on('bulk-progress', (data: any) => {
      useAppStore.getState().setBulkProgress(data);
    });

    newSocket.on('message-sent', (data: { contactId: string }) => {
      useAppStore.getState().updateContactStatus(data.contactId, 'sent');
    });

    newSocket.on('message-failed', (data: { contactId: string }) => {
      useAppStore.getState().updateContactStatus(data.contactId, 'pending');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [store.useDemoMode]);

  /* ---------------- actions ---------------- */

  const handleConnect = useCallback(() => {
    if (store.useDemoMode) {
      store.setConnectionStatus('demo');
      store.setGroups(DEMO_GROUPS);
      return;
    }
    if (socket) {
      store.setConnectionStatus('connecting');
      socket.connect();
    }
  }, [socket, store.useDemoMode]);

  const handleLoadGroups = useCallback(() => {
    setSkippedGroups([]);
    if (store.useDemoMode) {
      store.setIsLoadingGroups(true);
      setTimeout(() => {
        store.setGroups(DEMO_GROUPS);
        store.setIsLoadingGroups(false);
      }, 1500);
      return;
    }
    if (socket) {
      store.setIsLoadingGroups(true);
      socket.emit('get-groups');
    }
  }, [socket, store.useDemoMode]);

  const handleExtractContacts = useCallback(() => {
    if (store.useDemoMode) {
      const selectedGroupObjects = store.groups.filter((g) =>
        store.selectedGroups.includes(g.id)
      );
      let allContacts: any[] = [];
      selectedGroupObjects.forEach((group) => {
        const contacts = generateDemoContacts(group.id, group.name);
        allContacts = [...allContacts, ...contacts];
      });
      store.addContacts(allContacts);
      return;
    }
    if (socket) {
      setSkippedGroups([]);
      socket.emit('extract-contacts', { groupIds: store.selectedGroups });
    }
  }, [socket, store.useDemoMode, store.selectedGroups, store.groups]);

  const handleBulkSend = useCallback(() => {
    const message =
      store.activeTemplate === 'custom'
        ? store.customMessage
        : store.messageTemplates.find((t) => t.id === store.activeTemplate)?.content || '';

    if (!message.trim()) return;

    const targets = store.contacts.filter((c) =>
      store.selectedContacts.includes(c.id)
    );

    if (targets.length === 0) return;

    store.setBulkProgress({
      total: targets.length,
      sent: 0,
      failed: 0,
      current: targets[0]?.name || '',
      isRunning: true,
    });

    if (store.useDemoMode || store.connectionStatus === 'demo') {
      let sent = 0;
      const sendNext = () => {
        if (sent >= targets.length) {
          store.setBulkProgress({ isRunning: false, current: 'Done!' });
          targets.forEach((t) => store.updateContactStatus(t.id, 'sent'));
          return;
        }
        store.setBulkProgress({
          sent: sent + 1,
          current: targets[sent + 1]?.name || 'Done!',
        });
        store.updateContactStatus(targets[sent].id, 'sent');
        sent++;
        setTimeout(sendNext, (messageDelay * 1000) / 3);
      };
      setTimeout(sendNext, 500);
      return;
    }

    if (socket) {
      socket.emit('bulk-send', {
        contacts: targets,
        message,
        delay: messageDelay,
      });
    }
  }, [socket, store.useDemoMode, store.connectionStatus, store.activeTemplate, store.customMessage, store.messageTemplates, store.selectedContacts, store.contacts, messageDelay]);

  const handleSaveContact = useCallback(async (contact: any) => {
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name,
          number: contact.number,
          groupId: contact.groupName,
          status: 'saved',
        }),
      });
      store.updateContactStatus(contact.id, 'saved');
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  }, [store]);

  /* DELETE one contact (also removes the saved DB copy when it was saved) */
  const handleDeleteContact = useCallback((contact: any) => {
    if (contact.status === 'saved') {
      fetch(`/api/contacts?number=${encodeURIComponent(contact.number)}`, { method: 'DELETE' }).catch(
        () => {}
      );
    }
    store.removeContact(contact.id);
  }, [store]);

  const askDeleteSelected = useCallback(() => {
    setConfirmState({
      title: `Delete ${store.selectedContacts.length} contact(s)?`,
      description: 'This removes them from the list. Contacts that were saved are also removed from the database. This cannot be undone.',
      onConfirm: () => store.removeSelectedContacts(),
    });
  }, [store.selectedContacts, store]);

  const askClearAll = useCallback(() => {
    setConfirmState({
      title: 'Delete ALL contacts?',
      description: `This removes all ${store.contacts.length} contacts from the list and any saved copies. This cannot be undone.`,
      onConfirm: () => store.clearContacts(),
    });
  }, [store.contacts.length, store]);

  /* Download the whole list as CSV */
  const handleExportCSV = useCallback(() => {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Name', 'Number', 'International', 'Country', 'Group', 'Status'];
    const rows = store.contacts.map((c) => {
      const p = formatPhone(c.number);
      return [c.name, p.e164, p.international, p.countryName, c.groupName || '', c.status];
    });
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friend-connector-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store.contacts]);

  /* ---------------- computed lists ---------------- */

  const filteredContacts = store.contacts.filter((c) => {
    const q = searchFilter.toLowerCase();
    const phone = formatPhone(c.number);
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.number.includes(searchFilter) ||
      phone.countryName.toLowerCase().includes(q) ||
      (c.groupName || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const bigGroups = store.groups.filter((g) => g.participantCount >= MIN_GROUP_SIZE);
  const smallGroups = store.groups.filter((g) => g.participantCount < MIN_GROUP_SIZE);

  const visibleGroups = groupSearch
    ? store.groups.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
    : showSmallGroups
      ? store.groups
      : bigGroups;

  const selectedBigGroups = store.selectedGroups.filter((id) => {
    const g = store.groups.find((x) => x.id === id);
    return g && g.participantCount >= MIN_GROUP_SIZE;
  });

  const isSmallGroup = (id: string) => {
    const g = store.groups.find((x) => x.id === id);
    return !!g && g.participantCount < MIN_GROUP_SIZE;
  };

  const countriesCount = new Set(
    store.contacts
      .map((c) => formatPhone(c.number).countryName)
      .filter((n) => n !== 'Unknown')
  ).size;

  const sentCount = store.contacts.filter((c) => c.status === 'sent').length;

  const initials = (name: string) =>
    name === 'Unknown'
      ? '?'
      : name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

  const statusDot = {
    disconnected: 'bg-red-500',
    connecting: 'bg-amber-500 animate-pulse',
    connected: 'bg-emerald-500 animate-pulse',
    demo: 'bg-blue-500',
  }[store.connectionStatus];

  const statusLabel = {
    disconnected: 'Offline',
    connecting: 'Connecting...',
    connected: 'WhatsApp Connected',
    demo: 'Demo Mode',
  }[store.connectionStatus];

  return (
    <div className="app-backdrop min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-40 -mx-4 mb-6 border-b bg-background/80 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-800 text-white shadow-lg shadow-emerald-600/25">
                <IconUsers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold leading-tight tracking-tight md:text-2xl">
                  Friend{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Connector
                  </span>
                </h1>
                <p className="text-muted-foreground hidden text-xs sm:block">
                  Group contacts, cleaned and ready — no spreadsheet needed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
                <span className="hidden text-sm font-medium sm:inline">{statusLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="demo-mode" className="text-xs text-muted-foreground">Demo</Label>
                <Switch
                  id="demo-mode"
                  checked={store.useDemoMode}
                  onCheckedChange={store.setUseDemoMode}
                />
              </div>
            </div>
          </div>
        </header>

        {/* ================= STATS ================= */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Groups Found', value: store.groups.length, icon: <IconUsers className="h-4 w-4" />, tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
            { label: 'Contacts', value: store.contacts.length, icon: <IconContact className="h-4 w-4" />, tint: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
            { label: 'Countries', value: countriesCount, icon: <IconGlobe className="h-4 w-4" />, tint: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
            { label: 'Sent', value: sentCount, icon: <IconSend className="h-4 w-4" />, tint: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-bold tracking-tight">{s.value}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>
                  {s.icon}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs font-semibold uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ================= MAIN TABS ================= */}
        <Tabs defaultValue="connect" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid h-14 w-full grid-cols-4 rounded-2xl border bg-card/80 p-1.5 shadow-sm backdrop-blur">
            {[
              { value: 'connect', label: 'Connect', icon: <IconLink className="h-4 w-4" /> },
              { value: 'groups', label: 'Groups', icon: <IconUsers className="h-4 w-4" /> },
              { value: 'message', label: 'Message', icon: <IconChat className="h-4 w-4" /> },
              { value: 'contacts', label: 'Contacts', icon: <IconContact className="h-4 w-4" /> },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="gap-2 rounded-xl font-display text-sm font-semibold text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ================= CONNECT TAB ================= */}
          <TabsContent value="connect">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Steps */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>How to connect</CardTitle>
                  <CardDescription>Three quick steps on your phone</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { n: 1, title: 'Open WhatsApp', desc: 'On the phone you want to use as the sender. Tip: use a spare number, not your main line.' },
                    { n: 2, title: 'Tap Linked Devices', desc: 'Open the ⋮ menu (top right) or Settings, then tap "Linked devices".' },
                    { n: 3, title: 'Scan the QR code', desc: 'Tap "Link a device" and point the camera at the QR code on the right.' },
                  ].map((step) => (
                    <div key={step.n} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-display text-sm font-bold text-white shadow-md shadow-emerald-600/25">
                        {step.n}
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{step.title}</p>
                        <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                    <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                      Bulk messaging can break WhatsApp&apos;s rules. Use a spare number, keep the delay high, and message people who know the group you come from.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* QR / status panel */}
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="flex h-full min-h-[380px] flex-col items-center justify-center gap-6 p-6">
                  {store.connectionStatus === 'disconnected' && (
                    <div className="text-center">
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/60 dark:to-teal-900/60">
                        <IconChat className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-display text-lg font-bold">Not connected yet</h3>
                      <p className="text-muted-foreground mx-auto mt-1 mb-5 max-w-xs text-sm">
                        {store.useDemoMode
                          ? 'Demo mode fills the app with sample groups and contacts so you can look around safely.'
                          : 'Connect your WhatsApp to see your groups and pull contacts.'}
                      </p>
                      <Button onClick={handleConnect} size="lg" className="h-11 rounded-xl px-6 font-display font-semibold shadow-lg shadow-emerald-600/25">
                        {store.useDemoMode ? 'Start Demo Mode' : 'Connect WhatsApp'}
                      </Button>
                    </div>
                  )}

                  {store.connectionStatus === 'connecting' && !store.useDemoMode && (
                    <div className="w-full text-center">
                      {store.qrCode ? (
                        <div>
                          <p className="font-display mb-4 font-semibold">Scan this with your phone</p>
                          <div className="relative mx-auto mb-4 w-fit rounded-2xl border bg-white p-4 shadow-lg">
                            {['-top-1.5 -left-1.5 border-t-3 border-l-3 rounded-tl-xl', '-top-1.5 -right-1.5 border-t-3 border-r-3 rounded-tr-xl', '-bottom-1.5 -left-1.5 border-b-3 border-l-3 rounded-bl-xl', '-bottom-1.5 -right-1.5 border-b-3 border-r-3 rounded-br-xl'].map((pos) => (
                              <span key={pos} className={`absolute h-6 w-6 border-emerald-500 ${pos}`} />
                            ))}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={store.qrCode} alt="WhatsApp QR code" className="h-64 w-64" />
                          </div>
                          <p className="text-muted-foreground text-sm">
                            WhatsApp → Linked devices → Link a device → Scan
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          <p className="text-sm">Generating QR code...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(store.connectionStatus === 'connected' || store.connectionStatus === 'demo') && (
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-[0_0_40px_-8px] shadow-emerald-500/50 dark:bg-emerald-900/60">
                        <IconCheck className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-display text-lg font-bold">
                        {store.connectionStatus === 'demo' ? 'Demo Mode Active' : 'WhatsApp Connected'}
                      </h3>
                      <p className="text-muted-foreground mx-auto mt-1 mb-5 max-w-xs text-sm">
                        Your session stays on the server — the phone can even go offline. It expires after 14 days of not using the app.
                      </p>
                      <Button onClick={() => setActiveTab('groups')} className="h-11 rounded-xl px-6 font-display font-semibold">
                        Go to Groups <IconArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ================= GROUPS TAB ================= */}
          <TabsContent value="groups">
            <Card className="mb-4 rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Your WhatsApp Groups</CardTitle>
                    <CardDescription>
                      Only groups with <strong>{MIN_GROUP_SIZE}+ members</strong> can be extracted
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleLoadGroups}
                    disabled={
                      store.connectionStatus === 'disconnected' ||
                      store.isLoadingGroups
                    }
                    className="rounded-xl font-semibold"
                  >
                    <IconRefresh className="h-4 w-4" />
                    {store.isLoadingGroups ? 'Loading...' : store.groups.length ? 'Reload Groups' : 'Load Groups'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {store.groups.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                      <IconSearch className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                      <Input
                        placeholder="Search groups..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        className="h-9 rounded-xl pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => store.setSelectedGroups(visibleGroups.filter((g) => !isSmallGroup(g.id)).map((g) => g.id))}
                    >
                      Select all shown
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => store.setSelectedGroups([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {store.groups.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <IconUsers className="text-muted-foreground h-6 w-6" />
                    </div>
                    <p className="font-medium">
                      {store.connectionStatus === 'disconnected'
                        ? 'Connect WhatsApp first, or flip the Demo switch'
                        : 'Click "Load Groups" to fetch your groups'}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Groups under {MIN_GROUP_SIZE} members will be filtered out automatically
                    </p>
                  </div>
                ) : (
                  <>
                    {!groupSearch && smallGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSmallGroups((v) => !v)}
                        className="mb-3 flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50"
                      >
                        <IconAlert className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>
                          {smallGroups.length} small group{smallGroups.length > 1 ? 's' : ''} hidden (under {MIN_GROUP_SIZE} members)
                          — {showSmallGroups ? 'hide' : 'show'}
                        </span>
                      </button>
                    )}

                    <ScrollArea className="h-[380px] pr-3 scroll-slim">
                      <div className="space-y-2">
                        {visibleGroups.map((group) => {
                          const small = isSmallGroup(group.id);
                          const selected = store.selectedGroups.includes(group.id);
                          return (
                            <div
                              key={group.id}
                              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                                small
                                  ? 'cursor-not-allowed border-dashed opacity-55'
                                  : 'cursor-pointer hover:shadow-md'
                              } ${
                                selected
                                  ? 'border-emerald-500/70 bg-emerald-50/60 ring-1 ring-emerald-500/30 dark:bg-emerald-950/25'
                                  : !small
                                    ? 'bg-card hover:bg-accent/40'
                                    : ''
                              }`}
                              onClick={() => !small && store.toggleGroupSelection(group.id)}
                            >
                              <Checkbox
                                checked={selected}
                                disabled={small}
                                onCheckedChange={() => !small && store.toggleGroupSelection(group.id)}
                              />
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                                small
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {group.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`truncate font-medium ${small ? 'text-muted-foreground line-through' : ''}`}>
                                  {group.name}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {small
                                    ? `${group.participantCount} members — under ${MIN_GROUP_SIZE}, skipped`
                                    : `${group.participantCount} members`}
                                </div>
                              </div>
                              {small ? (
                                <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-600">
                                  &lt; {MIN_GROUP_SIZE}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`shrink-0 ${selected ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}
                                >
                                  {group.participantCount}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                        {visibleGroups.length === 0 && (
                          <p className="py-6 text-center text-sm text-muted-foreground">No groups match your search</p>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </CardContent>
            </Card>

            {skippedGroups.length > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                  Skipped {skippedGroups.length} group{skippedGroups.length > 1 ? 's' : ''} with fewer than {MIN_GROUP_SIZE} members:{' '}
                  {skippedGroups.map((g) => `${g.groupName} (${g.count})`).join(', ')}.
                </p>
              </div>
            )}

            {selectedBigGroups.length > 0 && (
              <div className="sticky bottom-4 z-30">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/95 p-4 shadow-xl shadow-emerald-900/10 backdrop-blur">
                  <div>
                    <span className="font-display font-bold">{selectedBigGroups.length} group(s) selected</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      (~{store.groups
                        .filter((g) => selectedBigGroups.includes(g.id))
                        .reduce((sum, g) => sum + g.participantCount, 0)} contacts inside)
                    </span>
                  </div>
                  <Button onClick={handleExtractContacts} className="rounded-xl font-semibold shadow-lg shadow-emerald-600/25">
                    <IconDownload className="h-4 w-4" /> Extract Contacts
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ================= MESSAGE TAB ================= */}
          <TabsContent value="message">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Template picker */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Your Message</CardTitle>
                  <CardDescription>Pick a template or write your own</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {store.messageTemplates.map((template) => {
                      const active = store.activeTemplate === template.id;
                      return (
                        <div
                          key={template.id}
                          className={`cursor-pointer rounded-xl border p-3 transition-all ${
                            active
                              ? 'border-emerald-500/70 bg-emerald-50/60 ring-1 ring-emerald-500/30 dark:bg-emerald-950/25'
                              : 'bg-card hover:bg-accent/40'
                          }`}
                          onClick={() => store.setActiveTemplate(template.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{template.name}</span>
                            {template.isDefault && <Badge variant="secondary">Default</Badge>}
                          </div>
                          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {template.content}
                          </p>
                        </div>
                      );
                    })}
                    <div
                      className={`cursor-pointer rounded-xl border border-dashed p-3 transition-all ${
                        store.activeTemplate === 'custom'
                          ? 'border-emerald-500/70 bg-emerald-50/60 ring-1 ring-emerald-500/30 dark:bg-emerald-950/25'
                          : 'hover:bg-accent/40'
                      }`}
                      onClick={() => store.setActiveTemplate('custom')}
                    >
                      <span className="font-semibold">Custom Message</span>
                      <p className="text-muted-foreground mt-1 text-sm">Write your own words below</p>
                    </div>
                  </div>

                  {store.activeTemplate === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom Message</Label>
                      <Textarea
                        placeholder="Write your connect message here..."
                        value={store.customMessage}
                        onChange={(e) => store.setCustomMessage(e.target.value)}
                        rows={4}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview + send */}
              <div className="space-y-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Exactly how it lands on their phone</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="chat-bg rounded-2xl border p-4">
                      <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-3 shadow-sm dark:bg-emerald-900/60">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {store.activeTemplate === 'custom'
                            ? store.customMessage || 'Type your custom message above...'
                            : store.messageTemplates.find((t) => t.id === store.activeTemplate)?.content ||
                              'Select a template'}
                        </p>
                        <p className="text-muted-foreground mt-1 text-right text-[10px]">now ✓✓</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between rounded-xl border bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Contacts to message</span>
                      <span className="font-display text-lg font-bold">{store.selectedContacts.length}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Delay between messages</Label>
                        <span className="font-display rounded-lg bg-emerald-100 px-2 py-0.5 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                          {messageDelay}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={10}
                        value={messageDelay}
                        onChange={(e) => setMessageDelay(Number(e.target.value))}
                        className="accent-emerald-600 w-full"
                      />
                      <p className="text-muted-foreground text-xs">
                        Slower is safer — long delays protect your WhatsApp from restrictions
                      </p>
                    </div>

                    {store.bulkProgress.isRunning && (
                      <div className="space-y-2 rounded-xl border bg-muted/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">Sending to {store.bulkProgress.current}...</span>
                          <span className="font-display font-bold">
                            {store.bulkProgress.sent}/{store.bulkProgress.total}
                          </span>
                        </div>
                        <Progress
                          value={(store.bulkProgress.sent / store.bulkProgress.total) * 100}
                          className="h-2"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleBulkSend}
                      disabled={
                        store.selectedContacts.length === 0 ||
                        store.bulkProgress.isRunning
                      }
                      className="h-11 w-full rounded-xl font-display text-base font-semibold shadow-lg shadow-emerald-600/25"
                      size="lg"
                    >
                      <IconSend className="h-4 w-4" />
                      {store.bulkProgress.isRunning
                        ? `Sending ${store.bulkProgress.sent}/${store.bulkProgress.total}...`
                        : `Send to ${store.selectedContacts.length} Contact(s)`}
                    </Button>

                    {store.selectedContacts.length === 0 && store.contacts.length > 0 && (
                      <p className="text-muted-foreground text-center text-sm">
                        Go to the Contacts tab and tick people to message
                      </p>
                    )}
                    {store.contacts.length === 0 && (
                      <p className="text-muted-foreground text-center text-sm">
                        Extract contacts from groups first
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================= CONTACTS TAB ================= */}
          <TabsContent value="contacts">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Extracted Contacts</CardTitle>
                    <CardDescription>
                      {store.contacts.length} contact{store.contacts.length === 1 ? '' : 's'} in your list
                      {store.selectedContacts.length > 0 && ` • ${store.selectedContacts.length} ticked`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExportCSV} disabled={store.contacts.length === 0}>
                      <IconDownload className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={askClearAll} disabled={store.contacts.length === 0}>
                      <IconTrash className="h-4 w-4" /> Delete All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Toolbar */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <IconSearch className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search by name, number, country or group..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'pending', 'sent', 'replied', 'saved'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStatusFilter(status)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                            statusFilter === status
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                              : 'bg-card text-muted-foreground hover:bg-accent/60'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => store.setSelectedContacts(filteredContacts.map((c) => c.id))}
                      >
                        <IconSelectAll className="h-4 w-4" /> Tick shown
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => store.setSelectedContacts([])}>
                        Untick all
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <IconContact className="text-muted-foreground h-6 w-6" />
                    </div>
                    <p className="font-medium">
                      {store.contacts.length === 0
                        ? 'No contacts yet — extract them from a group first'
                        : 'No contacts match your search or filter'}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[440px] pr-3 scroll-slim">
                    <div className="space-y-1.5">
                      {filteredContacts.map((contact) => {
                        const phone = formatPhone(contact.number);
                        const selected = store.selectedContacts.includes(contact.id);
                        return (
                          <div
                            key={contact.id}
                            className={`group flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm ${
                              selected
                                ? 'border-emerald-500/70 bg-emerald-50/60 ring-1 ring-emerald-500/30 dark:bg-emerald-950/25'
                                : 'bg-card hover:bg-accent/40'
                            }`}
                          >
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => store.toggleContactSelection(contact.id)}
                            />
                            <div
                              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 font-display text-sm font-bold text-slate-600 transition-colors hover:from-emerald-100 hover:to-teal-100 hover:text-emerald-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300"
                              onClick={() => store.toggleContactSelection(contact.id)}
                            >
                              {initials(contact.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold">{contact.name}</span>
                                <span className="shrink-0 text-sm">{phone.flag}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                                <span className="text-muted-foreground font-mono text-[13px]">
                                  {phone.international || contact.number}
                                </span>
                                {phone.known && (
                                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                    {phone.countryName}
                                  </span>
                                )}
                              </div>
                              {contact.groupName && (
                                <div className="text-muted-foreground truncate text-xs">via {contact.groupName}</div>
                              )}
                            </div>
                            <span
                              className={`hidden shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize sm:inline ${statusStyles[contact.status] || ''}`}
                            >
                              {contact.status}
                            </span>
                            {contact.status !== 'saved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Save to database"
                                className="h-8 w-8 shrink-0 rounded-lg text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50"
                                onClick={() => handleSaveContact(contact)}
                              >
                                <IconBookmark className="h-4 w-4" />
                              </Button>
                            )}
                            {/* DELETE */}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete contact"
                              className="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                              onClick={() => handleDeleteContact(contact)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Bulk bar */}
                {store.selectedContacts.length > 0 && (
                  <div className="sticky bottom-4 z-30 mt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/95 p-3 shadow-xl shadow-emerald-900/10 backdrop-blur">
                      <span className="text-sm">
                        <strong className="font-display">{store.selectedContacts.length}</strong> ticked
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={askDeleteSelected}>
                          <IconTrash className="h-4 w-4" /> Delete Ticked
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setActiveTab('message')}>
                          Go to Message <IconArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl font-semibold"
                          onClick={() => {
                            store.selectedContacts.forEach((id) => {
                              const contact = store.contacts.find((c) => c.id === id);
                              if (contact) handleSaveContact(contact);
                            });
                          }}
                        >
                          <IconBookmark className="h-4 w-4" /> Save All Ticked
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Footer */}
        <div className="text-muted-foreground mt-10 text-center text-xs leading-relaxed">
          <p>Friend Connector — for making new friends, not marketing.</p>
          <p className="mt-1">Use responsibly. Respect people&apos;s privacy and WhatsApp&apos;s terms of service.</p>
        </div>
      </div>

      {/* ================= CONFIRM DIALOG ================= */}
      <Dialog open={!!confirmState} onOpenChange={(open) => !open && setConfirmState(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{confirmState?.title}</DialogTitle>
            <DialogDescription>{confirmState?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                confirmState?.onConfirm();
                setConfirmState(null);
              }}
            >
              <IconTrash className="h-4 w-4" /> Yes, delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
