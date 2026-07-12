import React, { useState, useEffect } from 'react';

const OrganizationSetup = ({ user }) => {
    const [activeTab, setActiveTab] = useState('departments');
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', headEmployeeId: '', customFields: '' });

    const API_BASE_URL = 'http://localhost:5000/api';

    const fetchAll = async () => {
        setLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [deptRes, catRes, empRes] = await Promise.all([
                fetch(`${API_BASE_URL}/departments`, { headers }),
                fetch(`${API_BASE_URL}/asset-categories`, { headers }),
                fetch(`${API_BASE_URL}/employees`, { headers })
            ]);

            if (deptRes.ok) {
                const data = await deptRes.json();
                setDepartments(data.departments);
            }
            if (catRes.ok) {
                const data = await catRes.json();
                setCategories(data.categories);
            }
            if (empRes.ok) {
                const data = await empRes.json();
                setEmployees(data.employees);
            }
        } catch (error) {
            console.error("Failed to fetch organization data", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const endpoint = activeTab === 'departments' ? `${API_BASE_URL}/departments` : `${API_BASE_URL}/asset-categories`;
        
        let payload = {};
        if (activeTab === 'departments') {
            payload = { name: addForm.name, headEmployeeId: addForm.headEmployeeId || null };
        } else {
            payload = { name: addForm.name };
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setAddForm({ name: '', headEmployeeId: '', customFields: '' });
                fetchAll();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to create');
            }
        } catch (error) {
            console.error("Error creating entity", error);
        }
    };

    const handleRoleUpdate = async (employeeId, newRole) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/employees/${employeeId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                fetchAll();
            }
        } catch (error) {
            console.error("Error updating role", error);
        }
    };

    const TabButton = ({ id, label, icon }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`pb-4 px-2 font-semibold transition-all flex items-center gap-2 border-b-2 ${
                    isActive 
                    ? 'text-primary border-primary' 
                    : 'text-on-surface-variant border-transparent hover:text-on-surface font-medium'
                }`}
            >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                {label}
            </button>
        );
    };

    return (
        <>
            <main className="ml-[260px] flex-1 flex flex-col h-screen relative bg-background">
            {/* Top Navigation Bar */}
            <header className="h-16 flex justify-between items-center px-8 w-full border-b border-outline-variant bg-surface z-40">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                        <input className="bg-surface-variant border border-outline-variant rounded-lg pl-10 pr-12 py-1 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-all w-64 group-hover:w-80" placeholder="Search organization..." type="text"/>
                    </div>
                </div>
            </header>

                {/* Content Canvas */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Header Section */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="font-headline text-3xl text-on-surface tracking-tight mb-1 font-semibold">Organization Setup</h2>
                            <p className="text-on-surface-variant">Configure administrative hierarchy, departments, and global asset classifications.</p>
                        </div>
                        <div className="flex gap-4">
                            {(activeTab === 'departments' || activeTab === 'categories') && (
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-6 py-2 rounded-lg bg-primary text-white font-semibold flex items-center gap-2 shadow-md shadow-primary/20 hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    Add Entity
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="flex gap-8 border-b border-outline-variant mb-6">
                        <TabButton id="departments" label="Departments" icon="hub" />
                        <TabButton id="categories" label="Asset Categories" icon="category" />
                        <TabButton id="employees" label="Employee Directory" icon="group" />
                    </div>

                    {/* Bento Grid Content */}
                    <div className="grid grid-cols-12 gap-6 h-fit">
                        {/* Main Table Container */}
                        <div className="col-span-12 lg:col-span-9 bg-surface rounded-xl overflow-hidden border border-outline-variant shadow-sm flex flex-col">
                            <div className="bg-surface-container p-6 border-b border-outline-variant flex justify-between items-center">
                                <h3 className="font-headline text-xl text-on-surface font-semibold">
                                    {activeTab === 'departments' && 'Department Structure'}
                                    {activeTab === 'categories' && 'Asset Classifications'}
                                    {activeTab === 'employees' && 'Authorized Directory'}
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-variant px-4 py-1 rounded uppercase">
                                        {activeTab === 'departments' && departments.length}
                                        {activeTab === 'categories' && categories.length}
                                        {activeTab === 'employees' && employees.length} Entries
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                {loading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            {activeTab === 'departments' && (
                                                <tr className="border-b border-outline-variant text-on-surface-variant text-[13px] bg-surface-container">
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">Department Name</th>
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">Head of Dept</th>
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">Status</th>
                                                </tr>
                                            )}
                                            {activeTab === 'categories' && (
                                                <tr className="border-b border-outline-variant text-on-surface-variant text-[13px] bg-surface-container">
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">Asset Class</th>
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">Created</th>
                                                </tr>
                                            )}
                                            {activeTab === 'employees' && (
                                                <tr className="border-b border-outline-variant text-on-surface-variant text-[13px] bg-surface-container">
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">User</th>
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider">Role</th>
                                                    <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                                                </tr>
                                            )}
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant bg-surface">
                                            {activeTab === 'departments' && departments.map(dept => (
                                                <tr key={dept._id} className="hover:bg-surface-variant transition-colors group">
                                                    <td className="py-4 px-6 font-semibold text-on-surface">{dept.name}</td>
                                                    <td className="py-4 px-6 text-on-surface-variant">{dept.headEmployeeId ? dept.headEmployeeId.name : 'Unassigned'}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-medium">{dept.status}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {activeTab === 'categories' && categories.map(cat => (
                                                <tr key={cat._id} className="hover:bg-surface-variant transition-colors group">
                                                    <td className="py-4 px-6 font-semibold text-on-surface">{cat.name}</td>
                                                    <td className="py-4 px-6 text-on-surface-variant">{new Date(cat.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {activeTab === 'employees' && employees.map(emp => (
                                                <tr key={emp._id} className="hover:bg-surface-variant transition-colors group">
                                                    <td className="py-4 px-6 flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded bg-surface-variant overflow-hidden shrink-0 border border-outline-variant flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-on-surface">{emp.name}</p>
                                                            <p className="text-[11px] text-on-surface-variant">{emp.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-on-surface-variant">
                                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-medium">{emp.role}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <select 
                                                            className="bg-surface-variant border border-outline-variant rounded px-2 py-1 text-sm outline-none focus:border-primary"
                                                            value={emp.role}
                                                            onChange={(e) => handleRoleUpdate(emp._id, e.target.value)}
                                                        >
                                                            <option value="Employee">Employee</option>
                                                            <option value="Department Head">Department Head</option>
                                                            <option value="Asset Manager">Asset Manager</option>
                                                            <option value="Admin">Admin</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Secondary Info Cards */}
                        <div className="col-span-12 lg:col-span-3 space-y-6">
                            <div className="bg-surface rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-on-surface">Quick Stats</h4>
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[11px] mb-1">
                                            <span className="text-on-surface-variant">Total Departments</span>
                                            <span className="text-primary font-bold">{departments.length}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] mb-1">
                                            <span className="text-on-surface-variant">Total Categories</span>
                                            <span className="text-secondary font-bold">{categories.length}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] mb-1">
                                            <span className="text-on-surface-variant">Active Employees</span>
                                            <span className="text-emerald-400 font-bold">{employees.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-headline text-xl font-semibold">
                                Add {activeTab === 'departments' ? 'Department' : 'Asset Category'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-on-surface-variant mb-1">Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                                />
                            </div>
                            {activeTab === 'departments' && (
                                <div>
                                    <label className="block text-sm font-medium text-on-surface-variant mb-1">Department Head</label>
                                    <select 
                                        className="w-full bg-surface-variant border border-outline-variant rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary"
                                        value={addForm.headEmployeeId}
                                        onChange={(e) => setAddForm({...addForm, headEmployeeId: e.target.value})}
                                    >
                                        <option value="">-- None --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-variant font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:brightness-110 shadow-md shadow-primary/20">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrganizationSetup;
