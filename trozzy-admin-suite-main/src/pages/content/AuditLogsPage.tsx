import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Search, ScrollText } from 'lucide-react';
import { initializeMockData, getAuditLogs, AuditLog } from '@/lib/mockData';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => { initializeMockData(); setLogs(getAuditLogs()); }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) || log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const columns = [
    { key: 'user', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'module', header: 'Module' },
    { key: 'timestamp', header: 'Time' },
    { key: 'details', header: 'Details', render: (log: AuditLog) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{log.details}</span> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1><p className="text-muted-foreground">View system activity history.</p></div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}><SelectTrigger className="w-40"><SelectValue placeholder="Module" /></SelectTrigger><SelectContent><SelectItem value="all">All Modules</SelectItem><SelectItem value="Products">Products</SelectItem><SelectItem value="Orders">Orders</SelectItem><SelectItem value="Users">Users</SelectItem><SelectItem value="Settings">Settings</SelectItem></SelectContent></Select>
      </div>
      <DataTable data={filteredLogs} columns={columns} emptyMessage="No logs found" />
    </div>
  );
};

export default AuditLogsPage;
