import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Search, Filter, CreditCard, Calendar, User, DollarSign, ExternalLink, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentAPI, type PaymentTransaction } from '@/api/payment';

type Payment = PaymentTransaction;

const PaymentsManagementPage = () => {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const [currentPage, setCurrentPage] = useState(1);

  const [payments, setPayments] = useState<Payment[]>([]); 

  const loadPayments = async (status?: string) => {
    const response = await paymentAPI.getAllTransactions({ status: status || undefined });
    if (response?.success) {
      setPayments(Array.isArray(response.data) ? response.data : []);
      return;
    }
    setPayments([]);
  };

  useEffect(() => {
    void loadPayments(statusFilter === 'all' ? undefined : statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (payment.merchantTransactionId || '').toLowerCase().includes(term) ||
        (payment.transactionId || '').toLowerCase().includes(term) ||
        (payment.userId || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / 20);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * 20, currentPage * 20);

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const isCod = (p: Payment) => String(p.paymentMethod || '').toLowerCase() === 'cod';
  const isPhonePe = (p: Payment) => String(p.paymentMethod || '').toLowerCase() === 'phonepe';

  const handleRefresh = async () => {
    try {
      await loadPayments(statusFilter === 'all' ? undefined : statusFilter);
      toast({
        title: 'Payments refreshed',
        description: 'Payment data has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh payments.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      const response = await paymentAPI.downloadReceipt(payment.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      let message = 'Failed to download receipt.';
      try {
        const blob: Blob | undefined = e?.response?.data;
        if (blob && typeof blob.text === 'function') {
          const txt = await blob.text();
          try {
            const parsed = JSON.parse(txt);
            message = String(parsed?.message || parsed?.error || message);
          } catch (_jsonErr) {
            message = txt || message;
          }
        } else {
          message = String(e?.response?.data?.message || e?.message || message);
        }
      } catch (_parseErr) {
        message = String(e?.message || message);
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'pending';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments Management</h1>
          <p className="text-muted-foreground">View and manage payment transactions</p>
        </div>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
                    'INR'
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.status === 'failed').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="grid gap-4">
        {paginatedPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No payments match your search criteria.'
                  : 'No payment transactions available.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedPayments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {formatCurrency(payment.amount, payment.currency)}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={getStatusColor(payment.status)} />
                      <span className="text-sm text-muted-foreground capitalize">
                        {payment.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(payment)}
                      disabled={payment.status !== 'completed'}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(payment)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Order ID</div>
                    <div className="font-mono text-sm">{payment.merchantTransactionId || '-'}</div>
                  </div>
                  {payment.transactionId && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Payment ID</div>
                      <div className="font-mono text-sm">{payment.transactionId}</div>
                    </div>
                  )}
                  {isPhonePe(payment) && (payment.paymentMode || payment.payerVpa) && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">PhonePe</div>
                      {payment.paymentMode ? (
                        <div className="text-sm">Mode: {payment.paymentMode}</div>
                      ) : null}
                      {payment.payerVpa ? (
                        <div className="text-sm">UPI ID: {payment.payerVpa}</div>
                      ) : null}
                    </div>
                  )}
                  {isCod(payment) && payment.shipment && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Shiprocket</div>
                      <div className="font-mono text-sm">AWB: {payment.shipment.awbNumber || '-'}</div>
                      <div className="text-sm">{payment.shipment.courierName || ''}</div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Customer</div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{payment.userId || '-'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{payment.paymentMethod || '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Payment Details Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order ID</Label>
                  <div className="font-mono text-sm mt-1">{selectedPayment.merchantTransactionId || '-'}</div>
                </div>
                {selectedPayment.transactionId && (
                  <div>
                    <Label>Payment ID</Label>
                    <div className="font-mono text-sm mt-1">{selectedPayment.transactionId}</div>
                  </div>
                )}
                <div>
                  <Label>Amount</Label>
                  <div className="font-semibold mt-1">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={getStatusColor(selectedPayment.status)} />
                  </div>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <div className="capitalize mt-1">{selectedPayment.paymentMethod || '-'}</div>
                </div>
                {isPhonePe(selectedPayment) && (selectedPayment.paymentMode || selectedPayment.payerVpa) && (
                  <>
                    <div>
                      <Label>Mode</Label>
                      <div className="mt-1">{selectedPayment.paymentMode || '-'}</div>
                    </div>
                    <div>
                      <Label>UPI ID</Label>
                      <div className="mt-1 break-all">{selectedPayment.payerVpa || '-'}</div>
                    </div>
                  </>
                )}
                <div>
                  <Label>Date</Label>
                  <div className="mt-1">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                  disabled={selectedPayment.status !== 'completed'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label>Customer Information</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <div className="text-sm text-muted-foreground">User ID</div>
                    <div>{selectedPayment.userId || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Merchant Transaction</div>
                    <div>{selectedPayment.merchantTransactionId || '-'}</div>
                  </div>
                </div>
              </div>

              {(selectedPayment as any).order && (
                <div className="border-t pt-4">
                  <Label>Order Information</Label>
                  {(() => {
                    const order = (selectedPayment as any).order as any;
                    return (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Order Number</div>
                      <div>{order?.orderNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Order Status</div>
                      <StatusBadge status={order?.status} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Order Total</div>
                      <div className="font-semibold">
                        {formatCurrency(Number(order?.total ?? 0), 'INR')}
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                </div>
              )}

              {isCod(selectedPayment) && (selectedPayment as any).shipment && (
                <div className="border-t pt-4">
                  <Label>Shiprocket Information</Label>
                  {(() => {
                    const sh = (selectedPayment as any).shipment as any;
                    return (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <div className="text-sm text-muted-foreground">AWB</div>
                          <div className="font-mono text-sm mt-1">{sh?.awbNumber || '-'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Courier</div>
                          <div className="mt-1">{sh?.courierName || '-'}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-sm text-muted-foreground">Tracking</div>
                          {sh?.trackingUrl ? (
                            <a className="text-sm text-blue-600 hover:underline break-all" href={sh.trackingUrl} target="_blank" rel="noreferrer">{sh.trackingUrl}</a>
                          ) : (
                            <div className="text-sm">-</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsManagementPage;
