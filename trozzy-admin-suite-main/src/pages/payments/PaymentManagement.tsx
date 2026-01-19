import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Eye, 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentAPI, PaymentTransaction, PaymentMethod } from '@/api/payment';

const PaymentManagement = () => {
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const [methodFilter, setMethodFilter] = useState('all');
  const [tabFilter, setTabFilter] = useState('completed');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = io('http://localhost:5051', { auth: { token } });
      newSocket.on('connect', () => console.log('Admin Socket.IO connected'));
      newSocket.on('payment:status_changed', (data) => {
        setTransactions(prev => {
          const idx = prev.findIndex(t => t.id === data.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...data };
            return updated;
          }
          return prev;
        });
      });
      newSocket.on('payments:stats', (data) => {
        setStats(data);
      });
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadPaymentMethods();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await paymentAPI.getPaymentStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await paymentAPI.getAllTransactions({ status: 'completed' });
      if (response.success) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load transactions',
        variant: 'destructive'
      });
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      if (response.success) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter((transaction) => {
      const matchesSearch = transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.upiId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || transaction.paymentMethod === methodFilter;
      const matchesTab = tabFilter === 'all' || transaction.status === tabFilter;
      return matchesSearch && matchesStatus && matchesMethod && matchesTab;
    });
  };

  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason.trim()) return;

    try {
      const response = await paymentAPI.refundPayment({
        transactionId: selectedTransaction.transactionId,
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason,
        notifyCustomer: true
      });

      if (response.success) {
        const updated = transactions.map((t) => 
          t.id === selectedTransaction.id 
            ? { ...t, status: 'refunded' as PaymentTransaction['status'], refundedAt: new Date().toISOString() }
            : t
        );
        setTransactions(updated);
        setShowRefundModal(false);
        setRefundReason('');
        setRefundAmount('');
        setSelectedTransaction(null);
        toast({ title: 'Success', description: 'Payment refunded successfully' });
      } else {
        throw new Error(response.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to process refund',
        variant: 'destructive'
      });
    }
  };

  const getStatusCounts = () => ({
    all: transactions.length,
    pending: transactions.filter((t) => t.status === 'pending').length,
    processing: transactions.filter((t) => t.status === 'processing').length,
    completed: transactions.filter((t) => t.status === 'completed').length,
    failed: transactions.filter((t) => t.status === 'failed').length,
    refunded: transactions.filter((t) => t.status === 'refunded').length,
  });

  const getMethodCounts = () => {
    const counts: Record<string, number> = { all: transactions.length };
    paymentMethods.forEach(method => {
      counts[method.type] = transactions.filter(t => t.paymentMethod === method.type).length;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const methodCounts = getMethodCounts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phonepe': return <Smartphone className="h-4 w-4" />;
      case 'paytm': return <DollarSign className="h-4 w-4" />;
      case 'googlepay': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const columns = [
    { key: 'transactionId', header: 'Transaction ID' },
    { key: 'orderId', header: 'Order ID' },
    { key: 'amount', header: 'Amount', render: (t: PaymentTransaction) => `₹${t.amount.toFixed(2)}` },
    { key: 'paymentMethod', header: 'Method', render: (t: PaymentTransaction) => getMethodIcon(t.paymentMethod) },
    { key: 'status', header: 'Status', render: (t: PaymentTransaction) => (
      <Badge className={getStatusColor(t.status)}>
        {t.status}
      </Badge>
    )},
    { key: 'createdAt', header: 'Date', render: (t: PaymentTransaction) => new Date(t.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: 'Actions',
      render: (transaction: PaymentTransaction) => (
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => setSelectedTransaction(transaction)}>
            <Eye className="h-4 w-4" />
          </Button>
          {transaction.status === 'completed' && (
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => {
                setSelectedTransaction(transaction);
                setShowRefundModal(true);
                setRefundAmount(transaction.amount.toString());
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

const getFilteredTransactions = () => {
  return transactions.filter((transaction) => {
    const matchesSearch = transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.upiId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || transaction.paymentMethod === methodFilter;
    const matchesTab = tabFilter === 'all' || transaction.status === tabFilter;
    return matchesSearch && matchesStatus && matchesMethod && matchesTab;
  });
};

const handleRefund = async () => {
  if (!selectedTransaction || !refundReason.trim()) return;

  try {
    const response = await paymentAPI.refundPayment({
      transactionId: selectedTransaction.transactionId,
      amount: refundAmount ? parseFloat(refundAmount) : undefined,
      reason: refundReason,
      notifyCustomer: true
    });

    if (response.success) {
      const updated = transactions.map((t) => 
        t.id === selectedTransaction.id 
          ? { ...t, status: 'refunded' as PaymentTransaction['status'], refundedAt: new Date().toISOString() }
          : t
      );
      setTransactions(updated);
      setShowRefundModal(false);
      setRefundReason('');
      setRefundAmount('');
      setSelectedTransaction(null);
      toast({ title: 'Success', description: 'Payment refunded successfully' });
    } else {
      throw new Error(response.message || 'Failed to process refund');
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    toast({ 
      title: 'Error', 
      description: 'Failed to process refund',
      variant: 'destructive'
    });
  }
};

const getStatusCounts = () => ({
  all: transactions.length,
  pending: transactions.filter((t) => t.status === 'pending').length,
  processing: transactions.filter((t) => t.status === 'processing').length,
  completed: transactions.filter((t) => t.status === 'completed').length,
  failed: transactions.filter((t) => t.status === 'failed').length,
  refunded: transactions.filter((t) => t.status === 'refunded').length,
});

const getMethodCounts = () => {
  const counts: Record<string, number> = { all: transactions.length };
  paymentMethods.forEach(method => {
    counts[method.type] = transactions.filter(t => t.paymentMethod === method.type).length;
  });
  return counts;
};

const statusCounts = getStatusCounts();
const methodCounts = getMethodCounts();

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'refunded': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getMethodIcon = (method: string) => {
  switch (method) {
    case 'phonepe': return <Smartphone className="h-4 w-4" />;
    case 'paytm': return <DollarSign className="h-4 w-4" />;
    case 'googlepay': return <CreditCard className="h-4 w-4" />;
    case 'upi': return <Smartphone className="h-4 w-4" />;
    default: return <CreditCard className="h-4 w-4" />;
  }
};

const columns = [
  { key: 'transactionId', header: 'Transaction ID' },
  { key: 'orderId', header: 'Order ID' },
  { key: 'amount', header: 'Amount', render: (t: PaymentTransaction) => `₹${t.amount.toFixed(2)}` },
  { key: 'paymentMethod', header: 'Method', render: (t: PaymentTransaction) => getMethodIcon(t.paymentMethod) },
  { key: 'status', header: 'Status', render: (t: PaymentTransaction) => (
    <Badge className={getStatusColor(t.status)}>
      {t.status}
    </Badge>
  )},
  { key: 'createdAt', header: 'Date', render: (t: PaymentTransaction) => new Date(t.createdAt).toLocaleDateString() },
  {
    key: 'actions',
    header: 'Actions',
    render: (transaction: PaymentTransaction) => (
      <div className="flex gap-2">
        <Button size="icon" variant="ghost" onClick={() => setSelectedTransaction(transaction)}>
          <Eye className="h-4 w-4" />
        <Button onClick={loadTransactions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{statusCounts.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{statusCounts.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{statusCounts.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-2xl font-bold">{statusCounts.refunded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-medium">{method.name}</p>
                  <Badge variant={method.enabled ? 'default' : 'secondary'}>
                    {method.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.type}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={filteredTransactions} columns={columns} emptyMessage="No transactions found" />
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction && !showRefundModal} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details - {selectedTransaction?.transactionId}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-medium">{selectedTransaction.transactionId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{selectedTransaction.orderId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{selectedTransaction.amount.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(selectedTransaction.paymentMethod)}
                    <span className="font-medium">{selectedTransaction.paymentMethod}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedTransaction.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedTransaction.completedAt && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">{new Date(selectedTransaction.completedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedTransaction.upiId && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">UPI ID</p>
                  <p className="font-medium">{selectedTransaction.upiId}</p>
                </div>
              )}

              {selectedTransaction.gatewayResponse && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gateway Response</p>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedTransaction.gatewayResponse, null, 2)}
                  </pre>
                </div>
              )}

              {selectedTransaction.status === 'completed' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRefundModal(true);
                      setRefundAmount(selectedTransaction.amount.toString());
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund - {selectedTransaction?.transactionId}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Original Amount</p>
                <p className="font-medium">₹{selectedTransaction.amount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Refund Amount</p>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Leave empty for full refund"
                  max={selectedTransaction.amount}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Refund Reason</p>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRefund} disabled={!refundReason.trim()}>
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentManagement;
