'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';
import adminService from '@/app/api/adminService';
import { useAuth } from '@/app/context/AuthContext';
import styles from '../routes/routesPage.module.css';

import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detailUser, setDetailUser] = useState(null);
  const { user: currentUser } = useAuth();
  const [promoteConfirm, setPromoteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers();
      setUsers(res.data || []);
    } catch (err) {
      // Fallback mock data
      setUsers([
        { id: 1, name: 'Admin User', email: 'admin@serendibgo.com', role: 'admin', status: 'active', created_at: '2026-01-15T10:00:00Z' },
        { id: 2, name: 'Kasun Perera', email: 'kasun@email.com', role: 'user', status: 'active', created_at: '2026-05-20T14:30:00Z' },
        { id: 3, name: 'Nimali Silva', email: 'nimali@email.com', role: 'user', status: 'active', created_at: '2026-05-25T09:15:00Z' },
        { id: 4, name: 'Amal Jayasinghe', email: 'amal@email.com', role: 'user', status: 'blocked', created_at: '2026-04-10T16:45:00Z' },
        { id: 5, name: 'Dilini Fernando', email: 'dilini@email.com', role: 'user', status: 'active', created_at: '2026-06-01T11:20:00Z' },
        { id: 6, name: 'Ruwan Bandara', email: 'ruwan@email.com', role: 'user', status: 'active', created_at: '2026-06-02T08:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!blockConfirm) return;
    const newStatus = blockConfirm.status === 'active' ? 'blocked' : 'active';
    try {
      await adminService.updateUser(blockConfirm.id, { status: newStatus });
      setUsers(users.map(u => u.id === blockConfirm.id ? { ...u, status: newStatus } : u));
      setSuccessMsg(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating user status');
    }
    setBlockConfirm(null);
  };

  const handlePromote = async () => {
    if (!promoteConfirm) return;
    try {
      await adminService.updateUser(promoteConfirm.id, { role: 'admin' });
      setUsers(users.map(u => u.id === promoteConfirm.id ? { ...u, role: 'admin' } : u));
      setSuccessMsg(`User promoted to admin successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error promoting user');
    }
    setPromoteConfirm(null);
  };

  const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const blockedCount = users.filter(u => u.status === 'blocked').length;

  const columns = [
    { key: 'name', label: 'User', render: (row) => (
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{width:'36px',height:'36px',borderRadius:'10px',background: row.role === 'admin' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:700,flexShrink:0}}>
          {row.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
          <span style={{color:'#fff',fontWeight:600,fontSize:'13px'}}>{row.name}</span>
          <span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px'}}>{row.email}</span>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (row) => (
      <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,color: row.role === 'admin' ? '#f59e0b' : '#3b82f6',background: row.role === 'admin' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',textTransform:'capitalize'}}>
        {row.role === 'admin' ? <AdminPanelSettingsIcon style={{fontSize:'14px'}} /> : <PersonIcon style={{fontSize:'14px'}} />}
        {row.role}
      </span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,color: row.status === 'active' ? '#10b981' : '#ef4444',background: row.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',textTransform:'capitalize'}}>
        {row.status === 'active' ? <CheckCircleIcon style={{fontSize:'14px'}} /> : <BlockIcon style={{fontSize:'14px'}} />}
        {row.status || 'active'}
      </span>
    )},
    { key: 'created_at', label: 'Joined', render: (row) => (
      <span style={{color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>{new Date(row.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</span>
    )},
  ];

  return (
    <div className={styles.page}>
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {error && <div className={styles.errorAlert}>{error} <button onClick={() => setError(null)}>×</button></div>}

      <div className={styles.statsGrid}>
        <StatsCard icon={<PeopleIcon />} label="Total Users" value={totalUsers} gradient="blue" />
        <StatsCard icon={<AdminPanelSettingsIcon />} label="Admins" value={adminCount} gradient="orange" />
        <StatsCard icon={<PersonIcon />} label="Passengers" value={userCount} gradient="cyan" />
        <StatsCard icon={<BlockIcon />} label="Blocked" value={blockedCount} gradient="pink" />
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        searchPlaceholder="Search users by name or email..."
        emptyMessage="No users found"
        filters={
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff',fontSize:'13px',fontFamily:'inherit',cursor:'pointer'}}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        }
        actions={(row) => (
          <>
            <button className={styles.actionBtn} onClick={() => setDetailUser(row)} title="View"><PersonIcon style={{fontSize:'16px'}} /></button>
            {row.role === 'user' && currentUser?.role === 'super_admin' && (
              <button
                className={styles.actionBtn}
                onClick={() => setPromoteConfirm(row)}
                title="Promote to Admin"
              >
                <AdminPanelSettingsIcon style={{fontSize:'16px', color:'#f59e0b'}} />
              </button>
            )}
            {row.role !== 'admin' && row.role !== 'super_admin' && (
              <button
                className={`${styles.actionBtn} ${row.status === 'active' ? styles.deleteBtn : ''}`}
                onClick={() => setBlockConfirm(row)}
                title={row.status === 'active' ? 'Block User' : 'Unblock User'}
              >
                {row.status === 'active' ? <BlockIcon style={{fontSize:'16px'}} /> : <CheckCircleIcon style={{fontSize:'16px'}} />}
              </button>
            )}
          </>
        )}
      />

      {/* User Detail Panel */}
      {detailUser && (
        <>
          <div className={styles.overlay} onClick={() => setDetailUser(null)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2>User Details</h2>
              <button className={styles.closeBtn} onClick={() => setDetailUser(null)}><CloseIcon /></button>
            </div>
            <div className={styles.drawerBody}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',padding:'20px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{width:'72px',height:'72px',borderRadius:'20px',background: (detailUser.role === 'admin' || detailUser.role === 'super_admin') ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#3b82f6,#2563eb)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'28px',fontWeight:700}}>
                  {detailUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{textAlign:'center'}}>
                  <h3 style={{color:'#fff',fontSize:'18px',fontWeight:700,margin:0}}>{detailUser.name}</h3>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:'13px',margin:'4px 0 0'}}>{detailUser.email}</p>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'16px',padding:'20px 0'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>Role</span>
                  <span style={{color:'#fff',fontSize:'14px',fontWeight:600,textTransform:'capitalize'}}>{detailUser.role}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>Status</span>
                  <span style={{color: (detailUser.status || 'active') === 'active' ? '#10b981' : '#ef4444',fontSize:'14px',fontWeight:600,textTransform:'capitalize'}}>{detailUser.status || 'active'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>Joined</span>
                  <span style={{color:'#fff',fontSize:'14px'}}>{new Date(detailUser.created_at).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Block/Unblock Confirmation */}
      {blockConfirm && (
        <>
          <div className={styles.overlay} onClick={() => setBlockConfirm(null)} />
          <div className={styles.modal}>
            <h3>{blockConfirm.status === 'active' ? 'Block User' : 'Unblock User'}</h3>
            <p>
              Are you sure you want to {blockConfirm.status === 'active' ? 'block' : 'unblock'} <strong>{blockConfirm.name}</strong>?
              {blockConfirm.status === 'active' && ' They will not be able to log in or make bookings.'}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setBlockConfirm(null)}>Cancel</button>
              <button className={blockConfirm.status === 'active' ? styles.deleteBtnLg : styles.saveBtn} onClick={handleToggleBlock}>
                {blockConfirm.status === 'active' ? 'Block User' : 'Unblock User'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Promote Confirmation */}
      {promoteConfirm && (
        <>
          <div className={styles.overlay} onClick={() => setPromoteConfirm(null)} />
          <div className={styles.modal}>
            <h3>Promote to Admin</h3>
            <p>
              Are you sure you want to promote <strong>{promoteConfirm.name}</strong> to Admin?
              They will have access to the admin dashboard and can manage buses, routes, and schedules.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setPromoteConfirm(null)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handlePromote}>
                Confirm Promotion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
