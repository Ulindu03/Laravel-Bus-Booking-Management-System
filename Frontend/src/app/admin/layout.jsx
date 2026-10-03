'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import styles from './adminLayout.module.css';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinnerRing} />
          <span className={styles.loadingText}>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  // If user is not admin or super_admin, show access denied
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.accessDenied}>
          <div className={styles.deniedIcon}>🔒</div>
          <h2>Access Denied</h2>
          <p>You do not have permission to access the admin panel.</p>
          <a href="/" className={styles.homeLink}>Go to Homepage</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminRoot}>
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`${styles.mainArea} ${sidebarCollapsed ? styles.mainExpanded : ''}`}>
        <AdminTopBar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
