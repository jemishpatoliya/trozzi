import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Edit2, Trash2, Search, Filter, Users, Mail, Phone, Calendar, IndianRupee, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5050/api';
const api = axios.create({ baseURL: String(API_BASE_URL).replace(/\/$/, '') });

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  stats: {
    orderCount: number;
    totalSpent: number;
    cartItems: number;
  };
}

type CartLine = {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
  productSlug?: string;
  productImage?: string;
};

type OrderLine = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type UserOrder = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency?: string;
  createdAt?: string;
  createdAtIso?: string;
  items: OrderLine[];
};

const UsersManagementPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsCart, setDetailsCart] = useState<CartLine[]>([]);
  const [detailsOrders, setDetailsOrders] = useState<UserOrder[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
    active: true,
  });

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUsers([]);
        setUsersError('Please sign in to view users.');
        navigate('/sign-in');
        return;
      }

      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '200');
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const response = await api.get(`/admin/users?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const payload = response.data;
      const apiUsers = Array.isArray(payload?.users) ? payload.users : [];

      setUsers(
        apiUsers.map((u: any) => ({
          id: String(u._id ?? u.id),
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          phone: u.phone || '',
          role: (u.role || 'user') as 'user' | 'admin',
          active: Boolean(u.active),
          emailVerified: Boolean(u.emailVerified),
          createdAt: u.createdAt || new Date().toISOString(),
          stats: {
            orderCount: Number(u?.stats?.orderCount ?? 0),
            totalSpent: Number(u?.stats?.totalSpent ?? 0),
            cartItems: Number(u?.stats?.cartItems ?? 0),
          },
        })),
      );
    } catch (error: any) {
      setUsers([]);
      setUsersError(error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / 20);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * 20, currentPage * 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in');

      if (!editingId) {
        throw new Error('Create user is not implemented yet.');
      }

      await api.put(
        `/api/admin/users/${editingId}`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          active: formData.active,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await loadUsers();
      toast({
        title: editingId ? 'User updated' : 'User created',
        description: 'User has been saved successfully.',
      });
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save user.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      active: user.active,
    });
    setIsModalOpen(true);
  };

  const openDetails = async (user: User) => {
    setDetailsUser(user);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetailsCart([]);
    setDetailsOrders([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in');

      const [cartRes, ordersRes] = await Promise.all([
        api.get(`/admin/users/${user.id}/cart`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/admin/users/${user.id}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setDetailsCart(Array.isArray(cartRes?.data?.items) ? cartRes.data.items : []);
      setDetailsOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
    } catch (e: any) {
      setDetailsError(e?.response?.data?.message || e?.message || 'Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in');

      await api.delete(`/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await loadUsers();
      toast({
        title: 'User deleted',
        description: 'User has been removed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in');

      await api.patch(`/api/admin/users/${id}/toggle-active`, undefined, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await loadUsers();
      toast({
        title: 'User status updated',
        description: 'User status has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      active: true,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'user' | 'admin') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {isLoadingUsers ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Loading users...</h3>
            </CardContent>
          </Card>
        ) : usersError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Failed to load users</h3>
              <p className="text-muted-foreground text-center mb-4">{usersError}</p>
            </CardContent>
          </Card>
        ) : paginatedUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No users match your search criteria.'
                  : 'Get started by adding your first user.'
                }
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardContent>
          </Card>
        ) : (
          paginatedUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={user.active ? 'active' : 'inactive'} />
                      <span className="text-sm text-muted-foreground capitalize">
                        {user.role}
                      </span>
                      {user.emailVerified && (
                        <span className="text-sm text-green-600">✓ Verified</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={user.active}
                      onCheckedChange={() => handleToggleActive(user.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                {/* User Stats */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{user.stats.orderCount}</div>
                      <div className="text-sm text-muted-foreground">Orders</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">₹{user.stats.totalSpent.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{user.stats.cartItems}</div>
                      <div className="text-sm text-muted-foreground">Cart Items</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={(open) => {
        setDetailsOpen(open);
        if (!open) {
          setDetailsUser(null);
          setDetailsCart([]);
          setDetailsOrders([]);
          setDetailsError(null);
          setDetailsLoading(false);
        }
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {detailsUser ? `${detailsUser.firstName} ${detailsUser.lastName}` : 'User Details'}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading...</div>
          ) : detailsError ? (
            <div className="py-6 text-sm text-destructive">{detailsError}</div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Cart Products</h3>
                {detailsCart.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No cart items.</div>
                ) : (
                  <div className="space-y-2">
                    {detailsCart.map((it, idx) => (
                      <div key={`${it.productId}-${idx}`} className="flex items-center justify-between rounded-md border p-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.productName || String(it.productId)}</div>
                          <div className="text-xs text-muted-foreground">Qty: {it.quantity} • Price: {it.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Orders</h3>
                {detailsOrders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No orders.</div>
                ) : (
                  <div className="space-y-3">
                    {detailsOrders.map((o) => (
                      <div key={String(o._id)} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">Order #{o.orderNumber}</div>
                            <div className="text-xs text-muted-foreground">Status: {o.status} • Total: {o.currency || '₹'}{Number(o.total || 0).toFixed(0)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {o.createdAtIso ? new Date(o.createdAtIso).toLocaleString() : (o.createdAt ? new Date(o.createdAt).toLocaleString() : '')}
                          </div>
                        </div>

                        {Array.isArray(o.items) && o.items.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {o.items.map((li, idx) => (
                              <div key={`${li.productId}-${idx}`} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{li.name}</div>
                                  <div className="text-xs text-muted-foreground">Qty: {li.quantity} • Price: {li.price}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default UsersManagementPage;
