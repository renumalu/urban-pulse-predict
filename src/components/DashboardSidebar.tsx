import { Car, CloudRain, Ambulance, BarChart3, Map, Box, Radio, LogOut, Activity, FileText, Brain, Sparkles } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { title: 'Overview', url: '/dashboard', icon: Map, color: 'text-primary' },
  { title: 'Traffic Intelligence', url: '/dashboard/traffic', icon: Car, color: 'text-neon-orange' },
  { title: 'Flood & Weather', url: '/dashboard/flood', icon: CloudRain, color: 'text-neon-cyan' },
  { title: 'Emergency Control', url: '/dashboard/emergency', icon: Ambulance, color: 'text-neon-red' },
  { title: 'AI Predictions', url: '/dashboard/predictions', icon: Brain, color: 'text-neon-purple' },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3, color: 'text-neon-green' },
  { title: 'Citizen Reports', url: '/reports', icon: FileText, color: 'text-muted-foreground' },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card/80 backdrop-blur-sm">
      <SidebarHeader className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center glow-blue shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display text-sm tracking-widest text-primary text-glow-blue">URBANPULSE</h1>
              <p className="text-[10px] text-muted-foreground font-mono-tech -mt-0.5">Digital Twin</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive(item.url) ? item.color : ''}`} />
                      {!collapsed && <span className="text-sm font-mono-tech">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-neon-green animate-pulse" />
            {!collapsed && <span className="text-xs font-mono-tech text-neon-green">LIVE</span>}
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
