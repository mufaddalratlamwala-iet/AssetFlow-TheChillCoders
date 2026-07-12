import React, { useState, useEffect } from 'react';

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Alerts', 'Approvals', 'Bookings'
    const [searchQuery, setSearchQuery] = useState('');

    const API_BASE_URL = 'http://localhost:5000/api';

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [notifRes, logsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/notifications?limit=50`, { headers }),
                fetch(`${API_BASE_URL}/activity-logs?limit=50`, { headers })
            ]);

            if (!notifRes.ok || !logsRes.ok) {
                throw new Error('Failed to fetch operational feeds');
            }

            const notifData = await notifRes.json();
            const logsData = await logsRes.json();

            setNotifications(notifData.notifications || []);
            setLogs(logsData.logs || []);
        } catch (err) {
            console.error('Error fetching feeds:', err);
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Bind Ctrl+K / Cmd+K search shortcut
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('search-logs-input');
                if (searchInput) searchInput.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleDismiss = async (id) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                // Update local state directly
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            }
        } catch (err) {
            console.error('Failed to dismiss notification:', err);
        }
    };

    // Export feed
    const handleDownload = () => {
        const feedData = {
            notifications,
            logs,
            exportedAt: new Date().toISOString(),
            user: user?.name
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feedData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `AssetFlow_Activity_Feed_${new Date().toLocaleDateString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    // Merge notifications and activity logs into a single chronologically sorted feed
    const getMergedFeed = () => {
        const items = [];

        // Format Notifications
        notifications.forEach(n => {
            items.push({
                _id: n._id,
                type: 'notification',
                category: n.type, // e.g. 'Asset Assigned'
                message: n.message,
                createdAt: new Date(n.createdAt),
                read: n.read,
                employee: n.employeeId?.name || 'System'
            });
        });

        // Format Activity Logs
        logs.forEach(l => {
            items.push({
                _id: l._id,
                type: 'log',
                category: 'Audit',
                message: `${l.employeeId?.name || 'System'} executed ${l.action} on ${l.entityType}`,
                createdAt: new Date(l.createdAt),
                metadata: l.metadata,
                employee: l.employeeId?.name || 'System'
            });
        });

        // Sort desc
        items.sort((a, b) => b.createdAt - a.createdAt);

        // Filter based on Active Tab
        let filtered = items;
        if (activeTab === 'Alerts') {
            filtered = items.filter(item => item.type === 'notification');
        } else if (activeTab === 'Approvals') {
            filtered = items.filter(item => item.category.toLowerCase().includes('approve') || item.message.toLowerCase().includes('assign'));
        } else if (activeTab === 'Bookings') {
            filtered = items.filter(item => item.category.toLowerCase().includes('booking') || item.message.toLowerCase().includes('book'));
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.message.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.employee.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const mergedFeed = getMergedFeed();
    const activeAlertsCount = notifications.filter(n => !n.read).length;
    const pendingApprovalsCount = notifications.filter(n => n.type.toLowerCase().includes('assign') || n.type.toLowerCase().includes('request')).length;
    const bookingCount = logs.filter(l => l.entityType === 'Booking').length;

    return (
        <main className="ml-[260px] flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
            {/* Top Bar */}
            <header className="h-16 flex justify-between items-center px-8 w-full border-b border-outline-variant bg-surface z-40 sticky top-0 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="relative w-64 group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                        <input 
                            id="search-logs-input"
                            className="w-full bg-surface-variant border border-outline-variant rounded-lg py-1.5 pl-10 pr-12 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all" 
                            placeholder="Search logs..." 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-surface border border-outline-variant text-[9px] text-on-surface-variant font-semibold">⌘K</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors active:scale-95">
                        <span className="material-symbols-outlined">help_outline</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors active:scale-95">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </header>

            {/* Canvas Body */}
            <section className="flex-1 overflow-y-auto custom-scrollbar p-8 relative">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Activity &amp; Notifications</h2>
                            <p className="text-on-surface-variant mt-1">Real-time system feed and operational audit trail.</p>
                        </div>
                        <div className="flex bg-surface border border-outline-variant rounded-xl p-1 shadow-sm shrink-0">
                            {['All', 'Alerts', 'Approvals', 'Bookings'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                        activeTab === tab 
                                        ? 'bg-primary/10 text-primary shadow-sm' 
                                        : 'text-on-surface-variant hover:bg-surface-variant'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error ? (
                        <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center text-error">
                            <span className="material-symbols-outlined text-4xl mb-2">error</span>
                            <p className="font-semibold">{error}</p>
                            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-error text-white font-semibold rounded-lg hover:brightness-110">Retry</button>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-on-surface-variant">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mb-4"></div>
                            <p>Connecting to operational live stream...</p>
                        </div>
                    ) : (
                        <>
                            {/* Bento Insights */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="md:col-span-8 bg-surface border border-outline-variant rounded-xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                                    <div className="flex items-center gap-8">
                                        <div>
                                            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Active Alerts</p>
                                            <p className="text-3xl font-bold text-error leading-none">{activeAlertsCount.toString().padStart(2, '0')}</p>
                                        </div>
                                        <div className="w-px h-10 bg-outline-variant/60"></div>
                                        <div>
                                            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Pending Approvals</p>
                                            <p className="text-3xl font-bold text-primary leading-none">{pendingApprovalsCount.toString().padStart(2, '0')}</p>
                                        </div>
                                        <div className="w-px h-10 bg-outline-variant/60"></div>
                                        <div>
                                            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">Today's Bookings</p>
                                            <p className="text-3xl font-bold text-secondary leading-none">{bookingCount.toString().padStart(2, '0')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 relative z-10">
                                        <button 
                                            onClick={handleDownload}
                                            className="p-2 bg-surface border border-outline-variant rounded-lg hover:bg-surface-variant hover:text-primary transition-colors text-on-surface-variant shadow-sm cursor-pointer active:scale-95"
                                            title="Export feed log"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">download</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="md:col-span-4 bg-surface border border-outline-variant rounded-xl p-6 bg-primary/5 border-primary/20 flex flex-col justify-center shadow-sm">
                                    <div className="flex items-center gap-2 text-primary mb-1">
                                        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                                        <p className="text-xs font-bold uppercase tracking-wide">Smart Feed Active</p>
                                    </div>
                                    <p className="text-xs text-on-surface-variant leading-relaxed">Prioritizing critical server hardware alerts and urgent allocation requests.</p>
                                </div>
                            </div>

                            {/* Activity Feed */}
                            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-surface-variant/20 px-6 py-4 border-b border-outline-variant/40 flex justify-between items-center">
                                    <span className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider">System Activity Feed</span>
                                    <span className="text-xs text-on-surface-variant italic">Last updated: Just now</span>
                                </div>
                                <div className="divide-y divide-outline-variant/40">
                                    {mergedFeed.length === 0 ? (
                                        <div className="p-8 text-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-4xl opacity-50 mb-2">inbox</span>
                                            <p className="text-sm font-semibold">Feed is empty</p>
                                            <p className="text-xs mt-1">No alerts or logs fit the active criteria.</p>
                                        </div>
                                    ) : (
                                        mergedFeed.map(item => {
                                            const isNotification = item.type === 'notification';
                                            const isUnread = isNotification && !item.read;

                                            return (
                                                <div 
                                                    key={item._id} 
                                                    className={`group flex items-center px-6 py-4 hover:bg-surface-variant/20 transition-all duration-200 ${
                                                        isUnread ? 'bg-primary/5 border-l-2 border-primary' : ''
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-6 shrink-0 shadow-sm ${
                                                        isNotification 
                                                        ? 'bg-error/10 border border-error/30 text-error' 
                                                        : 'bg-primary/10 border border-primary/30 text-primary'
                                                    }`}>
                                                        <span className="material-symbols-outlined">
                                                            {isNotification ? 'warning' : 'fact_check'}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-bold text-on-surface truncate max-w-md">{item.message}</h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border flex items-center gap-1 ${
                                                                isNotification 
                                                                ? 'bg-error/10 border-error/20 text-error' 
                                                                : 'bg-surface-variant border-outline-variant text-on-surface-variant'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isNotification ? 'bg-error' : 'bg-on-surface-variant'}`}></span>
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs font-semibold text-on-surface-variant">Owner: <span className="text-on-surface">{item.employee}</span></p>
                                                            <div className="w-1 h-1 bg-outline-variant/80 rounded-full"></div>
                                                            <p className="text-xs text-on-surface-variant">Logged in activity registry.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                                                        <span className="text-[10px] font-bold text-on-surface-variant">
                                                            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                        {isUnread && (
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                                <button 
                                                                    onClick={() => handleDismiss(item._id)}
                                                                    className="px-3 py-1 bg-surface border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors shadow-sm cursor-pointer active:scale-95"
                                                                >
                                                                    Dismiss
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Notifications;
