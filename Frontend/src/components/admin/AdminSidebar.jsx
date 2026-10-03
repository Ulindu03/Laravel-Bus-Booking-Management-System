'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import styles from './AdminSidebar.module.css';

import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import RouteIcon from '@mui/icons-material/Route';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/admin/home' },
  { label: 'Buses', icon: <DirectionsBusIcon />, href: '/admin/buses' },
  { label: 'Routes', icon: <RouteIcon />, href: '/admin/routes' },
  { label: 'Schedules', icon: <ScheduleIcon />, href: '/admin/schedules' },
  { label: 'Bookings', icon: <BookOnlineIcon />, href: '/admin/bookings' },
  { label: 'Users', icon: <PeopleIcon />, href: '/admin/users' },
  { label: 'AI Dashboard', icon: <SmartToyIcon />, href: '/admin/ai-dashboard' },
];

const AdminSidebar = ({ collapsed, onToggle }) => {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/admin/home') return pathname === '/admin/home';
    return pathname.startsWith(href);
  };

  return (
    <>
      {!collapsed && (
        <div className={styles.overlay} onClick={onToggle} />
      )}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoWrap}>
            <Image
              src="/images/logo.png"
              alt="Serendib Go"
              width={40}
              height={24}
              className={styles.sidebarLogo}
            />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Serendib Go</span>
            <span className={styles.brandSub}>Admin Panel</span>
          </div>
        </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLabel}>{!collapsed && 'MENU'}</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <div className={styles.navIconWrap}>
              {isActive(item.href) && <div className={styles.activeGlow} />}
              <span className={styles.navIcon}>{item.icon}</span>
            </div>
            {!collapsed && <span className={styles.navLabel2}>{item.label}</span>}
            {isActive(item.href) && <div className={styles.activeBar} />}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className={styles.bottomSection}>
        <Link
          href="/admin/settings"
          className={`${styles.navItem} ${pathname === '/admin/settings' ? styles.active : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <div className={styles.navIconWrap}>
            <span className={styles.navIcon}><SettingsIcon /></span>
          </div>
          {!collapsed && <span className={styles.navLabel2}>Settings</span>}
        </Link>

        <button
          className={styles.collapseBtn}
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;
