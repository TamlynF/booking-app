"use client";

import {
  CalendarDaysIcon,
  TableCellsIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  FolderIcon,
  IdentificationIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import SignOutButton from './SignOutButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  {
    name: 'Dashboard',
    href: '/administration',
    icon: <ChartBarIcon className='h-5 w-5 text-primary-600' />,
  },
  {
    name: 'Events', // Kept original profile link here
    href: '/administration/events',
    icon: <FolderIcon className='h-4 w-4 text-primary-600' />,
  },
  {
    name: 'Bookings',
    href: '/administration/bookings',
    icon: <CalendarDaysIcon className='h-5 w-5 text-primary-600' />,
  },
  {
    name: 'Contacts',
    href: '/administration/contacts',
    icon: <IdentificationIcon className='h-4 w-4 text-primary-600' />,
  },
  {
    name: 'Employees',
    href: '/administration/employees',
    icon: <UsersIcon className='h-4 w-4 text-primary-600' />,
  },
  {
    name: 'Settings',
    icon: <CogIcon className='h-5 w-5 text-primary-600' />,
    children: [

      {
        name: 'Tables',
        href: '/administration/settings/tables',
        icon: <TableCellsIcon className='h-4 w-4 text-primary-600' />,
      },

      {
        name: 'Event Types',
        href: '/administration/settings/event-types',
        icon: <UserGroupIcon className='h-4 w-4 text-primary-600' />,
      },
    ]
  },
];

function SideNavigation() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isActive = (href) => pathname === href;

  return (
    <nav className='border-r border-lime-900'>
      <ul className='flex flex-col gap-1 h-full text-base'>
        {navLinks.map((link) => {
          if (link.children) {
            const isChildActive = link.children.some(child => isActive(child.href));

            if (isChildActive && !isSettingsOpen) {
              setIsSettingsOpen(true);
            }

            return (
              <li key={link.name}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full py-2 px-2 hover:bg-amber-900 hover:text-amber-100 transition-colors flex items-center justify-between font-semibold text-amber-100 ${isChildActive || isSettingsOpen ? "bg-amber-900/40" : ""
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {link.icon}
                    <span>{link.name}</span>
                  </div>
                  {isSettingsOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Render Dropdown Items */}
                {isSettingsOpen && (
                  <ul className="bg-yellow-950/20 flex flex-col gap-1 py-1">
                    {link.children.map((child) => (
                      <li key={child.name}>
                        <Link
                          href={child.href}
                          className={`py-2 pl-5 pr-1 hover:bg-amber-900 hover:text-amber-100 transition-colors flex items-center gap-1 text-base text-amber-100 ${isActive(child.href) ? "bg-amber-700 text-amber-100" : ""
                            }`}
                        >
                          {child.icon}
                          <span>{child.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          // Standard Menu Item
          return (
            <li key={link.name}>
              <Link
                className={`py-2 px-2 hover:bg-amber-900 hover:text-amber-100 transition-colors flex items-center gap-2 font-semibold text-amber-100 ${isActive(link.href) ? "bg-amber-700" : ""
                  }`}
                href={link.href}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            </li>
          );
        })}

        <li className='mt-auto'>
          <SignOutButton />
        </li>
      </ul>
    </nav>
  );
}

export default SideNavigation;
