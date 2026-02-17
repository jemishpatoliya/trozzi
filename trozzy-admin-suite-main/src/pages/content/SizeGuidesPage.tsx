import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ruler } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type GuideRow = Record<string, string>;

type CategoryKey = 'apparel' | 'shoes' | 'accessories';

type CategoryConfig = {
  label: string;
  columns: Array<{ key: string; label: string }>;
  defaultRows: GuideRow[];
};

const cloneRows = (rows: GuideRow[]): GuideRow[] => rows.map((r) => ({ ...r }));

const LAST_SELECTED_GUIDE_KEY = 'trozzy_size_guides_selected_key';

const resolveApiOrigin = () => {
  const envAny = (import.meta as any)?.env || {};
  const raw = String(envAny.VITE_API_URL || envAny.VITE_API_BASE_URL || '').trim();
  const fallback = 'http://localhost:5050';
  const base = raw || fallback;
  return base.replace(/\/$/, '').replace(/\/api$/, '');
};

const API_ORIGIN = resolveApiOrigin();

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const url = typeof input === 'string'
    ? (input.startsWith('http') ? input : `${API_ORIGIN}${input.startsWith('/') ? '' : '/'}${input}`)
    : input;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const contentType = String(res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json')) {
        const data = await res.json();
        msg = data?.message ?? msg;
      } else {
        const text = await res.text();
        if (text) msg = text.slice(0, 200);
      }
    } catch {
    }
    throw new Error(msg);
  }

  const contentType = String(res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(text ? `Invalid JSON response: ${text.slice(0, 120)}` : 'Invalid JSON response');
  }

  return (await res.json()) as T;
}

const CATEGORY_CONFIG: Record<CategoryKey, CategoryConfig> = {
  apparel: {
    label: 'Apparel',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'chest', label: 'Chest' },
      { key: 'waist', label: 'Waist' },
      { key: 'hips', label: 'Hips' },
    ],
    defaultRows: [
      { size: 'S', chest: '34-36"', waist: '28-30"', hips: '34-36"' },
      { size: 'M', chest: '38-40"', waist: '32-34"', hips: '38-40"' },
      { size: 'L', chest: '42-44"', waist: '36-38"', hips: '42-44"' },
      { size: 'XL', chest: '46-48"', waist: '40-42"', hips: '46-48"' },
    ],
  },
  shoes: {
    label: 'Shoes',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'footLength', label: 'Foot Length' },
      { key: 'width', label: 'Width' },
      { key: 'material', label: 'Material' },
    ],
    defaultRows: [
      { size: '7', footLength: '24cm', width: 'Regular', material: 'Leather' },
      { size: '8', footLength: '25cm', width: 'Regular', material: 'Leather' },
      { size: '9', footLength: '26cm', width: 'Regular', material: 'Leather' },
      { size: '10', footLength: '27cm', width: 'Regular', material: 'Leather' },
    ],
  },
  accessories: {
    label: 'Accessories',
    columns: [
      { key: 'size', label: 'Size' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'fitType', label: 'Fit Type' },
    ],
    defaultRows: [
      { size: 'One Size', dimensions: 'Adjustable', fitType: 'Universal' },
      { size: 'Small', dimensions: '16-18cm', fitType: 'Slim' },
      { size: 'Medium', dimensions: '18-20cm', fitType: 'Regular' },
      { size: 'Large', dimensions: '20-22cm', fitType: 'Relaxed' },
    ],
  },
};

const normalizeGuideKey = (raw: string) => {
  const v = String(raw || '').trim().toLowerCase();
  const cleaned = v
    .replace(/[^a-z0-9\s\-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'default';
};

const SizeGuidesPage = () => {
  const [guideKey, setGuideKey] = useState<string>(() => normalizeGuideKey(window.localStorage.getItem(LAST_SELECTED_GUIDE_KEY) || 'apparel'));
  const [template, setTemplate] = useState<CategoryKey>('apparel');
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [columns, setColumns] = useState<Array<{ key: string; label: string }>>(CATEGORY_CONFIG.apparel.columns);
  const [rows, setRows] = useState<GuideRow[]>(cloneRows(CATEGORY_CONFIG.apparel.defaultRows));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const config = CATEGORY_CONFIG[template];

  const payloadForCategory = useMemo(() => {
    return {
      columns,
      rows,
    };
  }, [columns, rows]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await requestJson<{ keys: string[] }>('/api/size-guides');
        if (cancelled) return;
        setAvailableKeys(Array.isArray(data?.keys) ? data.keys : []);
      } catch {
        if (!cancelled) setAvailableKeys([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await requestJson<{ category: string; columns: Array<{ key: string; label: string }>; rows: GuideRow[] }>(`/api/size-guides/${encodeURIComponent(guideKey)}`);
        if (cancelled) return;
        const apiColumns = Array.isArray(data?.columns) && data.columns.length > 0 ? data.columns : CATEGORY_CONFIG[template].columns;
        const apiRows = Array.isArray(data?.rows) ? data.rows : [];
        setColumns(apiColumns);
        setRows(apiRows.length > 0 ? apiRows : cloneRows(CATEGORY_CONFIG[template].defaultRows));
      } catch (e: any) {
        if (cancelled) return;
        setLoadError(String(e?.message || e));
        setColumns(CATEGORY_CONFIG[template].columns);
        setRows(cloneRows(CATEGORY_CONFIG[template].defaultRows));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [guideKey, template]);

  const updateRow = (index: number, key: string, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => {
      const nextRow: GuideRow = {};
      for (const c of columns) nextRow[c.key] = '';
      return [...prev, nextRow];
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold tracking-tight">Size Guides</h1><p className="text-muted-foreground">Configure size charts for products.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" />Edit Size Guide</CardTitle>
              <Button
                disabled={isSaving || isLoading}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await requestJson(`/api/size-guides/${encodeURIComponent(guideKey)}`, {
                      method: 'PUT',
                      body: JSON.stringify(payloadForCategory),
                    });
                    try {
                      const data = await requestJson<{ keys: string[] }>('/api/size-guides');
                      setAvailableKeys(Array.isArray(data?.keys) ? data.keys : []);
                    } catch {
                    }
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Guide Key</div>
                <Select value={guideKey} onValueChange={(v) => {
                  const next = normalizeGuideKey(v);
                  window.localStorage.setItem(LAST_SELECTED_GUIDE_KEY, next);
                  setGuideKey(next);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(availableKeys.length > 0 ? availableKeys : ['apparel','shoes','accessories']).map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Template</div>
                <Select value={template} onValueChange={(v) => setTemplate(v as CategoryKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apparel">Apparel</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="md:col-span-2">
                <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Create new guide key (e.g. cap)" />
              </div>
              <Button
                variant="outline"
                disabled={!newKey.trim()}
                onClick={async () => {
                  const next = normalizeGuideKey(newKey);
                  const templateColumns = CATEGORY_CONFIG[template].columns;
                  const templateRows = cloneRows(CATEGORY_CONFIG[template].defaultRows);

                  window.localStorage.setItem(LAST_SELECTED_GUIDE_KEY, next);
                  setGuideKey(next);
                  setColumns(templateColumns);
                  setRows(templateRows);

                  setIsSaving(true);
                  try {
                    await requestJson(`/api/size-guides/${encodeURIComponent(next)}`, {
                      method: 'PUT',
                      body: JSON.stringify({ columns: templateColumns, rows: templateRows }),
                    });
                    try {
                      const data = await requestJson<{ keys: string[] }>('/api/size-guides');
                      setAvailableKeys(Array.isArray(data?.keys) ? data.keys : []);
                    } catch {
                    }
                  } finally {
                    setIsSaving(false);
                    setNewKey('');
                  }
                }}
              >
                Create
              </Button>
            </div>
            {loadError ? (
              <div className="text-sm text-destructive">{loadError}</div>
            ) : null}
            <div className="flex justify-end">
              <Button variant="outline" disabled={isLoading} onClick={addRow}>+ Add Row</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key}>{c.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={`${guideKey}-${row.size || 'row'}-${i}`}>
                    <TableCell className="font-medium">
                      <Input value={row.size ?? ''} onChange={(e) => updateRow(i, 'size', e.target.value)} />
                    </TableCell>
                    {columns.slice(1).map((c) => (
                      <TableCell key={c.key}>
                        <Input value={row[c.key] ?? ''} onChange={(e) => updateRow(i, c.key, e.target.value)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-4">{guideKey} Size Guide</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c.key}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={`${guideKey}-preview-${row.size || 'row'}-${i}`}>
                      <TableCell className="font-medium">{row.size}</TableCell>
                      {columns.slice(1).map((c) => (
                        <TableCell key={c.key}>{row[c.key] ?? ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SizeGuidesPage;
