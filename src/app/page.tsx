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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPhone } from '@/lib/phone';

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

export default function Home() {
  const store = useAppStore();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [activeTab, setActiveTab] = useState('connect');
  const [messageDelay, setMessageDelay] = useState(3);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Socket connection to WhatsApp service
  useEffect(() => {
    if (store.useDemoMode) return;

    const newSocket = io(process.env.NEXT_PUBLIC_WHATSAPP_URL || 'http://localhost:3003', {
      transports: ['websocket'],
      autoConnect: false,
    });

    newSocket.on('qr', (qr: string) => {
      store.setQrCode(qr);
      store.setConnectionStatus('connecting');
    });

    newSocket.on('connected', () => {
      store.setConnectionStatus('connected');
      store.setQrCode(null);
    });

    newSocket.on('disconnected', () => {
      store.setConnectionStatus('disconnected');
      store.setQrCode(null);
    });

    newSocket.on('groups', (groups: any[]) => {
      store.setGroups(groups);
      store.setIsLoadingGroups(false);
    });

    newSocket.on('contacts-extracted', (data: { groupId: string; contacts: any[] }) => {
      const existing = new Set(
        store.contacts.map((c) => c.number.replace(/\D/g, ''))
      );
      const newContacts = data.contacts
        .map((c) => {
          const phone = formatPhone(c.number || c.id?.split('@')[0] || '');
          return {
            id: c.id || `c-${Date.now()}-${Math.random()}`,
            name: c.name || c.pushName || 'Unknown',
            number: phone.e164,
            groupName: store.groups.find((g) => g.id === data.groupId)?.name,
            status: 'pending' as const,
          };
        })
        .filter((c) => c.number && !existing.has(c.number.replace(/\D/g, '')));
      newContacts.forEach((c) => existing.add(c.number.replace(/\D/g, '')));
      if (newContacts.length) store.addContacts(newContacts);
    });

    newSocket.on('bulk-progress', (data: any) => {
      store.setBulkProgress(data);
    });

    newSocket.on('message-sent', (data: { contactId: string }) => {
      store.updateContactStatus(data.contactId, 'sent');
    });

    newSocket.on('message-failed', (data: { contactId: string }) => {
      store.updateContactStatus(data.contactId, 'pending');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [store.useDemoMode]);

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
      // Simulate sending in demo mode
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
  }, []);

  const filteredContacts = store.contacts.filter((c) => {
    const matchesSearch =
      !searchFilter ||
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.number.includes(searchFilter);
    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    sent: 'secondary',
    replied: 'default',
    saved: 'default',
  };

  const countriesCount = new Set(
    store.contacts
      .map((c) => formatPhone(c.number).countryName)
      .filter((n) => n !== 'Unknown')
  ).size;

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-emerald-50/40 dark:to-emerald-950/10">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow-lg shadow-emerald-500/20">
              🤝
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                Friend Connector
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Extract contacts from WhatsApp groups & send connect messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
              <span className="text-sm font-medium">{statusLabel}</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Label htmlFor="demo-mode" className="text-sm">Demo</Label>
              <Switch
                id="demo-mode"
                checked={store.useDemoMode}
                onCheckedChange={store.setUseDemoMode}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Groups', value: store.groups.length, icon: '👥' },
            { label: 'Contacts', value: store.contacts.length, icon: '📇' },
            { label: 'Countries', value: countriesCount, icon: '🌍' },
            { label: 'Selected', value: store.selectedContacts.length, icon: '✅' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs font-medium uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="connect" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-12 w-full grid-cols-4 rounded-2xl border bg-card/80 p-1 shadow-sm backdrop-blur">
            <TabsTrigger className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white" value="connect">Connect</TabsTrigger>
            <TabsTrigger className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white" value="groups">Groups</TabsTrigger>
            <TabsTrigger className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white" value="message">Message</TabsTrigger>
            <TabsTrigger className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white" value="contacts">Contacts</TabsTrigger>
          </TabsList>

          {/* CONNECT TAB */}
          <TabsContent value="connect">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Connection</CardTitle>
                <CardDescription>
                  Scan the QR code with your WhatsApp to connect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6">
                  {store.connectionStatus === 'disconnected' && (
                    <div className="text-center">
                      <div className="mb-4 rounded-lg bg-muted p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                      </div>
                      <Button onClick={handleConnect} size="lg">
                        {store.useDemoMode ? 'Start Demo Mode' : 'Connect WhatsApp'}
                      </Button>
                      {store.useDemoMode && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Demo mode uses simulated data for testing
                        </p>
                      )}
                    </div>
                  )}

                  {store.connectionStatus === 'connecting' && !store.useDemoMode && (
                    <div className="text-center">
                      {store.qrCode ? (
                        <div>
                          <div className="mb-4 rounded-lg border bg-white p-4 flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={store.qrCode} alt="WhatsApp QR code" className="h-64 w-64" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Open WhatsApp → Linked Devices → Link a Device → Scan QR
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          <p>Generating QR code...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(store.connectionStatus === 'connected' || store.connectionStatus === 'demo') && (
                    <div className="text-center">
                      <div className="mb-4 flex items-center justify-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="font-medium">
                          {store.connectionStatus === 'demo' ? 'Demo Mode Active' : 'WhatsApp Connected'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        You can now browse groups and extract contacts
                      </p>
                      <Button onClick={() => setActiveTab('groups')}>
                        Go to Groups
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GROUPS TAB */}
          <TabsContent value="groups">
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>WhatsApp Groups</CardTitle>
                    <CardDescription>
                      Select groups to extract contacts from
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleLoadGroups}
                    disabled={
                      store.connectionStatus === 'disconnected' ||
                      store.isLoadingGroups
                    }
                  >
                    {store.isLoadingGroups ? 'Loading...' : 'Load Groups'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {store.groups.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {store.connectionStatus === 'disconnected'
                      ? 'Connect WhatsApp first or enable Demo Mode'
                      : 'Click "Load Groups" to fetch your groups'}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {store.groups.map((group) => (
                        <div
                          key={group.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer hover:shadow-md ${
                            store.selectedGroups.includes(group.id)
                              ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                              : 'hover:bg-accent/50'
                          }`}
                          onClick={() => store.toggleGroupSelection(group.id)}
                        >
                          <Checkbox
                            checked={store.selectedGroups.includes(group.id)}
                            onCheckedChange={() => store.toggleGroupSelection(group.id)}
                          />
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{group.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.participantCount} participants
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={store.selectedGroups.includes(group.id) ? 'border-emerald-500 text-emerald-600' : ''}
                          >
                            {group.participantCount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {store.selectedGroups.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {store.selectedGroups.length} group(s) selected
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        ({store.groups
                          .filter((g) => store.selectedGroups.includes(g.id))
                          .reduce((sum, g) => sum + g.participantCount, 0)} total participants)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => store.setSelectedGroups([])}
                      >
                        Clear Selection
                      </Button>
                      <Button onClick={handleExtractContacts}>
                        Extract Contacts
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MESSAGE TAB */}
          <TabsContent value="message">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Message Template</CardTitle>
                  <CardDescription>
                    Choose or write your connect message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <div className="space-y-2">
                      {store.messageTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                            store.activeTemplate === template.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-accent/50'
                          }`}
                          onClick={() => store.setActiveTemplate(template.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{template.name}</span>
                            {template.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                      ))}
                      <div
                        className={`cursor-pointer rounded-lg border border-dashed p-3 transition-colors ${
                          store.activeTemplate === 'custom'
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => store.setActiveTemplate('custom')}
                      >
                        <span className="font-medium">Custom Message</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Write your own message below
                        </p>
                      </div>
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
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Message Preview</Label>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {store.activeTemplate === 'custom'
                          ? store.customMessage || 'Type your custom message above...'
                          : store.messageTemplates.find(
                              (t) => t.id === store.activeTemplate
                            )?.content || 'Select a template'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Send Messages</CardTitle>
                  <CardDescription>
                    Send connect messages to selected contacts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selected Contacts</Label>
                    <div className="rounded-lg bg-muted p-3">
                      <span className="font-medium">
                        {store.selectedContacts.length}
                      </span>
                      <span className="text-muted-foreground"> contact(s) selected</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Delay Between Messages (seconds)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="range"
                        min={2}
                        max={10}
                        value={messageDelay}
                        onChange={(e) => setMessageDelay(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-8 text-center font-medium">{messageDelay}s</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Longer delays reduce risk of WhatsApp restrictions
                    </p>
                  </div>

                  {store.bulkProgress.isRunning && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sending to {store.bulkProgress.current}...</span>
                        <span>
                          {store.bulkProgress.sent}/{store.bulkProgress.total}
                        </span>
                      </div>
                      <Progress
                        value={
                          (store.bulkProgress.sent / store.bulkProgress.total) * 100
                        }
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleBulkSend}
                    disabled={
                      store.selectedContacts.length === 0 ||
                      store.bulkProgress.isRunning
                    }
                    className="w-full"
                    size="lg"
                  >
                    {store.bulkProgress.isRunning
                      ? `Sending ${store.bulkProgress.sent}/${store.bulkProgress.total}...`
                      : `Send to ${store.selectedContacts.length} Contact(s)`}
                  </Button>

                  {store.selectedContacts.length === 0 &&
                    store.contacts.length > 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        Go to Contacts tab to select people to message
                      </p>
                    )}

                  {store.contacts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Extract contacts from groups first
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>
                      {store.contacts.length} contacts extracted
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (store.contacts.length > 0) {
                          const allIds = filteredContacts.map((c) => c.id);
                          store.setSelectedContacts(allIds);
                        }
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => store.setSelectedContacts([])}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 flex gap-3">
                  <Input
                    placeholder="Search by name or number..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {['all', 'pending', 'sent', 'replied', 'saved'].map(
                      (status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {filteredContacts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {store.contacts.length === 0
                      ? 'No contacts yet. Extract them from groups first!'
                      : 'No contacts match your filter'}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1">
                      {filteredContacts.map((contact) => {
                        const phone = formatPhone(contact.number);
                        return (
                          <div
                            key={contact.id}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-md hover:bg-accent/50 ${
                              store.selectedContacts.includes(contact.id)
                                ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                                : ''
                            }`}
                          >
                            <Checkbox
                              checked={store.selectedContacts.includes(contact.id)}
                              onCheckedChange={() =>
                                store.toggleContactSelection(contact.id)
                              }
                            />
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                              {initials(contact.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium truncate">{contact.name}</span>
                                <span className="shrink-0">{phone.flag}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-mono text-muted-foreground">
                                  {phone.international || contact.number}
                                </span>
                                {phone.known && (
                                  <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 sm:inline">
                                    {phone.countryName}
                                  </span>
                                )}
                              </div>
                              {contact.groupName && (
                                <div className="text-xs text-muted-foreground truncate">via {contact.groupName}</div>
                              )}
                            </div>
                            <Badge variant={statusColors[contact.status] || 'outline'}>
                              {contact.status}
                            </Badge>
                            {contact.status !== 'saved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveContact(contact)}
                              >
                                Save
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Bulk actions */}
                {store.selectedContacts.length > 0 && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm">
                      <strong>{store.selectedContacts.length}</strong> contact(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('message')}
                      >
                        Go to Message Tab
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          store.selectedContacts.forEach((id) => {
                            const contact = store.contacts.find((c) => c.id === id);
                            if (contact) handleSaveContact(contact);
                          });
                        }}
                      >
                        Save All Selected
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Friend Connector — For making new friends, not marketing.</p>
          <p className="mt-1">
            Use responsibly. Respect people&apos;s privacy and WhatsApp&apos;s terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
