import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Save, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DataManagementPage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const STORAGE_KEYS = [
    'trozzy_products', 'trozzy_orders', 'trozzy_users', 'trozzy_categories',
    'trozzy_media', 'trozzy_reports', 'trozzy_audit_logs', 'trozzy_notifications',
    'trozzy_settings', 'trozzy_campaigns', 'trozzy_payment_settings'
  ];

  // Convert array of objects to CSV string
  const arrayToCSV = (data: any[], filename: string): string => {
    if (!Array.isArray(data) || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      `# ${filename}`,
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  // Parse CSV string back to array of objects
  const parseCSV = (csv: string): { key: string; data: any[] } | null => {
    const lines = csv.trim().split('\n');
    if (lines.length < 3) return null;
    
    // First line should be # key_name
    const keyMatch = lines[0].match(/^#\s*(.+)$/);
    if (!keyMatch) return null;
    const key = keyMatch[1].trim();
    
    // Second line is headers
    const headers = lines[1].split(',').map(h => h.trim());
    
    // Rest is data
    const data: any[] = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);
      
      const row: any = {};
      headers.forEach((h, idx) => {
        let val = values[idx] || '';
        // Try to parse JSON objects
        if (val.startsWith('{') || val.startsWith('[')) {
          try { val = JSON.parse(val); } catch {}
        } else if (val === 'true') val = true as any;
        else if (val === 'false') val = false as any;
        else if (!isNaN(Number(val)) && val !== '') val = Number(val) as any;
        row[h] = val;
      });
      data.push(row);
    }
    
    return { key, data };
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        // Split by double newlines to separate different data sections
        const sections = content.split(/\n\n+/).filter(s => s.trim());
        let imported = 0;
        
        sections.forEach(section => {
          const parsed = parseCSV(section);
          if (parsed && parsed.key && parsed.data.length > 0) {
            const existing = localStorage.getItem(parsed.key);
            if (existing) {
              try {
                const existingData = JSON.parse(existing);
                if (Array.isArray(existingData)) {
                  const merged = [...parsed.data, ...existingData];
                  localStorage.setItem(parsed.key, JSON.stringify(merged));
                } else {
                  localStorage.setItem(parsed.key, JSON.stringify(parsed.data));
                }
              } catch {
                localStorage.setItem(parsed.key, JSON.stringify(parsed.data));
              }
            } else {
              localStorage.setItem(parsed.key, JSON.stringify(parsed.data));
            }
            imported++;
          }
        });
        
        toast({ title: 'Imported', description: `Imported ${imported} data sections from CSV` });
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to parse CSV file', variant: 'destructive' });
      }
      setImporting(false);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const csvSections: string[] = [];
    
    STORAGE_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            csvSections.push(arrayToCSV(parsed, key));
          }
        } catch {}
      }
    });

    if (csvSections.length === 0) {
      toast({ title: 'Info', description: 'No data to export' });
      return;
    }

    const blob = new Blob([csvSections.join('\n\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trozzy-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'All data exported as CSV' });
  };

  const handleBackup = () => {
    const csvSections: string[] = [];
    
    // Get all trozzy_ keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('trozzy_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              csvSections.push(arrayToCSV(parsed, key));
            }
          } catch {}
        }
      }
    }

    if (csvSections.length === 0) {
      toast({ title: 'Info', description: 'No data to backup' });
      return;
    }

    const blob = new Blob([csvSections.join('\n\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trozzy-backup-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    localStorage.setItem('trozzy_last_backup', new Date().toISOString());
    toast({ title: 'Backup Created', description: 'Full backup downloaded as CSV' });
  };

  const lastBackup = localStorage.getItem('trozzy_last_backup');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground">Import, export, and backup your data in CSV format.</p>
      </div>

      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".csv" 
        onChange={handleImport} 
        className="hidden" 
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import products, orders, or users from CSV files. Data will be merged with existing records.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Select CSV File'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-accent" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all your data to CSV format for external use or migration.
            </p>
            <Button className="w-full" variant="outline" onClick={handleExport}>
              <FileText className="mr-2 h-4 w-4" />
              Export All Data (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-success" />
              Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create and download a full backup of all system data as CSV.
            </p>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={handleBackup}>
              Create Backup (CSV)
            </Button>
            {lastBackup && (
              <p className="text-xs text-muted-foreground">
                Last backup: {new Date(lastBackup).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            CSV Format Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>The CSV export contains multiple sections, each starting with a comment line (# key_name) followed by headers and data.</p>
            <p>When importing, the system will automatically detect sections and merge data with existing records.</p>
            <p>Supported data types: products, orders, users, categories, campaigns, and more.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagementPage;
