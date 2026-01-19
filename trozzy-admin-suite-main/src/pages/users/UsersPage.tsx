import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { initializeMockData, getUsers, setUsers, User, generateId, addAuditLog } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

const UsersPage = () => {
  const { toast } = useToast();
  const [users, setUsersState] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' as User['role'], status: 'active' as User['status'] });

  useEffect(() => { initializeMockData(); setUsersState(getUsers()); }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email) { toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' }); return; }
    if (editingUser) {
      const updated = users.map((u) => u.id === editingUser.id ? { ...u, ...formData } : u);
      setUsersState(updated); setUsers(updated);
      addAuditLog({ user: 'Admin User', action: 'Updated user', module: 'Users', timestamp: new Date().toISOString(), details: `Updated: ${formData.name}` });
      toast({ title: 'Success', description: 'User updated' });
    } else {
      const newUser: User = { id: generateId(), ...formData, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`, lastActive: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString().split('T')[0] };
      const updated = [newUser, ...users]; setUsersState(updated); setUsers(updated);
      toast({ title: 'Success', description: 'User created' });
    }
    resetForm(); setIsModalOpen(false);
  };

  const handleDelete = (id: string) => { const updated = users.filter((u) => u.id !== id); setUsersState(updated); setUsers(updated); toast({ title: 'Success', description: 'User deleted' }); };
  const resetForm = () => { setEditingUser(null); setFormData({ name: '', email: '', role: 'user', status: 'active' }); };

  const columns = [
    { key: 'avatar', header: 'Avatar', render: (user: User) => <Avatar className="h-10 w-10"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback></Avatar> },
    { key: 'name', header: 'Name' }, { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (user: User) => <StatusBadge status={user.role} /> },
    { key: 'status', header: 'Status', render: (user: User) => <StatusBadge status={user.status} /> },
    { key: 'lastActive', header: 'Last Active' },
    { key: 'actions', header: 'Actions', render: (user: User) => (
      <div className="flex gap-2">
        <Button size="icon" variant="ghost" onClick={() => { setEditingUser(user); setFormData({ name: user.name, email: user.email, role: user.role, status: user.status }); setIsModalOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Users</h1><p className="text-muted-foreground">Manage user accounts and permissions.</p></div>
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add User</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Role</Label><Select value={formData.role} onValueChange={(v: User['role']) => setFormData({ ...formData, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="user">User</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v: User['status']) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">{editingUser ? 'Update' : 'Add'} User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="user">User</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
      </div>
      <DataTable data={filteredUsers} columns={columns} emptyMessage="No users found" />
    </div>
  );
};

export default UsersPage;
