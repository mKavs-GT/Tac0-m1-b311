// Frontend/frontend/admin/src/hooks/usePresence.js
import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/SocketService';
import { TEAM_MEMBERS } from '../constants/users';

export function usePresence(user, initialStatus = 'offline', roomId = 'global') {
    const [status, setStatus] = useState(initialStatus);
    const [teamPresence, setTeamPresence] = useState({}); // email -> { status, isOnline, updatedAt, name }
    const [isSynced, setIsSynced] = useState(false);
    const [syncCount, setSyncCount] = useState(0);
    const [error, setError] = useState(null);
    const lastUpdateRef = useRef(0);

    // Initial state: Hydrate from TEAM_MEMBERS but mark as syncing
    useEffect(() => {
        const initial = {};
        TEAM_MEMBERS.forEach(m => {
            const email = m.email.toLowerCase().trim();
            initial[email] = {
                status: 'offline',
                isOnline: false,
                name: m.name,
                updatedAt: new Date(0),
                isSyncing: true
            };
        });
        setTeamPresence(initial);
    }, []);

    const handleMessage = useCallback((data) => {
        const { type, payload } = data;

        switch (type) {
            case 'socket:connected':
                setIsSynced(true);
                // Subscribe to room presence
                socketService.send({
                    type: 'presence:subscribe',
                    payload: { roomId, user: { id: user.uid, email: user.email, name: user.name } }
                });
                break;

            case 'socket:disconnected':
                setIsSynced(false);
                break;

            case 'presence:snapshot':
                const { members } = payload;
                setTeamPresence(prev => {
                    const next = { ...prev };
                    members.forEach(m => {
                        const email = m.email.toLowerCase().trim();
                        next[email] = {
                            status: m.status || 'offline',
                            isOnline: m.isOnline,
                            name: m.name,
                            updatedAt: new Date(m.updatedAt),
                            isSyncing: false
                        };
                    });
                    return next;
                });
                setSyncCount(members.filter(m => m.isOnline).length);
                break;

            case 'presence:status:updated':
                setTeamPresence(prev => {
                    const email = payload.email.toLowerCase().trim();
                    const existing = prev[email];
                    
                    // Prevent stale updates
                    const newTime = new Date(payload.updatedAt).getTime();
                    if (existing && !existing.isSyncing && new Date(existing.updatedAt).getTime() > newTime) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [email]: {
                            ...(existing || {}),
                            status: payload.status,
                            updatedAt: payload.updatedAt,
                            isSyncing: false
                        }
                    };
                });
                break;

            case 'presence:connection:update':
                setTeamPresence(prev => {
                    const email = payload.email.toLowerCase().trim();
                    const existing = prev[email];
                    if (!existing) return prev;

                    return {
                        ...prev,
                        [email]: {
                            ...existing,
                            isOnline: payload.connectionStatus === 'online'
                        }
                    };
                });
                // Update sync count based on online users
                setTeamPresence(current => {
                    const onlineCount = Object.values(current).filter(v => v.isOnline).length;
                    setSyncCount(onlineCount);
                    return current;
                });
                break;
        }
    }, [user, roomId]);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = socketService.subscribe(handleMessage);
        socketService.connect();

        // If already connected, subscribe immediately
        if (socketService.ws && socketService.ws.readyState === WebSocket.OPEN) {
            socketService.send({
                type: 'presence:subscribe',
                payload: { roomId, user: { id: user.uid, email: user.email, name: user.name } }
            });
        }

        return () => {
            unsubscribe();
        };
    }, [user, roomId, handleMessage]);

    const updateStatus = useCallback((newStatus) => {
        if (newStatus === status) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < 500) return;
        lastUpdateRef.current = now;

        // Optimistic UI update for the local user
        setStatus(newStatus);
        
        // Update local teamPresence entry optimistically
        const email = user.email.toLowerCase().trim();
        setTeamPresence(prev => ({
            ...prev,
            [email]: {
                ...(prev[email] || {}),
                status: newStatus,
                updatedAt: new Date(),
                isOnline: true
            }
        }));

        // Send to server
        socketService.send({
            type: 'presence:status:set',
            payload: { status: newStatus, roomId }
        });

        localStorage.setItem('mkavs_staff_status', newStatus);
    }, [status, roomId, user]);

    return {
        status,
        teamPresence,
        isSynced,
        syncCount,
        error,
        updateStatus
    };
}
