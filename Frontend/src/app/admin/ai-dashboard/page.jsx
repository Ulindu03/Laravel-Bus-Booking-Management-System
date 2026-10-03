'use client';

import React, { useState, useEffect } from 'react';
import { aiService } from '@/app/api/aiService';
import StatsCard from '@/components/admin/StatsCard';
import styles from './aiDashboard.module.css';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function AIDashboardPage() {
    const [health, setHealth] = useState(null);
    const [patterns, setPatterns] = useState(null);
    const [healthLoading, setHealthLoading] = useState(true);
    const [patternsLoading, setPatternsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setHealthLoading(true);
        setPatternsLoading(true);

        // Load health and patterns independently — don't block on each other
        aiService.getHealthStatus()
            .then(res => { if (res.success) setHealth(res.data); })
            .catch(() => {})
            .finally(() => setHealthLoading(false));

        aiService.getPatternInsights()
            .then(res => { if (res.success) setPatterns(res.data); })
            .catch(() => {})
            .finally(() => setPatternsLoading(false));
    };

    // Show the dashboard immediately — no full-page loading blocker

    return (
        <div className={styles.dashboard}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.pageTitle}>
                        <SmartToyIcon className={styles.titleIcon} />
                        AI / ML Dashboard
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Monitor AI system health, demand predictions, and passenger insights
                    </p>
                </div>
                <button className={styles.refreshBtn} onClick={fetchDashboardData}>
                    Refresh Data
                </button>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <StatsCard
                    icon={<SmartToyIcon />}
                    label="Ollama Status"
                    value={healthLoading ? 'Loading...' : (health?.ollama?.online ? 'Online' : 'Offline')}
                    gradient={health?.ollama?.online ? 'green' : 'orange'}
                    subtitle={healthLoading ? 'Checking connection...' : (health?.ollama?.model_available ? `Model: ${health?.config?.ollama_model}` : 'Model not loaded')}
                />
                <StatsCard
                    icon={<TrendingUpIcon />}
                    label="Demand Model"
                    value={healthLoading ? 'Loading...' : (health?.ml_model?.demand_model ? 'Active' : 'Not Trained')}
                    gradient={health?.ml_model?.demand_model ? 'cyan' : 'orange'}
                    subtitle="XGBoost demand prediction"
                />
                <StatsCard
                    icon={<GroupsIcon />}
                    label="Passengers Analyzed"
                    value={patternsLoading ? 'Loading...' : (patterns?.total_passengers_analyzed || 0)}
                    gradient="purple"
                    subtitle={patternsLoading ? 'Analyzing DB...' : `Source: ${patterns?.source || 'N/A'}`}
                />
                <StatsCard
                    icon={<SpeedIcon />}
                    label="Clustering Model"
                    value={healthLoading ? 'Loading...' : (health?.ml_model?.clustering_model ? 'Active' : 'Not Trained')}
                    gradient={health?.ml_model?.clustering_model ? 'blue' : 'orange'}
                    subtitle="K-Means passenger patterns"
                />
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {['overview', 'clusters', 'system'].map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.overviewGrid}>
                        {patternsLoading && <div className={styles.loadingSpinner} style={{ gridColumn: '1 / -1', margin: '2rem auto' }} />}
                        
                        {/* Booking Statistics */}
                        {!patternsLoading && patterns?.statistics?.by_hour && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>📊 Bookings by Hour</h3>
                                <div className={styles.barChart}>
                                    {Object.entries(patterns.statistics.by_hour).map(([hour, data]) => {
                                        const maxCount = Math.max(...Object.values(patterns.statistics.by_hour).map(d => d.booking_count));
                                        const heightPct = (data.booking_count / maxCount) * 100;
                                        return (
                                            <div key={hour} className={styles.barCol}>
                                                <div
                                                    className={styles.bar}
                                                    style={{ height: `${heightPct}%` }}
                                                    title={`${data.booking_count} bookings`}
                                                />
                                                <span className={styles.barLabel}>{hour}h</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {!patternsLoading && patterns?.statistics?.by_day_of_week && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>📅 Bookings by Day</h3>
                                <div className={styles.dayChart}>
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                                        const dayData = patterns.statistics.by_day_of_week[idx + 1];
                                        const maxCount = Math.max(...Object.values(patterns.statistics.by_day_of_week).map(d => d.booking_count));
                                        const widthPct = dayData ? (dayData.booking_count / maxCount) * 100 : 0;
                                        return (
                                            <div key={day} className={styles.dayRow}>
                                                <span className={styles.dayLabel}>{day}</span>
                                                <div className={styles.dayBarTrack}>
                                                    <div
                                                        className={styles.dayBar}
                                                        style={{ width: `${widthPct}%` }}
                                                    />
                                                </div>
                                                <span className={styles.dayCount}>{dayData?.booking_count || 0}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {!patternsLoading && patterns?.statistics?.advance_booking && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>⏰ Advance Booking Pattern</h3>
                                <div className={styles.advanceList}>
                                    {Object.entries(patterns.statistics.advance_booking).map(([category, data]) => {
                                        const labels = {
                                            same_day: 'Same Day',
                                            '1_2_days': '1-2 Days',
                                            '3_7_days': '3-7 Days',
                                            over_7_days: '7+ Days'
                                        };
                                        return (
                                            <div key={category} className={styles.advanceItem}>
                                                <span className={styles.advanceLabel}>{labels[category] || category}</span>
                                                <span className={styles.advanceCount}>{data.booking_count} bookings</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'clusters' && (
                    <div className={styles.clusterGrid}>
                        {patternsLoading && <div className={styles.loadingSpinner} style={{ gridColumn: '1 / -1', margin: '2rem auto' }} />}
                        {!patternsLoading && patterns?.clusters?.map((cluster, idx) => (
                            <div key={idx} className={styles.clusterCard}>
                                <div className={styles.clusterHeader}>
                                    <span className={styles.clusterEmoji}>
                                        {idx === 0 ? '🏢' : idx === 1 ? '🏖️' : idx === 2 ? '🎉' : '⚡'}
                                    </span>
                                    <div className={styles.clusterInfo}>
                                        <h3 className={styles.clusterName}>{cluster.name}</h3>
                                        <span className={styles.clusterPct}>
                                            {cluster.estimated_percentage}% of passengers
                                        </span>
                                    </div>
                                </div>
                                <p className={styles.clusterDesc}>{cluster.description}</p>
                                {cluster.characteristics && (
                                    <div className={styles.characteristics}>
                                        {Object.entries(cluster.characteristics).map(([key, val]) => (
                                            <div key={key} className={styles.charItem}>
                                                <span className={styles.charKey}>
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                                <span className={styles.charVal}>{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className={styles.systemGrid}>
                        {healthLoading && <div className={styles.loadingSpinner} style={{ gridColumn: '1 / -1', margin: '2rem auto' }} />}
                        
                        {/* Ollama Status */}
                        {!healthLoading && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>🤖 Ollama (Local LLM)</h3>
                            <div className={styles.statusList}>
                                <div className={styles.statusRow}>
                                    <span>Server Status</span>
                                    <span className={`${styles.statusBadge} ${health?.ollama?.online ? styles.statusOnline : styles.statusOffline}`}>
                                        {health?.ollama?.online ? (
                                            <><CheckCircleIcon style={{ fontSize: 16 }} /> Online</>
                                        ) : (
                                            <><ErrorIcon style={{ fontSize: 16 }} /> Offline</>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.statusRow}>
                                    <span>Model</span>
                                    <span className={styles.statusValue}>{health?.config?.ollama_model || 'N/A'}</span>
                                </div>
                                <div className={styles.statusRow}>
                                    <span>Model Available</span>
                                    <span className={`${styles.statusBadge} ${health?.ollama?.model_available ? styles.statusOnline : styles.statusOffline}`}>
                                        {health?.ollama?.model_available ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className={styles.statusRow}>
                                    <span>Host</span>
                                    <span className={styles.statusValue}>{health?.config?.ollama_host || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* ML Models Status */}
                        {!healthLoading && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>📦 ML Models</h3>
                            <div className={styles.statusList}>
                                <div className={styles.statusRow}>
                                    <span>Demand Model (XGBoost)</span>
                                    <span className={`${styles.statusBadge} ${health?.ml_model?.demand_model ? styles.statusOnline : styles.statusOffline}`}>
                                        {health?.ml_model?.demand_model ? 'Loaded' : 'Not Found'}
                                    </span>
                                </div>
                                <div className={styles.statusRow}>
                                    <span>Clustering Model (K-Means)</span>
                                    <span className={`${styles.statusBadge} ${health?.ml_model?.clustering_model ? styles.statusOnline : styles.statusOffline}`}>
                                        {health?.ml_model?.clustering_model ? 'Loaded' : 'Not Found'}
                                    </span>
                                </div>
                                <div className={styles.statusRow}>
                                    <span>Python Path</span>
                                    <span className={styles.statusValue}>{health?.config?.python_path || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Quick Actions */}
                        {!healthLoading && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>⚡ Quick Info</h3>
                            <div className={styles.infoList}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>💡</span>
                                    <div>
                                        <strong>Ollama not running?</strong>
                                        <p>Run <code>ollama serve</code> in terminal, then <code>ollama pull llama3.2</code></p>
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoIcon}>📊</span>
                                    <div>
                                        <strong>Retrain models?</strong>
                                        <p>Run <code>python ML/scripts/train_demand_model.py</code></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
