'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import StatsCard from '@/components/admin/StatsCard';
import adminService from '@/app/api/adminService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import RouteIcon from '@mui/icons-material/Route';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventIcon from '@mui/icons-material/Event';

import Link from 'next/link';

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className={styles.tooltipValue} style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'revenue' ? `LKR ${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Fallback mock data
        setStats({
          stats: {
            total_buses: 24,
            active_buses: 18,
            maintenance_buses: 3,
            total_routes: 15,
            active_routes: 12,
            total_schedules: 56,
            upcoming_schedules: 23,
            total_users: 342,
            new_users_this_month: 28,
          },
          revenue_data: [
            { date: 'May 29', revenue: 45000, bookings: 18 },
            { date: 'May 30', revenue: 52000, bookings: 22 },
            { date: 'May 31', revenue: 38000, bookings: 15 },
            { date: 'Jun 01', revenue: 61000, bookings: 28 },
            { date: 'Jun 02', revenue: 55000, bookings: 24 },
            { date: 'Jun 03', revenue: 72000, bookings: 32 },
            { date: 'Jun 04', revenue: 48000, bookings: 20 },
          ],
          popular_routes: [
            { name: 'Colombo → Kandy', bookings: 145 },
            { name: 'Colombo → Galle', bookings: 120 },
            { name: 'Kandy → Nuwara Eliya', bookings: 98 },
            { name: 'Colombo → Jaffna', bookings: 76 },
            { name: 'Matara → Colombo', bookings: 64 },
          ],
          recent_activity: [
            { id: 1, type: 'schedule', message: 'New schedule: Luxury Express on Colombo–Kandy', time: new Date().toISOString() },
            { id: 2, type: 'user', message: 'New user registered: Kasun Perera', time: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, type: 'schedule', message: 'Schedule completed: Morning AC on Galle Route', time: new Date(Date.now() - 7200000).toISOString() },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loader} />
      </div>
    );
  }

  // Extract stats from API response
  // API returns: { success, data: { stats, revenue_data, popular_routes, recent_activity } }
  // adminService returns response.data → { success, data: {...} }
  // setStats(response.data) → stats = { stats: {...}, revenue_data: [...], ... }
  const s = stats?.stats || {};

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <h2 className={styles.welcomeTitle}>Welcome back, Admin! 👋</h2>
          <p className={styles.welcomeSub}>Here&apos;s what&apos;s happening with Serendib Go today.</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link href="/admin/buses/create" className={styles.quickAction}>
            <AddIcon /> Add Bus
          </Link>
          <Link href="/admin/routes" className={styles.quickAction}>
            <AddIcon /> Add Route
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          icon={<DirectionsBusIcon />}
          label="Total Buses"
          value={s.total_buses || 0}
          trend="up"
          trendValue="+3"
          gradient="cyan"
          subtitle={`${s.active_buses || 0} active · ${s.maintenance_buses || 0} maintenance`}
        />
        <StatsCard
          icon={<RouteIcon />}
          label="Total Routes"
          value={s.total_routes || 0}
          trend="up"
          trendValue="+2"
          gradient="purple"
          subtitle={`${s.active_routes || 0} active routes`}
        />
        <StatsCard
          icon={<ScheduleIcon />}
          label="Schedules"
          value={s.total_schedules || 0}
          trend="up"
          trendValue="+8"
          gradient="green"
          subtitle={`${s.upcoming_schedules || 0} upcoming`}
        />
        <StatsCard
          icon={<PeopleIcon />}
          label="Total Users"
          value={s.total_users || 0}
          trend="up"
          trendValue={`+${s.new_users_this_month || 0}`}
          gradient="orange"
          subtitle={`${s.new_users_this_month || 0} new this month`}
        />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Revenue Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Revenue Overview</h3>
              <p className={styles.chartSub}>Last 7 days performance</p>
            </div>
            <div className={styles.chartBadge}>
              <TrendingUpIcon /> +12.5%
            </div>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats?.revenue_data || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fill="url(#revenueGradient)" name="revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Daily Bookings</h3>
              <p className={styles.chartSub}>Booking trend this week</p>
            </div>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats?.revenue_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bookings" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        {/* Popular Routes */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Popular Routes</h3>
              <p className={styles.chartSub}>Most booked routes</p>
            </div>
          </div>
          <div className={styles.routesList}>
            {(stats?.popular_routes || []).map((route, i) => {
              const maxBookings = stats?.popular_routes?.[0]?.bookings || 1;
              const pct = (route.bookings / maxBookings) * 100;
              return (
                <div key={i} className={styles.routeItem}>
                  <div className={styles.routeRank}>#{i + 1}</div>
                  <div className={styles.routeInfo}>
                    <span className={styles.routeName}>{route.name}</span>
                    <div className={styles.routeBarWrap}>
                      <div
                        className={styles.routeBar}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={styles.routeCount}>{route.bookings}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Recent Activity</h3>
              <p className={styles.chartSub}>Latest platform events</p>
            </div>
          </div>
          <div className={styles.activityList}>
            {(stats?.recent_activity || []).map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={`${styles.activityDot} ${activity.type === 'user' ? styles.dotUser : styles.dotSchedule}`} />
                <div className={styles.activityContent}>
                  <p className={styles.activityMsg}>{activity.message}</p>
                  <span className={styles.activityTime}>
                    {new Date(activity.time).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>
            ))}
            {(stats?.recent_activity || []).length === 0 && (
              <div className={styles.noActivity}>
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Quick Actions</h3>
              <p className={styles.chartSub}>Common tasks</p>
            </div>
          </div>
          <div className={styles.quickActionGrid}>
            <Link href="/admin/buses/create" className={styles.quickActionCard}>
              <div className={`${styles.qaIcon} ${styles.qaCyan}`}><DirectionsBusIcon /></div>
              <span>Add Bus</span>
            </Link>
            <Link href="/admin/routes" className={styles.quickActionCard}>
              <div className={`${styles.qaIcon} ${styles.qaPurple}`}><RouteIcon /></div>
              <span>New Route</span>
            </Link>
            <Link href="/admin/schedules" className={styles.quickActionCard}>
              <div className={`${styles.qaIcon} ${styles.qaGreen}`}><EventIcon /></div>
              <span>New Schedule</span>
            </Link>
            <Link href="/admin/users" className={styles.quickActionCard}>
              <div className={`${styles.qaIcon} ${styles.qaOrange}`}><PersonAddIcon /></div>
              <span>Manage Users</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
