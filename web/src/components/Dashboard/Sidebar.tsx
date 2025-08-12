import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CogIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
  { name: 'Reports', href: '/reports', icon: DocumentTextIcon, current: false },
  { name: 'Alerts', href: '/alerts', icon: ExclamationTriangleIcon, current: false },
  { name: 'Map View', href: '/map', icon: MapPinIcon, current: false },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, current: false },
  { name: 'ATM Management', href: '/atms', icon: CogIcon, current: false, adminOnly: true },
  { name: 'User Management', href: '/users', icon: UserGroupIcon, current: false, adminOnly: true },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-white text-lg font-semibold">
            ATM Anomaly Detection
          </h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {filteredNavigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="text-xs leading-6 font-semibold text-gray-400">
                Organization: {user?.orgId || 'Unknown'}
              </div>
              <div className="text-xs leading-6 text-gray-400">
                Role: {user?.role || 'User'}
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};
