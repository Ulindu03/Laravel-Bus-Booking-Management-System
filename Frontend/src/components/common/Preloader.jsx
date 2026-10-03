'use client';

import { useState, useEffect } from 'react';
import styles from './Preloader.module.css';

// SVG Assets strictly styled as line-art #22a5ff on #eef6fc spotlight
const BusSvg = () => (
    <svg width="150" height="60" viewBox="0 0 150 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Body with slight blue tint matching background so it overlaps trees cleanly */}
        <path d="M 10 45 L 8 45 L 8 20 Q 8 10 18 10 L 115 10 Q 125 10 128 15 L 132 30 Q 135 40 130 45 L 125 45" stroke="#22a5ff" strokeWidth="2.5" strokeLinejoin="round" fill="#eef6fc"/>
        
        {/* Back glass & Passenger Windows */}
        <path d="M 12 25 L 28 25 L 28 35 L 12 35 Z" stroke="#22a5ff" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="33" y="25" width="14" height="12" rx="2" stroke="#22a5ff" strokeWidth="2"/>
        <rect x="52" y="25" width="14" height="12" rx="2" stroke="#22a5ff" strokeWidth="2"/>
        <rect x="71" y="25" width="14" height="12" rx="2" stroke="#22a5ff" strokeWidth="2"/>
        <rect x="90" y="25" width="14" height="12" rx="2" stroke="#22a5ff" strokeWidth="2"/>
        
        {/* Front Door */}
        <rect x="109" y="20" width="12" height="25" rx="2" stroke="#22a5ff" strokeWidth="2"/>
        
        {/* Windshield */}
        <path d="M 126 23 L 131 23 Q 133 28 133 35 L 126 35 Z" stroke="#22a5ff" strokeWidth="2" strokeLinejoin="round"/>
        
        {/* Mirror */}
        <path d="M 134 26 L 140 26 L 140 32" stroke="#22a5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Bottom Chassis Details (Simulating chassis over road) */}
        <line x1="15" y1="45" x2="33" y2="45" stroke="#22a5ff" strokeWidth="2.5"/>
        <line x1="53" y1="45" x2="98" y2="45" stroke="#22a5ff" strokeWidth="2.5"/>
        
        {/* Tail light */}
        <line x1="8" y1="36" x2="8" y2="42" stroke="#22a5ff" strokeWidth="3" strokeLinecap="round"/>

        {/* Wheels */}
        <circle cx="43" cy="45" r="8" fill="#eef6fc" stroke="#22a5ff" strokeWidth="2.5"/>
        <circle cx="43" cy="45" r="3" fill="none" stroke="#22a5ff" strokeWidth="2"/>
        
        <circle cx="108" cy="45" r="8" fill="#eef6fc" stroke="#22a5ff" strokeWidth="2.5"/>
        <circle cx="108" cy="45" r="3" fill="none" stroke="#22a5ff" strokeWidth="2"/>
    </svg>
);

const TreeSvg = ({ scale = 1 }) => (
    <svg width={40 * scale} height={60 * scale} viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Trunk */}
        <path d="M 20 60 L 20 30" stroke="#22a5ff" strokeWidth="3" strokeLinecap="round"/>
        {/* Leaves */}
        <path d="M 20 10 C 5 10, 0 25, 10 30 C 0 35, 10 50, 20 45 C 30 50, 40 35, 30 30 C 40 25, 35 10, 20 10 Z" fill="#eef6fc" stroke="#22a5ff" strokeWidth="3" strokeLinejoin="round"/>
    </svg>
);

export default function Preloader() {
    const [loading, setLoading] = useState(true);
    const [fade, setFade] = useState(false);

    useEffect(() => {
        // Wait 2.2s before fading out for a premium unhurried feel
        const timer = setTimeout(() => {
            setFade(true);
            setTimeout(() => setLoading(false), 500); // 500ms transition time
        }, 2200);

        return () => clearTimeout(timer);
    }, []);

    if (!loading) return null;

    return (
        <div className={`${styles.preloader} ${fade ? styles.fadeOut : ''}`}>
            <div className={styles.scene}>
                {/* Background Spotlight Masked */}
                <div className={styles.spotlight}>
                    <div className={styles.treeAnim} style={{ animationDelay: '0s' }}>
                        <TreeSvg />
                    </div>
                    <div className={styles.treeAnim} style={{ animationDelay: '1.1s' }}>
                        <TreeSvg scale={0.7} />
                    </div>
                </div>

                {/* Road Line (Extends beyond the spotlight) */}
                <div className={styles.roadLine}></div>
                <div className={`${styles.roadDash} ${styles.roadDash1}`}></div>
                <div className={`${styles.roadDash} ${styles.roadDash2}`}></div>

                {/* Bouncing Bus sitting on road */}
                <div className={styles.busWrap}>
                    <BusSvg />
                </div>
            </div>

            <div className={styles.loadingText}>
                Loading Serendib Go
                <span className={styles.dots}><span>.</span><span>.</span><span>.</span></span>
            </div>
        </div>
    );
}
