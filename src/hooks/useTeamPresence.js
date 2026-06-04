// Frontend/frontend/admin/src/hooks/useTeamPresence.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import socketService from '../services/SocketService';
import { TEAM_MEMBERS } from '../constants/users';

export function useTeamPresence(user, roomId = 'global') {
    // presenceMap: email -> { status, isOnline, updatedAt, name, isSyncing }
    const [presenceMap, setPresenceMap] = useState({});
    const [isSynced, setIsSynced] = useState(false);

    // Initial hydration from static roster
    useEffect(() => {
        const initialMap = {};
        TEAM_MEMBERS.forEach(m => {
            const email = m.email.toLowerCase().trim();
            initialMap[email] = {
                email,
                name: m.name,
                status: 'offline',
                isOnline: false,
                updatedAt: new Date(0),
                isSyncing: true
            };
        });
        setPresenceMap(initialMap);
    }, []);

    const handleMessage = useCallback((data) => {
        const { type, payload } = data;

        switch (type) {
            case 'socket:connected':
                setIsSynced(true);
                // Subscribe with full roster of emails to track
                socketService.send({
                    type: 'presence:subscribe',
                    payload: { 
                        roomId, 
                        user: { id: user.uid, email: user.email, name: user.name },
                        emails: TEAM_MEMBERS.map(m => m.email)
                    }
                });
                break;

            case 'socket:disconnected':
                setIsSynced(false);
                break;

            case 'presence:snapshot':
                setPresenceMap(prev => {
                    const next = { ...prev };
                    payload.members.forEach(m => {
                        const email = m.email.toLowerCase().trim();
                        next[email] = {
                            ...next[email],
                            status: m.status || 'offline',
                            isOnline: m.isOnline,
                            name: m.name || next[email]?.name,
                            updatedAt: new Date(m.updatedAt || 0),
                            isSyncing: false
                        };
                    });
                    return next;
                });
                break;

            case 'presence:member:updated':
                setPresenceMap(prev => {
                    const email = payload.email.toLowerCase().trim();
                    const existing = prev[email];
                    
                    // Prevent stale updates if we have a newer local state
                    const newTime = new Date(payload.updatedAt).getTime();
                    if (existing && !existing.isSyncing && new Date(existing.updatedAt).getTime() > newTime) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [email]: {
                            ...existing,
                            ...payload,
                            updatedAt: new Date(payload.updatedAt),
                            isSyncing: false
                        }
                    };
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
                payload: { 
                    roomId, 
                    user: { id: user.uid, email: user.email, name: user.name },
                    emails: TEAM_MEMBERS.map(m => m.email)
                }
            });
        }

        return () => unsubscribe();
    }, [user, roomId, handleMessage]);

    // Helper to update current user's status
    const updateMyStatus = useCallback((newStatus) => {
        const email = user.email.toLowerCase().trim();
        
        // Optimistic update
        setPresenceMap(prev => ({
            ...prev,
            [email]: {
                ...prev[email],
                status: newStatus,
                updatedAt: new Date(),
                isOnline: true,
                isSyncing: false
            }
        }));

        socketService.send({
            type: 'presence:status:set',
            payload: { status: newStatus, roomId }
        });

        localStorage.setItem('mkavs_staff_status', newStatus);
    }, [user, roomId]);

    const getMemberPresence = useCallback((email) => {
        return presenceMap[email.toLowerCase().trim()] || { status: 'offline', isOnline: false, isSyncing: true };
    }, [presenceMap]);

    return {
        presenceMap,
        isSynced,
        updateMyStatus,
        getMemberPresence
    };
}
