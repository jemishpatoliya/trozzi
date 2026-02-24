import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Activity,
  Brain,
  FileText,
  ShoppingCart,
  Package,
  ClipboardList,
  Boxes,
  CreditCard,
  Users,
  FolderTree,
  Image,
  Bell,
  ScrollText,
  Database,
  Bot,
  Puzzle,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  ImageIcon,
  Star,
  MessageSquare,
  ThumbsUp,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { 
        title: 'Analytics', 
        url: '/analytics', 
        icon: BarChart3,
        children: [
          { title: 'Overview', url: '/analytics/overview' },
          { title: 'Advanced Analytics', url: '/analytics/advanced' },
          { title: 'Real-Time', url: '/analytics/realtime' },
          { title: 'Business Intelligence', url: '/analytics/bi' },
          { title: 'Report Builder', url: '/analytics/reports' },
        ],
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { title: 'Products', url: '/commerce/products', icon: Package },
      { title: 'Categories', url: '/commerce/categories', icon: FolderTree },
      { title: 'Banners', url: '/commerce/banners', icon: ImageIcon },
      { title: 'Orders', url: '/commerce/orders', icon: ClipboardList },
      { title: 'Inventory', url: '/commerce/inventory', icon: Boxes },
      { title: 'Payments', url: '/commerce/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Customer Experience',
    items: [
      { title: 'Reviews', url: '/reviews', icon: Star, children: [
        { title: 'All Reviews', url: '/reviews', icon: MessageSquare },
        { title: 'Review Analytics', url: '/reviews/analytics', icon: BarChart3 },
      ]},
    ],
  },
  {
    label: 'Users & Content',
    items: [
      { title: 'Users', url: '/users', icon: Users },
      { title: 'Media Library', url: '/media', icon: Image },
      { title: 'Notifications', url: '/notifications', icon: Bell },
      { title: 'Audit Logs', url: '/audit-logs', icon: ScrollText },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Data Management', url: '/data-management', icon: Database },
      { title: 'AI & Automation', url: '/ai-automation', icon: Bot },
      { title: 'Plugins', url: '/plugins', icon: Puzzle },
      { title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AdminContentSettingsPayload = {
  success: boolean;
  data?: {
    brandLogoUrl?: string;
  };
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

export function AppSidebar({ open, onOpenChange }: AppSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Analytics', 'Reviews']);
  const [brandLogoUrl, setBrandLogoUrl] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get<AdminContentSettingsPayload>(`${API_BASE_URL}/admin/content-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled && res.data?.success) {
          setBrandLogoUrl(String(res.data?.data?.brandLogoUrl || '').trim());
        }
      } catch (_e) {
        if (!cancelled) setBrandLogoUrl('');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt="Brand logo"
                className="h-10 w-10 rounded-xl object-contain bg-white/90 p-1"
                loading="eager"
              />
            ) : (
              <Zap className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg text-sidebar-foreground">Trozzi</span>
            <span className="text-xs text-sidebar-muted">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-muted uppercase tracking-wider px-3 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.children) {
                    const isExpanded = expandedItems.includes(item.title);
                    const hasActiveChild = item.children.some((child) =>
                      isActive(child.url)
                    );

                    return (
                      <Collapsible
                        key={item.title}
                        open={isExpanded || hasActiveChild}
                        onOpenChange={() => toggleExpanded(item.title)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className={cn(
                                'w-full justify-between hover:bg-sidebar-accent transition-colors',
                                (isExpanded || hasActiveChild) && 'bg-sidebar-accent'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                              ) : (
                                <ChevronRight className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <div className="ml-7 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                              {item.children.map((child) => (
                                <NavLink
                                  key={child.url}
                                  to={child.url}
                                  className={({ isActive }) =>
                                    cn(
                                      'block py-2 px-3 text-sm rounded-md transition-colors',
                                      isActive
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                        : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
                                    )
                                  }
                                >
                                  {child.title}
                                </NavLink>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                              isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow-sm'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent'
                            )
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
