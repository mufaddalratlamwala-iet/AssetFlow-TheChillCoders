import React, { useState, useEffect, useRef, useCallback } from 'react';

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

    // AI Extraction State
    const [aiFile, setAiFile] = useState(null);
    const [aiExtracting, setAiExtracting] = useState(false);
    const [aiResult, setAiResult] = useState(null); // raw AI response
    const [aiError, setAiError] = useState(null);
    const [aiFilledFields, setAiFilledFields] = useState(new Set()); // track which fields were AI-filled
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const AI_API_URL = 'https://smell-collide-handbag.ngrok-free.dev';
    const API_BASE_URL = 'http://localhost:5000/api';
    const isWriteAuthorized = user?.role === 'Admin' || user?.role === 'Asset Manager';

    // --- AI Extraction Logic ---
    const matchCategoryByName = useCallback((estimatedCategory) => {
        if (!estimatedCategory || categories.length === 0) return '';
        const lower = estimatedCategory.toLowerCase();
        // Try exact match first, then partial/fuzzy
        const exact = categories.find(c => c.name.toLowerCase() === lower);
        if (exact) return exact._id;
        const partial = categories.find(c => 
            c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
        );
        return partial ? partial._id : '';
    }, [categories]);

    const handleAiExtract = async (file) => {
        if (!file) return;
        setAiFile(file);
        setAiExtracting(true);
        setAiError(null);
        setAiResult(null);
        setAiFilledFields(new Set());

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${AI_API_URL}/ai/registration/extract`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errBody = await res.text();
                throw new Error(errBody || `AI service returned ${res.status}`);
            }

            const data = await res.json();
            setAiResult(data);

            // Map AI response fields → form fields, tracking which ones were filled
            const filled = new Set();
            const updates = {};

            if (data.product_name || data.asset_name) {
                const name = data.product_name || data.asset_name;
                // Combine brand + model if product_name is generic
                const fullName = data.brand && data.model 
                    ? `${data.brand} ${data.model}` 
                    : name;
                updates.name = fullName;
                filled.add('name');
            }
            if (data.serial_number) {
                updates.serialNumber = data.serial_number;
                filled.add('serialNumber');
            }
            if (data.purchase_date) {
                updates.acquisitionDate = data.purchase_date; // expected YYYY-MM-DD
                filled.add('acquisitionDate');
            }
            if (data.cost != null || data.purchase_cost != null) {
                updates.acquisitionCost = String(data.cost ?? data.purchase_cost);
                filled.add('acquisitionCost');
            }
            if (data.estimated_category) {
                const matchedId = matchCategoryByName(data.estimated_category);
                if (matchedId) {
                    updates.categoryId = matchedId;
                    filled.add('categoryId');
                }
            }
            if (data.vendor) {
                // Store vendor info in documentUrls as contextual note
                updates.documentUrls = regForm.documentUrls 
                    ? `${regForm.documentUrls}, Vendor: ${data.vendor}` 
                    : `Vendor: ${data.vendor}`;
                filled.add('documentUrls');
            }

            setRegForm(prev => ({ ...prev, ...updates }));
            setAiFilledFields(filled);

        } catch (err) {
            console.error('AI extraction error:', err);
            setAiError(err.message || 'Failed to connect to AI extraction service');
        }
        setAiExtracting(false);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleAiExtract(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) handleAiExtract(file);
    };

    const clearAiState = () => {
        setAiFile(null);
        setAiResult(null);
        setAiError(null);
        setAiFilledFields(new Set());
        setAiExtracting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Helper to render an AI-fill indicator badge next to a field
    const AiFillBadge = ({ field }) => {
        if (!aiFilledFields.has(field)) return null;
        return (
            <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-[9px] font-bold uppercase border border-violet-500/25 animate-pulse" title="Auto-filled by AI">
                <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                AI
            </span>
        );
    };

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
                clearAiState();
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

            {/* Asset Registration Modal — AI Enhanced */}
            {isRegModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-surface-container p-6 border-b border-outline-variant flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h3 className="font-headline text-xl font-bold">Register New Resource</h3>
                                {aiResult && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-[10px] font-bold border border-violet-500/25">
                                        <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                                        AI Assisted
                                    </span>
                                )}
                            </div>
                            <button onClick={() => { setIsRegModalOpen(false); clearAiState(); }} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleRegisterSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 custom-scrollbar">

                            {/* --- AI Upload Zone --- */}
                            <div 
                                className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
                                    isDragOver 
                                        ? 'border-violet-500 bg-violet-500/10 scale-[1.01]' 
                                        : aiResult 
                                            ? 'border-emerald-500/40 bg-emerald-500/5' 
                                            : aiError 
                                                ? 'border-rose-500/40 bg-rose-500/5'
                                                : 'border-outline-variant hover:border-violet-500/50 hover:bg-violet-500/5'
                                }`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleFileDrop}
                            >
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                {aiExtracting ? (
                                    /* Extracting State */
                                    <div className="flex flex-col items-center justify-center py-6 px-4">
                                        <div className="relative mb-3">
                                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500/30 border-t-violet-500"></div>
                                            <span className="material-symbols-outlined text-violet-400 text-[18px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">auto_awesome</span>
                                        </div>
                                        <p className="text-sm font-semibold text-violet-400">AI is analyzing your document...</p>
                                        <p className="text-[11px] text-on-surface-variant mt-1">{aiFile?.name}</p>
                                    </div>
                                ) : aiResult ? (
                                    /* Success State */
                                    <div className="flex items-center justify-between py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-emerald-400">Fields extracted successfully</p>
                                                <p className="text-[11px] text-on-surface-variant">{aiFile?.name} · Confidence: {Math.round((aiResult.confidence || 0) * 100)}%</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Confidence meter */}
                                            <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden" title={`${Math.round((aiResult.confidence || 0) * 100)}% confidence`}>
                                                <div 
                                                    className={`h-full rounded-full transition-all ${
                                                        (aiResult.confidence || 0) >= 0.8 ? 'bg-emerald-500' : 
                                                        (aiResult.confidence || 0) >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${Math.round((aiResult.confidence || 0) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => { clearAiState(); }}
                                                className="text-xs text-on-surface-variant hover:text-rose-400 transition-colors cursor-pointer font-semibold"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                ) : aiError ? (
                                    /* Error State */
                                    <div className="flex items-center justify-between py-4 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-rose-400 text-[20px]">error</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-rose-400">Extraction failed</p>
                                                <p className="text-[11px] text-on-surface-variant max-w-sm truncate">{aiError}</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => { clearAiState(); fileInputRef.current?.click(); }}
                                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer font-bold"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : (
                                    /* Default Upload State */
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex flex-col items-center justify-center py-6 px-4 cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all">
                                            <span className="material-symbols-outlined text-violet-400 text-[28px]">auto_awesome</span>
                                        </div>
                                        <p className="text-sm font-bold text-on-surface">Auto-fill with AI</p>
                                        <p className="text-[11px] text-on-surface-variant mt-1">
                                            Drag & drop an invoice, receipt, or asset photo — or <span className="text-violet-400 font-semibold">browse files</span>
                                        </p>
                                        <p className="text-[10px] text-on-surface-variant/60 mt-1.5">Supports PDF, JPG, PNG · Max 10 MB</p>
                                    </button>
                                )}
                            </div>

                            {/* --- Needs Review Warning Banner --- */}
                            {aiResult?.needs_review && (
                                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                                    <span className="material-symbols-outlined text-amber-400 text-[20px] mt-0.5 shrink-0">warning</span>
                                    <div>
                                        <p className="text-xs font-bold text-amber-400">Review required</p>
                                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                                            The AI confidence is low or some core fields could not be extracted. Please verify all auto-filled values before saving.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- Form Fields with AI Badge indicators --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center text-xs font-semibold text-on-surface-variant mb-1">
                                        Asset Name*
                                        <AiFillBadge field="name" />
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className={`w-full bg-surface-variant border rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary ${aiFilledFields.has('name') ? 'border-violet-500/40' : 'border-outline-variant'}`}
                                        placeholder="e.g. MacBook Pro 16"
                                        value={regForm.name}
                                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center text-xs font-semibold text-on-surface-variant mb-1">
                                        Asset Category
                                        <AiFillBadge field="categoryId" />
                                        {aiResult?.estimated_category && !aiFilledFields.has('categoryId') && (
                                            <span className="ml-1.5 text-[9px] text-amber-400 font-normal" title="AI suggested this category but no match was found in your system">
                                                (AI suggested: {aiResult.estimated_category})
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        className={`w-full bg-surface-variant border rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary cursor-pointer ${aiFilledFields.has('categoryId') ? 'border-violet-500/40' : 'border-outline-variant'}`}
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
                                    <label className="flex items-center text-xs font-semibold text-on-surface-variant mb-1">
                                        Serial Number
                                        <AiFillBadge field="serialNumber" />
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full bg-surface-variant border rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary ${aiFilledFields.has('serialNumber') ? 'border-violet-500/40' : 'border-outline-variant'}`}
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
                                    <label className="flex items-center text-xs font-semibold text-on-surface-variant mb-1">
                                        Acquisition Date
                                        <AiFillBadge field="acquisitionDate" />
                                    </label>
                                    <input
                                        type="date"
                                        className={`w-full bg-surface-variant border rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary ${aiFilledFields.has('acquisitionDate') ? 'border-violet-500/40' : 'border-outline-variant'}`}
                                        value={regForm.acquisitionDate}
                                        onChange={(e) => setRegForm({ ...regForm, acquisitionDate: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center text-xs font-semibold text-on-surface-variant mb-1">
                                        Acquisition Cost ($)
                                        <AiFillBadge field="acquisitionCost" />
                                    </label>
                                    <input
                                        type="number"
                                        className={`w-full bg-surface-variant border rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary ${aiFilledFields.has('acquisitionCost') ? 'border-violet-500/40' : 'border-outline-variant'}`}
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
                                <label className="flex items-center text-xs font-semibold text-on-surface-variant mb-1">
                                    Document URLs / Vendor Info
                                    <AiFillBadge field="documentUrls" />
                                </label>
                                <input
                                    type="text"
                                    className={`w-full bg-surface-variant border rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary ${aiFilledFields.has('documentUrls') ? 'border-violet-500/40' : 'border-outline-variant'}`}
                                    placeholder="e.g. http://manuals.com/doc1.pdf, http://invoice.com/inv.pdf"
                                    value={regForm.documentUrls}
                                    onChange={(e) => setRegForm({ ...regForm, documentUrls: e.target.value })}
                                />
                            </div>

                            {/* AI Extraction Details — collapsible raw data section */}
                            {aiResult && (
                                <details className="rounded-lg border border-outline-variant overflow-hidden group">
                                    <summary className="flex items-center gap-2 px-4 py-2.5 bg-surface-container/40 cursor-pointer text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors select-none">
                                        <span className="material-symbols-outlined text-[16px] text-violet-400">data_object</span>
                                        Raw AI Extraction Data
                                        <span className="material-symbols-outlined text-[16px] ml-auto group-open:rotate-180 transition-transform">expand_more</span>
                                    </summary>
                                    <div className="px-4 py-3 bg-surface-variant/30 text-[11px] font-mono text-on-surface-variant overflow-x-auto">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(aiResult, null, 2)}</pre>
                                    </div>
                                </details>
                            )}

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
                                <button type="button" onClick={() => { setIsRegModalOpen(false); clearAiState(); }} className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant font-medium cursor-pointer">Cancel</button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:brightness-110 shadow-md shadow-primary/20 cursor-pointer">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AssetDirectory;
