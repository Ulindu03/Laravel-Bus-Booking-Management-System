'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';
import adminService from '@/app/api/adminService';
import styles from '../routes/routesPage.module.css';

import BookOnlineIcon from '@mui/icons-material/BookOnline';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';

const BookingsPage = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const res = await adminService.getBookings(params);
      
      if (res.success) {
        setBookings(res.data.data || []); // Accessing paginated data items
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const map = {
      pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      confirmed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
      completed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    };
    return map[status] || map.pending;
  };

  const columns = [
    { key: 'booking_ref', label: 'Booking Ref', render: (row) => <span style={{fontWeight:700,color:'#06b6d4',fontFamily:'monospace',fontSize:'13px'}}>{row.booking_ref}</span> },
    { key: 'passenger', label: 'Passenger', render: (row) => (
      <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
        <span style={{color:'#fff',fontWeight:600,fontSize:'13px'}}>{row.user?.name || 'Guest'}</span>
        <span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px'}}>{row.user?.email || 'N/A'}</span>
      </div>
    )},
    { key: 'route', label: 'Route', render: (row) => <span>{row.schedule?.route?.name || 'N/A'}</span> },
    { key: 'date', label: 'Booked Date', render: (row) => <span style={{color:'rgba(255,255,255,0.7)'}}>{new Date(row.booked_at || row.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</span> },
    { key: 'seats', label: 'Seats', render: (row) => <span>{row.total_seats}</span>, align: 'center' },
    { key: 'amount', label: 'Amount', render: (row) => <span className={styles.fareText}>LKR {parseFloat(row.total_amount).toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const st = getStatusStyle(row.status);
      return <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,color:st.color,background:st.bg,textTransform:'capitalize'}}>{row.status}</span>;
    }},
  ];

  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        <StatsCard icon={<BookOnlineIcon />} label="Total Bookings" value={stats.total} gradient="blue" />
        <StatsCard icon={<PendingIcon />} label="Pending" value={stats.pending} gradient="orange" />
        <StatsCard icon={<CheckCircleIcon />} label="Confirmed" value={stats.confirmed} gradient="cyan" />
        <StatsCard icon={<MonetizationOnIcon />} label="Revenue" value={`${(stats.revenue/1000).toFixed(1)}k`} gradient="green" subtitle="LKR" />
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        searchPlaceholder="Search bookings..."
        emptyMessage="No bookings found"
        emptySubMessage="Bookings will appear here once passengers start booking"
        filters={
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff',fontSize:'13px',fontFamily:'inherit',cursor:'pointer'}}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
        actions={(row) => (
          <button className={styles.actionBtn} title="View Details"><VisibilityIcon /></button>
        )}
      />
    </div>
  );
};

export default BookingsPage;
