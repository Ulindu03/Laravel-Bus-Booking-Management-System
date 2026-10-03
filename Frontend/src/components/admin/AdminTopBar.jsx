'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import styles from './AdminTopBar.module.css';

import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';

const breadcrumbMap = {
  '/admin/home': ['Dashboard'],
  '/admin/buses': ['Management', 'Buses'],
  '/admin/buses/create': ['Management', 'Buses', 'Create'],
  '/admin/routes': ['Management', 'Routes'],
  '/admin/schedules': ['Management', 'Schedules'],
  '/admin/bookings': ['Management', 'Bookings'],
  '/admin/users': ['Management', 'Users'],
  '/admin/settings': ['Settings'],
};

const AdminTopBar = ({ onMenuToggle }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const crumbs = breadcrumbMap[pathname] || ['Dashboard'];
  const pageTitle = crumbs[crumbs.length - 1];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.leftWrapper}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          <MenuIcon />
        </button>
        <div className={styles.leftSection}>
          <div className={styles.breadcrumbs}>
            <span className={styles.crumbBase}>Admin</span>
            {crumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <span className={styles.crumbSep}>/</span>
                <span className={i === crumbs.length - 1 ? styles.crumbActive : styles.crumbItem}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Search */}
        <div className={`${styles.searchWrap} ${searchFocused ? styles.searchFocused : ''}`}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Notifications */}
        <button className={styles.notifBtn}>
          <NotificationsNoneIcon />
          <span className={styles.notifBadge}>3</span>
        </button>

        {/* Profile */}
        <div className={styles.profileWrap}>
          <button
            className={styles.profileBtn}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.name || 'Admin'}</span>
              <span className={styles.profileRole}>Administrator</span>
            </div>
            <KeyboardArrowDownIcon className={`${styles.dropdownArrow} ${profileOpen ? styles.arrowUp : ''}`} />
          </button>

          {profileOpen && (
            <>
              <div className={styles.dropdownOverlay} onClick={() => setProfileOpen(false)} />
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem}>
                  <PersonIcon /> Profile
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <LogoutIcon /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
