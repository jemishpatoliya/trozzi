import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, MessageSquare, Clock, CheckCircle, XCircle, Reply, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportAPI } from '@/api/support';

interface SupportTicket {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: string;
  orderId?: string;
  message: string;
  adminReply?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  lastReplyBy?: 'user' | 'admin';
}

const SupportTicketsPage = () => {
  const { toast } = useToast();
  const [tickets, setTicketsState] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await supportAPI.getAllTickets();
      if (response.success) {
        setTicketsState(response.data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load support tickets',
        variant: 'destructive'
      });
    }
  };

  const getFilteredTickets = () => {
    return tickets.filter((ticket) => {
      const matchesSearch = ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesTab = tabFilter === 'all' || ticket.status === tabFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesTab;
    });
  };

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      const response = await supportAPI.updateTicketStatus(ticketId, newStatus);
      if (response.success) {
        const updated = tickets.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t);
        setTicketsState(updated);
        toast({ title: 'Success', description: `Ticket status updated to ${newStatus}` });
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update ticket status',
        variant: 'destructive'
      });
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      const response = await supportAPI.replyToTicket(selectedTicket.id, replyText);
      if (response.success) {
        const updated = tickets.map((t) => 
          t.id === selectedTicket.id 
            ? { ...t, adminReply: replyText, status: 'in_progress' as SupportTicket['status'], lastReplyBy: 'admin' as SupportTicket['lastReplyBy'] }
            : t
        );
        setTicketsState(updated);
        setReplyText('');
        setShowReplyModal(false);
        setSelectedTicket(null);
        toast({ title: 'Success', description: 'Reply sent successfully' });
      } else {
        throw new Error(response.message || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to send reply',
        variant: 'destructive'
      });
    }
  };

  const getStatusCounts = () => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  });

  const getPriorityCounts = () => ({
    all: tickets.length,
    low: tickets.filter((t) => t.priority === 'low').length,
    medium: tickets.filter((t) => t.priority === 'medium').length,
    high: tickets.filter((t) => t.priority === 'high').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
  });

  const statusCounts = getStatusCounts();
  const priorityCounts = getPriorityCounts();

  const columns = [
    { key: 'ticketId', header: 'Ticket ID' },
    { key: 'userName', header: 'Customer' },
    { key: 'userEmail', header: 'Email' },
    { key: 'category', header: 'Category' },
    {
      key: 'priority',
      header: 'Priority',
      render: (ticket: SupportTicket) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {ticket.priority}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Created' },
    {
      key: 'status',
      header: 'Status',
      render: (ticket: SupportTicket) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {ticket.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ticket: SupportTicket) => (
        <Button size="icon" variant="ghost" onClick={() => setSelectedTicket(ticket)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filteredTickets = getFilteredTickets();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support tickets.</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{statusCounts.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{statusCounts.in_progress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{statusCounts.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold">{statusCounts.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{priorityCounts.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={tabFilter} onValueChange={setTabFilter}>
        <TabsList className="glass">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="open">Open ({statusCounts.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({statusCounts.closed})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filteredTickets} columns={columns} emptyMessage="No tickets found" />

      {/* Ticket Details Modal */}
      <Dialog open={!!selectedTicket && !showReplyModal} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details - {selectedTicket?.ticketId}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedTicket.userName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedTicket.userEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedTicket.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTicket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedTicket.priority}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Message</p>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm">{selectedTicket.message}</p>
                </div>
              </div>

              {selectedTicket.adminReply && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Admin Reply</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">{selectedTicket.adminReply}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReplyModal(true);
                    setReplyText(selectedTicket.adminReply || '');
                  }}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                <Select value={selectedTicket.status} onValueChange={(v: SupportTicket['status']) => handleStatusChange(selectedTicket.id, v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Ticket - {selectedTicket?.ticketId}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Reply</p>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowReplyModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleReply}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsPage;
