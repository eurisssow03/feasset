import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Building, 
  Users, 
  Sparkles, 
  DollarSign, 
  Settings,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['ADMIN', 'FINANCE', 'CLEANER', 'AGENT'] },
  { name: 'Reservations', href: '/reservations', icon: Calendar, roles: ['ADMIN', 'FINANCE', 'CLEANER', 'AGENT'] },
  { name: 'Units', href: '/units', icon: Building, roles: ['ADMIN', 'FINANCE', 'CLEANER', 'AGENT'] },
  { name: 'Guests', href: '/guests', icon: Users, roles: ['ADMIN', 'FINANCE', 'CLEANER', 'AGENT'] },
  { name: 'Cleanings', href: '/cleanings', icon: Sparkles, roles: ['ADMIN', 'FINANCE', 'CLEANER'] },
  { name: 'Finance', href: '/finance', icon: DollarSign, roles: ['ADMIN', 'FINANCE'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6">
            <h1 className="text-xl font-bold text-gray-900">FE Homestay</h1>
          </div>

          {/* Close button for mobile */}
          <div className="lg:hidden absolute top-4 right-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul className="flex flex-1 flex-col gap-y-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )
                      }
                      onClick={onClose}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
