import React, { useState, useEffect } from 'react';

const Reports = ({ user }) => {
    const [utilizationData, setUtilizationData] = useState([]);
    const [maintenanceData, setMaintenanceData] = useState([]);
    const [deptSummaryData, setDeptSummaryData] = useState([]);
    const [bookingHeatmap, setBookingHeatmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('30days');

    const API_BASE_URL = 'http://localhost:5000/api';

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [utilRes, maintRes, deptRes, bookRes] = await Promise.all([
                fetch(`${API_BASE_URL}/reports/utilization`, { headers }),
                fetch(`${API_BASE_URL}/reports/maintenance-frequency`, { headers }),
                fetch(`${API_BASE_URL}/reports/department-summary`, { headers }),
                fetch(`${API_BASE_URL}/reports/booking-heatmap`, { headers })
            ]);

            if (!utilRes.ok || !maintRes.ok || !deptRes.ok || !bookRes.ok) {
                throw new Error("Failed to fetch reports. Please check your privileges.");
            }

            const util = await utilRes.json();
            const maint = await maintRes.json();
            const dept = await deptRes.json();
            const book = await bookRes.json();

            setUtilizationData(util.data || []);
            setMaintenanceData(maint.data || []);
            setDeptSummaryData(dept.data || []);
            setBookingHeatmap(book.data || []);
        } catch (err) {
            console.error("Error loading analytics data:", err);
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Calculate aggregated metrics
    const totalAssets = utilizationData.reduce((acc, curr) => acc + curr.count, 0);
    const allocatedCount = utilizationData.find(item => item.status === 'Allocated')?.count || 0;
    const utilizationRate = totalAssets > 0 ? ((allocatedCount / totalAssets) * 100).toFixed(1) : '0';
    
    // Total maintenance requests count
    const totalMaintenanceAlerts = maintenanceData.reduce((acc, curr) => acc + curr.count, 0);

    const handleExport = () => {
        const reportData = {
            utilization: utilizationData,
            maintenanceFrequency: maintenanceData,
            departmentSummary: deptSummaryData,
            bookingHeatmap: bookingHeatmap,
            exportedAt: new Date().toISOString(),
            exportedBy: user?.name
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `AssetFlow_Report_${new Date().toLocaleDateString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    return (
        <main className="ml-[260px] flex-1 flex flex-col h-screen relative bg-background overflow-hidden">
            {/* Top Bar */}
            <header className="h-16 flex justify-between items-center px-8 w-full border-b border-outline-variant bg-surface shrink-0 z-40">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                        <input 
                            className="bg-surface-variant border border-outline-variant rounded-lg pl-10 pr-12 py-1 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all w-64 group-hover:w-80" 
                            placeholder="Search reports..." 
                            type="text"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-1.5 bg-primary text-white font-bold rounded-lg hover:brightness-110 active:scale-95 shadow-md shadow-primary/20 transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Export Report</span>
                    </button>
                </div>
            </header>

            {/* Content Canvas */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Header Section */}
                <div className="flex justify-between items-end shrink-0">
                    <div>
                        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Reports &amp; Analytics</h2>
                        <p className="text-on-surface-variant text-xs mt-1">Real-time performance metrics and asset utilization insights.</p>
                    </div>
                    <div className="flex gap-1.5 p-1 rounded-xl bg-surface border border-outline-variant shadow-sm shrink-0">
                        <button 
                            onClick={() => setTimeframe('30days')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                timeframe === '30days' 
                                ? 'bg-primary/10 text-primary shadow-sm' 
                                : 'text-on-surface-variant hover:bg-surface-variant'
                            }`}
                        >
                            Last 30 Days
                        </button>
                        <button 
                            onClick={() => setTimeframe('quarterly')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                timeframe === 'quarterly' 
                                ? 'bg-primary/10 text-primary shadow-sm' 
                                : 'text-on-surface-variant hover:bg-surface-variant'
                            }`}
                        >
                            Quarterly
                        </button>
                        <button 
                            onClick={() => setTimeframe('annual')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                timeframe === 'annual' 
                                ? 'bg-primary/10 text-primary shadow-sm' 
                                : 'text-on-surface-variant hover:bg-surface-variant'
                            }`}
                        >
                            Annual
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center text-error">
                        <span className="material-symbols-outlined text-4xl mb-2">error</span>
                        <p className="font-semibold">{error}</p>
                        <button onClick={fetchReports} className="mt-4 px-4 py-2 bg-error text-white font-semibold rounded-lg hover:brightness-110">Retry</button>
                    </div>
                ) : loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-on-surface-variant">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mb-4"></div>
                        <p>Aggregating operational intelligence...</p>
                    </div>
                ) : (
                    <>
                        {/* Bento Grid - Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between h-32 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Assets</span>
                                    <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-on-surface leading-none">{totalAssets}</div>
                                    <div className="flex items-center gap-1 text-primary text-[10px] font-semibold mt-1">
                                        <span className="material-symbols-outlined text-[12px]">trending_up</span>
                                        <span>Active database records</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between h-32 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all"></div>
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Utilization Rate</span>
                                    <span className="material-symbols-outlined text-secondary text-[20px]">speed</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-on-surface leading-none">{utilizationRate}%</div>
                                    <div className="flex items-center gap-1 text-secondary text-[10px] font-semibold mt-1">
                                        <span className="material-symbols-outlined text-[12px]">trending_up</span>
                                        <span>Optimal target 85%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between h-32 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-all"></div>
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Maintenance Alerts</span>
                                    <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-on-surface leading-none">{totalMaintenanceAlerts}</div>
                                    <div className="flex items-center gap-1 text-error text-[10px] font-semibold mt-1">
                                        <span className="material-symbols-outlined text-[12px]">priority_high</span>
                                        <span>Pending requests</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface border border-outline-variant p-6 rounded-xl flex flex-col justify-between h-32 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">OpEx Savings</span>
                                    <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-on-surface leading-none">$14.2k</div>
                                    <div className="flex items-center gap-1 text-primary text-[10px] font-semibold mt-1">
                                        <span className="material-symbols-outlined text-[12px]">keyboard_double_arrow_up</span>
                                        <span>Efficiency gain</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visualizations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Utilization by Status (Bar Chart Concept) */}
                            <div className="md:col-span-7 bg-surface border border-outline-variant p-6 rounded-xl flex flex-col gap-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-headline text-lg font-semibold text-on-surface">Asset Breakdown by Status</h3>
                                    <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
                                </div>
                                <div className="flex-1 flex items-end justify-around gap-4 h-64 pt-6 border-b border-outline-variant/30 pb-2">
                                    {utilizationData.length === 0 ? (
                                        <p className="text-on-surface-variant text-xs mb-10">No status data aggregated</p>
                                    ) : (
                                        utilizationData.map((item, idx) => {
                                            const colors = ['bg-primary', 'bg-secondary', 'bg-status-allocated', 'bg-error', 'bg-status-maintenance'];
                                            const colorClass = colors[idx % colors.length];
                                            const percent = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0;
                                            return (
                                                <div key={item.status} className="flex flex-col items-center gap-2 group flex-1 max-w-[80px]">
                                                    <div className="w-full bg-surface-variant rounded-t-lg relative flex items-end justify-center overflow-hidden border border-outline-variant border-b-0 h-48">
                                                        <div 
                                                            className={`${colorClass} absolute bottom-0 w-full group-hover:brightness-110 transition-all`} 
                                                            style={{ height: `${percent}%` }}
                                                        ></div>
                                                        <span className="relative z-10 text-[10px] mb-1 text-white font-bold drop-shadow-md">
                                                            {item.count}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-on-surface-variant truncate w-full text-center" title={item.status}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Maintenance Trends */}
                            <div className="md:col-span-5 bg-surface border border-outline-variant p-6 rounded-xl flex flex-col gap-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-headline text-lg font-semibold text-on-surface">Maintenance Trends</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                        <span className="text-[10px] font-semibold text-on-surface-variant">Preventive</span>
                                    </div>
                                </div>
                                <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
                                    {/* Abstract Line Chart SVG */}
                                    <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 400 200">
                                        <path 
                                            className="text-primary" 
                                            d="M0,150 Q50,140 80,100 T160,110 T240,60 T320,80 T400,20" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="3"
                                        ></path>
                                        <path 
                                            className="opacity-10" 
                                            d="M0,150 Q50,140 80,100 T160,110 T240,60 T320,80 T400,20 V200 H0 Z" 
                                            fill="url(#grad1)"
                                        ></path>
                                        <defs>
                                            <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                                                <stop offset="0%" style={{ stopColor: '#ff2d78', stopOpacity: 1 }}></stop>
                                                <stop offset="100%" style={{ stopColor: '#ff2d78', stopOpacity: 0 }}></stop>
                                            </linearGradient>
                                        </defs>
                                        <circle cx="80" cy="100" fill="#ff2d78" r="4" stroke="#ffffff" strokeWidth="2"></circle>
                                        <circle cx="160" cy="110" fill="#ff2d78" r="4" stroke="#ffffff" strokeWidth="2"></circle>
                                        <circle cx="240" cy="60" fill="#ff2d78" r="4" stroke="#ffffff" strokeWidth="2"></circle>
                                        <circle cx="320" cy="80" fill="#ff2d78" r="4" stroke="#ffffff" strokeWidth="2"></circle>
                                    </svg>
                                    <div className="absolute bottom-0 w-full flex justify-between px-1 text-[9px] text-on-surface-variant font-bold tracking-wider">
                                        <span>WK 1</span>
                                        <span>WK 2</span>
                                        <span>WK 3</span>
                                        <span>WK 4</span>
                                    </div>
                                </div>
                                <div className="flex justify-between p-4 bg-surface-variant/30 rounded-lg border border-outline-variant/30">
                                    <div className="text-center">
                                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Scheduled</p>
                                        <p className="font-bold text-primary text-base">142</p>
                                    </div>
                                    <div className="text-center border-l border-r border-outline-variant/30 px-6">
                                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Emergency</p>
                                        <p className="font-bold text-error text-base">8</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">MTTR</p>
                                        <p className="font-bold text-status-allocated text-base">2.4h</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department Allocation & Booking Heatmap Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                            {/* Department Summary Table */}
                            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col justify-between">
                                <div className="px-6 py-4 bg-surface-variant/30 border-b border-outline-variant/30 flex justify-between items-center">
                                    <h4 className="font-bold text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">groups</span>
                                        <span>Active Department Allocations</span>
                                    </h4>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-surface-variant/20 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider border-b border-outline-variant/20">
                                            <tr>
                                                <th className="px-6 py-3">Department Name</th>
                                                <th className="px-6 py-3 text-right">Active Allocated Assets</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/20">
                                            {deptSummaryData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-4 text-center text-on-surface-variant text-xs">
                                                        No active allocations found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                deptSummaryData.map((dept) => (
                                                    <tr key={dept.departmentId} className="hover:bg-surface-variant/20 transition-colors">
                                                        <td className="px-6 py-4 font-semibold text-on-surface">{dept.departmentName}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-primary">{dept.count}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Booking Heatmap Matrix */}
                            <div className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">calendar_month</span>
                                        <span>Booking Hotspots Matrix</span>
                                    </h4>
                                    <span className="text-[10px] text-on-surface-variant font-medium">Day of Week vs Hour (Aggregated)</span>
                                </div>
                                <div className="flex-1 flex flex-col gap-2 justify-center">
                                    {bookingHeatmap.length === 0 ? (
                                        <p className="text-on-surface-variant text-xs text-center py-6">No booking patterns logged yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs text-on-surface-variant leading-relaxed">
                                                Top reservation time slots by day:
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {bookingHeatmap.slice(0, 6).map((slot, index) => {
                                                    const days = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                                    const dayStr = days[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`;
                                                    const hourStr = `${slot.hour.toString().padStart(2, '0')}:00`;
                                                    return (
                                                        <div key={index} className="p-3 bg-surface-variant/30 border border-outline-variant/30 rounded-lg flex flex-col justify-between hover:border-secondary/40 transition-all">
                                                            <span className="text-[10px] text-on-surface-variant uppercase font-bold">{dayStr}</span>
                                                            <span className="text-sm font-bold text-secondary mt-1">{hourStr}</span>
                                                            <span className="text-[10px] text-on-surface-variant font-medium mt-1">{slot.count} Bookings</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
};

export default Reports;
