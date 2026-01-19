import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Upload, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5050/api';
const api = axios.create({ baseURL: String(API_BASE_URL).replace(/\/$/, '') });

type MediaItem = {
  id: string;
  key: string;
  url: string;
  contentType: string;
  size: number;
  originalName: string;
  createdAt?: string;
  folder?: string;
};

const MediaLibraryPage = () => {
  const { toast } = useToast();
  const [media, setMediaState] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');

  const loadMedia = async (folder: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMediaState([]);
        return;
      }

      const qs = folder && folder !== 'all' ? `?folder=${encodeURIComponent(folder)}` : '';
      const res = await api.get(`/upload/list${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMediaState(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setMediaState([]);
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to load media',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadMedia('all');
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast({ title: 'Error', description: 'Admin token missing', variant: 'destructive' });
          return;
        }

        await Promise.all(
          Array.from(files).map(async (file) => {
            const form = new FormData();
            form.append('image', file);
            await api.post(`/upload/image?folder=${encodeURIComponent(activeFolder === 'all' ? 'misc' : activeFolder)}`, form, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            });
          }),
        );

        toast({ title: 'Uploaded', description: `${files.length} file(s) uploaded successfully` });
        await loadMedia(activeFolder);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err?.response?.data?.message || err?.message || 'Upload failed',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    run();
  };

  const handleDelete = (id: string) => {
    toast({
      title: 'Not available',
      description: 'Delete API is not implemented yet.',
      variant: 'destructive',
    });
  };

  const folders = Array.from(new Set(media.map((m) => String(m.folder || 'misc')))).filter(Boolean).sort();
  const folderOptions = ['all', ...folders];

  const grouped = (activeFolder === 'all'
    ? media
    : media.filter((m) => String(m.folder || 'misc') === activeFolder)
  ).reduce<Record<string, MediaItem[]>>((acc, item) => {
    const folder = String(item.folder || 'misc');
    acc[folder] = acc[folder] || [];
    acc[folder].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Media Library</h1><p className="text-muted-foreground">Manage your images and files.</p></div>
        <div>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleFileUpload} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} className="gradient-primary text-primary-foreground">
            <Upload className="mr-2 h-4 w-4" />Upload Files
          </Button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="w-full md:w-72">
          <Label>Folder</Label>
          <Input
            value={activeFolder}
            onChange={(e) => {
              const next = e.target.value;
              setActiveFolder(next);
            }}
            placeholder="all / products / categories / banners / misc"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {folderOptions.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={activeFolder === f ? 'default' : 'outline'}
                onClick={async () => {
                  setActiveFolder(f);
                  await loadMedia(f);
                }}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1" />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="glass">
          <CardContent className="p-6 text-sm text-muted-foreground">No files found.</CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([folder, items]) => (
          <div key={folder} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{folder}</div>
              <Badge variant="secondary" className="text-xs">{items.length} files</Badge>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
              {items.map((item) => (
                <Card key={item.id} className="glass group overflow-hidden">
                  <div className="aspect-square relative">
                    {String(item.contentType || '').startsWith('image/') ? (
                      <img src={item.url} alt={item.originalName || item.key} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" onClick={() => setSelectedItem(item)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs truncate">{item.originalName || item.key}</p>
                    <Badge variant="secondary" className="text-xs mt-1">{(item.size / 1024).toFixed(0)} KB</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>File Preview</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {String(selectedItem.contentType || '').startsWith('image/') ? (
                <img src={selectedItem.url} alt={selectedItem.originalName || selectedItem.key} className="w-full rounded-lg" />
              ) : (
                <div className="p-8 bg-muted rounded-lg text-center">
                  <span className="text-4xl">📄</span>
                  <p className="mt-2">{selectedItem.originalName || selectedItem.key}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {selectedItem.originalName || selectedItem.key}</div>
                <div><span className="text-muted-foreground">Size:</span> {(selectedItem.size / 1024).toFixed(0)} KB</div>
                <div><span className="text-muted-foreground">Type:</span> {selectedItem.contentType}</div>
                <div><span className="text-muted-foreground">Folder:</span> {selectedItem.folder || 'misc'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaLibraryPage;
