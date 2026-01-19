import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Plus, Calendar as CalendarIcon, Download, Trash2, Play, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface Report {
  id: string;
  name: string;
  type: string;
  created: string;
  status: string;
  metrics: string[];
  dateFrom: string;
  dateTo: string;
  data?: any[];
}

type ReportTypesPayload = {
  success: boolean;
  data?: {
    reportTypes: { id: string; label: string }[];
    metrics: { id: string; label: string }[];
  };
  message?: string;
  error?: string;
};

type ReportSavedPayload = {
  success: boolean;
  data?: Report[];
  message?: string;
  error?: string;
};

type ReportGeneratePayload = {
  success: boolean;
  data?: {
    reportMeta: {
      name: string;
      type: string;
      dateFrom: string;
      dateTo: string;
      metrics: string[];
    };
    metrics: Record<string, number>;
    rows: any[];
    meta?: {
      notices?: string[];
      supported?: Record<string, boolean>;
    };
  };
  message?: string;
  error?: string;
};

const ReportBuilder = () => {
  const { toast } = useToast();
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getTime() - 29 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'orders']);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [types, setTypes] = useState<{ id: string; label: string }[]>([]);
  const [metricOptions, setMetricOptions] = useState<{ id: string; label: string }[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setNotice(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setNotice('Please sign in to view analytics.');
          return;
        }

        const cacheBust = Date.now();
        const [typesRes, savedRes] = await Promise.all([
          axios.get<ReportTypesPayload>(`/api/admin/analytics/reports/types?_t=${cacheBust}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
          axios.get<ReportSavedPayload>(`/api/admin/analytics/reports/saved?_t=${cacheBust}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
        ]);

        const typesPayload = typesRes.data;
        const savedPayload = savedRes.data;

        if (!typesPayload?.success || !typesPayload?.data) {
          throw new Error(typesPayload?.message || typesPayload?.error || 'Failed to load report types');
        }

        if (!cancelled) {
          setTypes(typesPayload.data.reportTypes ?? []);
          setMetricOptions(typesPayload.data.metrics ?? []);
        }

        if (savedPayload?.success) {
          if (!cancelled) setSavedReports(savedPayload.data ?? []);
          if (!cancelled) setNotice(savedPayload.message ?? null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setTypes([]);
          setMetricOptions([]);
          setSavedReports([]);
          setNotice(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Unable to fetch report data');
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadCsv = (rows: Record<string, string | number>[], filename: string) => {
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const toCell = (value: string | number) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return String(value);
      return escape(String(value));
    };
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => toCell(r[h] as any)).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  async function generateReportData(type: string) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please sign in');

    const response = await axios.post<ReportGeneratePayload>(
      '/api/admin/analytics/reports/generate',
      {
        reportType: type,
        reportName,
        metrics: selectedMetrics,
        dateFrom: dateRange.from ? dateRange.from.toISOString() : null,
        dateTo: dateRange.to ? dateRange.to.toISOString() : null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const payload = response.data;
    if (!payload?.success || !payload?.data) {
      throw new Error(payload?.message || payload?.error || 'Failed to generate report');
    }

    return payload.data;
  }

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId]
    );
  };

  const handleCreateReport = () => {
    if (!reportName.trim()) {
      toast({ title: 'Error', description: 'Please enter a report name', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);

    generateReportData(reportType)
      .then((data) => {
        const newReport: Report = {
          id: 'preview',
          name: data.reportMeta?.name || reportName,
          type: data.reportMeta?.type || reportType,
          created: format(new Date(), 'yyyy-MM-dd'),
          status: 'Ready',
          metrics: data.reportMeta?.metrics ?? selectedMetrics,
          dateFrom: data.reportMeta?.dateFrom ? String(data.reportMeta.dateFrom).slice(0, 10) : (dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''),
          dateTo: data.reportMeta?.dateTo ? String(data.reportMeta.dateTo).slice(0, 10) : (dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''),
          data: Array.isArray(data.rows) ? data.rows : [],
        };

        setViewingReport(newReport);
        toast({ title: 'Report Generated', description: 'Report generated from database data' });
      })
      .catch((error: any) => {
        toast({ title: 'Error', description: error?.message || 'Failed to generate report', variant: 'destructive' });
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  const handleUpdateReport = () => {
    setEditingReport(null);
    toast({ title: 'Not available', description: 'Saved reports are not available', variant: 'destructive' });
  };

  const handleDeleteReport = (id: string) => {
    setDeleteConfirmId(null);
    toast({ title: 'Not available', description: 'Saved reports are not available', variant: 'destructive' });
  };

  const handleDownloadReport = (report: Report) => {
    if (!report.data) {
      toast({ title: 'Error', description: 'No data available for this report', variant: 'destructive' });
      return;
    }
    
    const filename = `${report.name.replace(/\s+/g, '-').toLowerCase()}-${report.created}.csv`;
    downloadCsv(report.data as any[], filename);
    toast({ title: 'Downloaded', description: `${filename} downloaded successfully` });
  };

  const handleExportCurrent = () => {
    if (selectedMetrics.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one metric', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    generateReportData(reportType)
      .then((data) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const rows = Array.isArray(data.rows) ? data.rows : [];
        if (!rows.length) {
          toast({ title: 'No data', description: 'No data available for the selected range', variant: 'destructive' });
          return;
        }
        downloadCsv(rows, `report-preview-${today}.csv`);
        toast({ title: 'Exported', description: 'Report preview exported as CSV' });
      })
      .catch((error: any) => {
        toast({ title: 'Error', description: error?.message || 'Failed to generate report', variant: 'destructive' });
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-muted-foreground">
            Create custom reports and export your data.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  placeholder="Enter report name..."
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Metrics to Include</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {metricOptions.map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleMetricToggle(metric.id)}
                  >
                    <Checkbox
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => handleMetricToggle(metric.id)}
                    />
                    <span className="text-sm">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateReport} className="gradient-primary text-primary-foreground">
                <Play className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button variant="outline" onClick={handleExportCurrent}>
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Saved Reports ({savedReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
              {savedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-lg bg-muted/50 space-y-2 border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.type} • {report.created}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setDeleteConfirmId(report.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewingReport(report)}>
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingReport(report)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownloadReport(report)}>
                      <Download className="mr-1 h-3 w-3" />
                      CSV
                    </Button>
                  </div>
                </div>
              ))}
              {savedReports.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No saved reports yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Report Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingReport?.name}</DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {viewingReport.type}</div>
                <div><span className="text-muted-foreground">Created:</span> {viewingReport.created}</div>
                <div><span className="text-muted-foreground">Date Range:</span> {viewingReport.dateFrom} to {viewingReport.dateTo}</div>
                <div><span className="text-muted-foreground">Metrics:</span> {viewingReport.metrics.join(', ')}</div>
              </div>
              {viewingReport.data && (
                <div className="border rounded-lg overflow-auto max-h-60">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(viewingReport.data[0] || {}).map(key => (
                          <th key={key} className="p-2 text-left font-medium">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewingReport.data.map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-2">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button onClick={() => handleDownloadReport(viewingReport)} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>
          {editingReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input
                  value={editingReport.name}
                  onChange={(e) => setEditingReport({ ...editingReport, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={editingReport.type.toLowerCase()} onValueChange={(v) => setEditingReport({ ...editingReport, type: v.charAt(0).toUpperCase() + v.slice(1) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingReport(null)}>Cancel</Button>
                <Button onClick={handleUpdateReport}>Save Changes</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDeleteReport(deleteConfirmId)} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReportBuilder;
