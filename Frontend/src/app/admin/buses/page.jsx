'use client';

import React, { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatsCard from '@/components/admin/StatsCard';
import busService from '@/app/api/busService';
import styles from '../routes/routesPage.module.css';
import Link from 'next/link';

import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const BusManagementPage = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await busService.getAllBuses();
      setBuses(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch buses');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await busService.deleteBus(deleteConfirm.id);
      setBuses(buses.filter((b) => b.id !== deleteConfirm.id));
      setSuccessMsg(`Bus "${deleteConfirm.name}" deleted successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Failed to delete bus');
    }
  };

  const filteredBuses = typeFilter ? buses.filter(b => b.type === typeFilter) : buses;

  const totalBuses = buses.length;
  const activeBuses = buses.filter(b => b.status === 'active').length;
  const maintenanceBuses = buses.filter(b => b.status === 'maintenance').length;

  const getTypeLabel = (type) => {
    const labels = { normal: 'Normal', semi_luxury: 'Semi Luxury', luxury: 'Luxury', ac: 'AC' };
    return labels[type] || type;
  };

  const getTypeStyle = (type) => {
    const map = {
      normal: { color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.06)' },
      semi_luxury: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
      luxury: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
      ac: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    };
    return map[type] || map.normal;
  };

  const getStatusStyle = (status) => {
    const map = {
      active: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      inactive: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      maintenance: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    };
    return map[status] || map.active;
  };

  const columns = [
    { key: 'bus_number', label: 'Bus No.', render: (row) => <span style={{fontWeight:700,color:'#06b6d4',fontFamily:'monospace',fontSize:'13px'}}>{row.bus_number}</span> },
    { key: 'name', label: 'Name', accessor: 'name', render: (row) => <span style={{fontWeight:600,color:'#fff'}}>{row.name}</span> },
    { key: 'type', label: 'Type', render: (row) => {
      const st = getTypeStyle(row.type);
      return <span style={{display:'inline-flex',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,color:st.color,background:st.bg}}>{getTypeLabel(row.type)}</span>;
    }},
    { key: 'total_seats', label: 'Seats', accessor: 'total_seats', align: 'center' },
    { key: 'seat_layout', label: 'Layout', accessor: 'seat_layout' },
    { key: 'amenities', label: 'Amenities', render: (row) => (
      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
        {(row.amenities || []).slice(0, 3).map((a, i) => (
          <span key={i} style={{padding:'2px 8px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',fontSize:'11px',color:'rgba(255,255,255,0.5)'}}>{a}</span>
        ))}
        {(row.amenities || []).length > 3 && <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>+{row.amenities.length - 3}</span>}
      </div>
    ), sortable: false},
    { key: 'status', label: 'Status', render: (row) => {
      const st = getStatusStyle(row.status);
      return <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,color:st.color,background:st.bg,textTransform:'capitalize'}}>{row.status}</span>;
    }},
  ];

  return (
    <div className={styles.page}>
      {successMsg && <div className={styles.successAlert}>{successMsg}</div>}
      {error && <div className={styles.errorAlert}>{error} <button onClick={() => setError(null)}>×</button></div>}

      <div className={styles.statsGrid}>
        <StatsCard icon={<DirectionsBusIcon />} label="Total Buses" value={totalBuses} gradient="cyan" />
        <StatsCard icon={<CheckCircleIcon />} label="Active" value={activeBuses} gradient="green" />
        <StatsCard icon={<BuildIcon />} label="Maintenance" value={maintenanceBuses} gradient="orange" />
      </div>

      <DataTable
        columns={columns}
        data={filteredBuses}
        loading={loading}
        searchPlaceholder="Search buses..."
        emptyMessage="No buses found"
        emptySubMessage="Create a new bus to get started"
        headerActions={
          <Link href="/admin/buses/create" className={styles.addBtn} style={{textDecoration:'none'}}>
            <AddIcon /> Add Bus
          </Link>
        }
        filters={
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#fff',fontSize:'13px',fontFamily:'inherit',cursor:'pointer'}}
          >
            <option value="">All Types</option>
            <option value="normal">Normal</option>
            <option value="semi_luxury">Semi Luxury</option>
            <option value="luxury">Luxury</option>
            <option value="ac">AC</option>
          </select>
        }
        actions={(row) => (
          <>
            <Link href={`/admin/buses/${row.id}`}><button className={styles.actionBtn} title="Edit"><EditIcon /></button></Link>
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setDeleteConfirm(row)} title="Delete"><DeleteIcon /></button>
          </>
        )}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <>
          <div className={styles.overlay} onClick={() => setDeleteConfirm(null)} />
          <div className={styles.modal}>
            <h3>Delete Bus</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.bus_number})? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={styles.deleteBtnLg} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BusManagementPage;
