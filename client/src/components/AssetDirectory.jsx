import React, { useState, useEffect } from 'react';

const AssetDirectory = ({ user }) => {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
    
    // Filters state
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    // Detail/Edit Modal
    const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // Register Modal
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [regForm, setRegForm] = useState({
        name: '',
        categoryId: '',
        serialNumber: '',
        qrCode: '',
        acquisitionDate: '',
        acquisitionCost: '',
        condition: 'New',
        location: '',
        isBookable: false,
        status: 'Available',
        photoUrl: '',
        documentUrls: ''
    });

    const API_BASE_URL = 'http://localhost:5000/api';
    const isWriteAuthorized = user?.role === 'Admin' || user?.role === 'Asset Manager';

    // Fetch lists
    const fetchAssets = async () => {
        setLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Construct query parameters
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedStatus) params.append('status', selectedStatus);
        if (selectedLocation) params.append('location', selectedLocation);

        try {
            const res = await fetch(`${API_BASE_URL}/assets?${params.toString()}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setAssets(data.assets);
            }
        } catch (error) {
            console.error("Failed to fetch assets", error);
        }
        setLoading(false);
    };

    const fetchDropdowns = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [catRes, deptRes] = await Promise.all([
                fetch(`${API_BASE_URL}/asset-categories`, { headers }),
                fetch(`${API_BASE_URL}/departments`, { headers })
            ]);
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData.categories);
            }
            if (deptRes.ok) {
                const deptData = await deptRes.json();
                setDepartments(deptData.departments);
            }
        } catch (error) {
            console.error("Failed to fetch filters data", error);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [search, selectedCategory, selectedStatus, selectedLocation]);

    useEffect(() => {
        fetchDropdowns();
    }, []);

    // Handle Registration Submit
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const payload = {
            ...regForm,
            acquisitionCost: regForm.acquisitionCost ? Number(regForm.acquisitionCost) : 0,
            categoryId: regForm.categoryId || null,
            acquisitionDate: regForm.acquisitionDate || null,
            documentUrls: regForm.documentUrls ? regForm.documentUrls.split(',').map(url => url.trim()) : []
        };

        try {
            const res = await fetch(`${API_BASE_URL}/assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsRegModalOpen(false);
                setRegForm({
                    name: '',
                    categoryId: '',
                    serialNumber: '',
                    qrCode: '',
                    acquisitionDate: '',
                    acquisitionCost: '',
                    condition: 'New',
                    location: '',
                    isBookable: false,
                    status: 'Available',
                    photoUrl: '',
                    documentUrls: ''
                });
                fetchAssets();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to register asset');
            }
        } catch (error) {
            console.error("Error creating asset", error);
        }
    };

    // Open detail modal and fetch histories
    const handleOpenDetail = async (assetId) => {
        setDetailLoading(true);
        setIsDetailModalOpen(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const res = await fetch(`${API_BASE_URL}/assets/${assetId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setSelectedAssetDetail(data);
            }
        } catch (error) {
            console.error("Failed to fetch asset details", error);
        }
        setDetailLoading(false);
    };

    // Update asset status
    const handleStatusUpdate = async (assetId, newStatus) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/assets/${assetId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Refresh detail and list
                handleOpenDetail(assetId);
                fetchAssets();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to update status');
            }
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    // Status classes helper
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Available':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Allocated':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Reserved':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'Under Maintenance':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Lost':
            case 'Retired':
            case 'Disposed':
            default:
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        }
    };

    return (
        <main className="ml-[260px] flex-1 flex flex-col h-screen relative bg-background">
            {/* Top Header */}
            <header className="h-16 flex justify-between items-center px-8 w-full border-b border-outline-variant bg-surface z-40">
                <div className="flex items-center gap-6 flex-1 max-w-xl">
                    <div className="relative w-full group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                        <input
                            type="text"
                            className="bg-surface-variant border border-outline-variant rounded-lg pl-10 pr-12 py-1 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all w-full"
                            placeholder="Search assets by name, tag, or serial..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {isWriteAuthorized && (
                        <button
                            onClick={() => setIsRegModalOpen(true)}
                            className="bg-primary hover:bg-primary/95 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95 text-sm cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>New Asset</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Content Canvas */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {/* Header title & Grid/Table Toggle */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="font-headline text-3xl text-on-surface tracking-tight mb-1 font-semibold">Asset Directory</h2>
                        <p className="text-on-surface-variant">Manage, view, and track hardware classifications and resource allocations.</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {/* Grid/Table Toggle */}
                        <div className="flex bg-surface-variant p-1 rounded-lg border border-outline-variant">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'table' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">table_rows</span>
                                Table
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'grid' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                                Grid
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase">Category</label>
                        <select
                            className="bg-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase">Status</label>
                        <select
                            className="bg-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Allocated">Allocated</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Lost">Lost</option>
                            <option value="Retired">Retired</option>
                            <option value="Disposed">Disposed</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase">Location</label>
                        <input
                            type="text"
                            className="bg-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface outline-none focus:border-primary"
                            placeholder="Filter by location..."
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Views Container */}
                {loading ? (
                    <div className="flex items-center justify-center min-h-[300px]">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="bg-surface border border-outline-variant rounded-xl p-12 text-center">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-3">inventory_2</span>
                        <p className="text-on-surface font-semibold">No assets found</p>
                        <p className="text-on-surface-variant text-sm mt-1">Try refining your filters or register a new asset.</p>
                    </div>
                ) : viewMode === 'table' ? (
                    // TABLE VIEW
                    <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-surface-container border-b border-outline-variant">
                                    <tr className="text-on-surface-variant text-[13px]">
                                        <th className="py-4 px-6 font-semibold uppercase tracking-wider">Asset Tag</th>
                                        <th className="py-4 px-6 font-semibold uppercase tracking-wider">Asset Name</th>
                                        <th className="py-4 px-6 font-semibold uppercase tracking-wider">Category</th>
                                        <th className="py-4 px-6 font-semibold uppercase tracking-wider">Status</th>
                                        <th className="py-4 px-6 font-semibold uppercase tracking-wider">Location</th>
                                        <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant">
                                    {assets.map(asset => (
                                        <tr key={asset._id} className="hover:bg-surface-variant/50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">{asset.assetTag}</span>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-on-surface">{asset.name}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 bg-surface-variant rounded-md text-xs font-semibold text-on-surface-variant">{asset.categoryId?.name || 'Unassigned'}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusStyle(asset.status)}`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-on-surface-variant text-sm">{asset.location || 'N/A'}</td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleOpenDetail(asset._id)}
                                                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 text-xs font-bold cursor-pointer transition-all"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // GRID VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {assets.map(asset => (
                            <div key={asset._id} className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:border-primary/45 transition-all flex flex-col justify-between p-6">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">{asset.assetTag}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(asset.status)}`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <h3 className="font-headline text-lg font-bold text-on-surface mb-1">{asset.name}</h3>
                                    <p className="text-xs text-on-surface-variant mb-4">Category: <span className="font-semibold">{asset.categoryId?.name || 'Unassigned'}</span></p>
                                    
                                    <div className="space-y-2 text-xs text-on-surface-variant">
                                        {asset.serialNumber && <p>SN: <span className="text-on-surface font-mono">{asset.serialNumber}</span></p>}
                                        {asset.location && <p>Location: <span className="text-on-surface">{asset.location}</span></p>}
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-outline-variant flex justify-end">
                                    <button
                                        onClick={() => handleOpenDetail(asset._id)}
                                        className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Asset Detail & History Modal */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-surface-container p-6 border-b border-outline-variant flex justify-between items-center">
                            <div>
                                <h3 className="font-headline text-xl font-bold flex items-center gap-3">
                                    {selectedAssetDetail?.asset?.name}
                                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                                        {selectedAssetDetail?.asset?.assetTag}
                                    </span>
                                </h3>
                                <p className="text-xs text-on-surface-variant mt-1">Classification: {selectedAssetDetail?.asset?.categoryId?.name || 'Unassigned'}</p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        {detailLoading ? (
                            <div className="flex items-center justify-center p-12 flex-1">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="overflow-y-auto p-6 space-y-6 flex-1 custom-scrollbar">
                                {/* Specs Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container/40 p-4 rounded-xl border border-outline-variant">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Serial Number</p>
                                        <p className="text-sm font-semibold text-on-surface font-mono">{selectedAssetDetail?.asset?.serialNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Location</p>
                                        <p className="text-sm font-semibold text-on-surface">{selectedAssetDetail?.asset?.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Condition</p>
                                        <p className="text-sm font-semibold text-on-surface">{selectedAssetDetail?.asset?.condition || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Acquisition Cost</p>
                                        <p className="text-sm font-semibold text-on-surface">${selectedAssetDetail?.asset?.acquisitionCost || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Acquisition Date</p>
                                        <p className="text-sm font-semibold text-on-surface">
                                            {selectedAssetDetail?.asset?.acquisitionDate ? new Date(selectedAssetDetail.asset.acquisitionDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Bookable (Reservable)</p>
                                        <p className="text-sm font-semibold text-on-surface">{selectedAssetDetail?.asset?.isBookable ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>

                                {/* Status Update and details */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-outline-variant">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-on-surface-variant">Current Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 border ${getStatusStyle(selectedAssetDetail?.asset?.status)}`}>
                                            {selectedAssetDetail?.asset?.status}
                                        </span>
                                    </div>

                                    {isWriteAuthorized && (
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Update Status</label>
                                            <select
                                                className="bg-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                                                value={selectedAssetDetail?.asset?.status}
                                                onChange={(e) => handleStatusUpdate(selectedAssetDetail.asset._id, e.target.value)}
                                            >
                                                <option value="Available">Available</option>
                                                <option value="Allocated">Allocated</option>
                                                <option value="Reserved">Reserved</option>
                                                <option value="Under Maintenance">Under Maintenance</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Retired">Retired</option>
                                                <option value="Disposed">Disposed</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Allocation History */}
                                <div className="space-y-3">
                                    <h4 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
                                        Allocation History
                                    </h4>
                                    {selectedAssetDetail?.allocationHistory?.length === 0 ? (
                                        <p className="text-xs text-on-surface-variant bg-surface-container/20 p-3 rounded border border-outline-variant italic">No allocation history recorded for this asset.</p>
                                    ) : (
                                        <div className="border border-outline-variant rounded-lg overflow-hidden">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead className="bg-surface-container text-on-surface-variant">
                                                    <tr>
                                                        <th className="py-2.5 px-4 font-semibold">Employee</th>
                                                        <th className="py-2.5 px-4 font-semibold">Department</th>
                                                        <th className="py-2.5 px-4 font-semibold">Allocated At</th>
                                                        <th className="py-2.5 px-4 font-semibold">Returned At</th>
                                                        <th className="py-2.5 px-4 font-semibold">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-outline-variant">
                                                    {selectedAssetDetail?.allocationHistory?.map(alloc => (
                                                        <tr key={alloc._id} className="hover:bg-surface-variant/30">
                                                            <td className="py-2.5 px-4 font-semibold">{alloc.employeeId?.name || 'Unknown'}</td>
                                                            <td className="py-2.5 px-4">{alloc.departmentId?.name || 'N/A'}</td>
                                                            <td className="py-2.5 px-4">{new Date(alloc.allocatedAt).toLocaleDateString()}</td>
                                                            <td className="py-2.5 px-4">{alloc.returnedAt ? new Date(alloc.returnedAt).toLocaleDateString() : 'Active'}</td>
                                                            <td className="py-2.5 px-4 font-bold uppercase">{alloc.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Maintenance History */}
                                <div className="space-y-3">
                                    <h4 className="font-headline font-bold text-on-surface text-base flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[20px]">build</span>
                                        Maintenance Logs
                                    </h4>
                                    {selectedAssetDetail?.maintenanceHistory?.length === 0 ? (
                                        <p className="text-xs text-on-surface-variant bg-surface-container/20 p-3 rounded border border-outline-variant italic">No maintenance history recorded for this asset.</p>
                                    ) : (
                                        <div className="border border-outline-variant rounded-lg overflow-hidden">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead className="bg-surface-container text-on-surface-variant">
                                                    <tr>
                                                        <th className="py-2.5 px-4 font-semibold">Issue</th>
                                                        <th className="py-2.5 px-4 font-semibold">Priority</th>
                                                        <th className="py-2.5 px-4 font-semibold">Status</th>
                                                        <th className="py-2.5 px-4 font-semibold">Raised By</th>
                                                        <th className="py-2.5 px-4 font-semibold">Resolved At</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-outline-variant">
                                                    {selectedAssetDetail?.maintenanceHistory?.map(maint => (
                                                        <tr key={maint._id} className="hover:bg-surface-variant/30">
                                                            <td className="py-2.5 px-4">{maint.issueDescription}</td>
                                                            <td className="py-2.5 px-4 font-bold">{maint.priority}</td>
                                                            <td className="py-2.5 px-4">{maint.status}</td>
                                                            <td className="py-2.5 px-4">{maint.raisedBy?.name || 'N/A'}</td>
                                                            <td className="py-2.5 px-4">{maint.resolvedAt ? new Date(maint.resolvedAt).toLocaleDateString() : 'In Progress'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Asset Registration Modal */}
            {isRegModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-surface-container p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="font-headline text-xl font-bold">Register New Resource</h3>
                            <button onClick={() => setIsRegModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleRegisterSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Asset Name*</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="e.g. MacBook Pro 16"
                                        value={regForm.name}
                                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Asset Category</label>
                                    <select
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                                        value={regForm.categoryId}
                                        onChange={(e) => setRegForm({ ...regForm, categoryId: e.target.value })}
                                    >
                                        <option value="">-- None --</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="e.g. C02X874KMD6M"
                                        value={regForm.serialNumber}
                                        onChange={(e) => setRegForm({ ...regForm, serialNumber: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">QR Code / Barcode Identifier</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="Scan or input barcode"
                                        value={regForm.qrCode}
                                        onChange={(e) => setRegForm({ ...regForm, qrCode: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Acquisition Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        value={regForm.acquisitionDate}
                                        onChange={(e) => setRegForm({ ...regForm, acquisitionDate: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Acquisition Cost ($)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="e.g. 2400"
                                        value={regForm.acquisitionCost}
                                        onChange={(e) => setRegForm({ ...regForm, acquisitionCost: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Initial Condition</label>
                                    <select
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                                        value={regForm.condition}
                                        onChange={(e) => setRegForm({ ...regForm, condition: e.target.value })}
                                    >
                                        <option value="New">New</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Poor">Poor</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">Storage / Deployment Location</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        placeholder="e.g. Office HQ, Room 402"
                                        value={regForm.location}
                                        onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Document URLs (Comma separated)</label>
                                <input
                                    type="text"
                                    className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                    placeholder="e.g. http://manuals.com/doc1.pdf, http://invoice.com/inv.pdf"
                                    value={regForm.documentUrls}
                                    onChange={(e) => setRegForm({ ...regForm, documentUrls: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isBookable"
                                    className="w-4 h-4 rounded text-primary border-outline focus:ring-primary/50"
                                    checked={regForm.isBookable}
                                    onChange={(e) => setRegForm({ ...regForm, isBookable: e.target.checked })}
                                />
                                <label htmlFor="isBookable" className="text-xs font-semibold text-on-surface cursor-pointer select-none">
                                    Allow employees to self-book / reserve this asset
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
                                <button type="button" onClick={() => setIsRegModalOpen(false)} className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:brightness-110 shadow-md shadow-primary/20">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AssetDirectory;
