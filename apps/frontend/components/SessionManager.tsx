"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SessionManager() {
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const lastUpdateRef = useRef(0);

    const checkSession = useCallback(() => {
        const lastActiveStr = localStorage.getItem("lastActive");
        const loginTimeStr = localStorage.getItem("loginTime");
        const sessionStr = localStorage.getItem("sessionConfig");

        if (!lastActiveStr || !loginTimeStr || !sessionStr) return;

        const config = JSON.parse(sessionStr);

        const lastActive = parseInt(lastActiveStr, 10);
        const now = Date.now();
        const idleTimeMinutes = (now - lastActive) / 1000 / 60;
        
        console.log(`[SessionManager] Idle for ${idleTimeMinutes.toFixed(2)}m (soft: ${config.soft}m, hard: ${config.hard}m)`);

        // Force logout at Hard Timeout
        if (idleTimeMinutes >= config.hard) {
            console.log("[SessionManager] Hard timeout reached, logging out.");
            handleLogout();
            return;
        }

        // Show warning at Soft Timeout
        if (idleTimeMinutes >= config.soft && idleTimeMinutes < config.hard) {
            setShowWarning(true);
        }
    }, []);

    const updateActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 1000) return; // Throttle updates to max 1 per second
        lastUpdateRef.current = now;

        localStorage.setItem("lastActive", now.toString());
        
        const lastRefreshStr = localStorage.getItem("lastRefresh") || "0";
        const lastRefresh = parseInt(lastRefreshStr, 10);
        
        let config = null;
        const sessionStr = localStorage.getItem("sessionConfig");
        if (sessionStr) {
            try {
                config = JSON.parse(sessionStr);
            } catch (e) {}
        }
        
        // Refresh token if it's been more than half the soft timeout since last refresh
        if (config && (now - lastRefresh) / 1000 / 60 > (config.soft / 2)) {
            refreshToken();
        }

        setShowWarning(false);
    }, []);

    const refreshToken = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.token);
                localStorage.setItem("lastRefresh", Date.now().toString());
            } else {
                handleLogout(); // Token invalid or expired
            }
        } catch (error) {
            console.error("Failed to refresh session", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastActive");
        localStorage.removeItem("loginTime");
        localStorage.removeItem("sessionConfig");
        localStorage.removeItem("lastRefresh");
        router.push("/login");
    };

    useEffect(() => {
        // Setup initial timers
        updateActivity();

        // Listen for activity
        const events = ["mousedown", "keydown", "scroll", "touchstart"];
        events.forEach(e => window.addEventListener(e, updateActivity));

        // Check session periodically
        const interval = setInterval(checkSession, 10000); // Check every 10s

        return () => {
            events.forEach(e => window.removeEventListener(e, updateActivity));
            clearInterval(interval);
        };
    }, [updateActivity, checkSession]);

    if (!showWarning) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#ffcc00',
            color: '#333',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxWidth: '300px'
        }}>
            <h4 style={{ margin: 0 }}>Session Expiring Soon</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
                You have been inactive. Your session will expire soon unless you continue working.
            </p>
            <button 
                onClick={updateActivity}
                style={{
                    background: '#333',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                }}
            >
                Stay Logged In
            </button>
        </div>
    );
}
