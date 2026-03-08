import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Box, Map } from 'lucide-react';
import { useState } from 'react';
import AIChatWidget from '@/components/AIChatWidget';

interface DashboardLayoutProps {
  viewMode: '3d' | 'map';
  setViewMode: (mode: '3d' | 'map') => void;
}

export default function DashboardLayout({ viewMode, setViewMode }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background grid-bg scanline">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-12 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="text-xs font-mono-tech text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-1 bg-secondary rounded-md p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-tech transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Map className="w-3 h-3" /> Map
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-tech transition-colors ${viewMode === '3d' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Box className="w-3 h-3" /> 3D
                </button>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>

        <AIChatWidget />
      </div>
    </SidebarProvider>
  );
}
