import React, { useState, useEffect } from 'react';

const AuditScreen = ({ user }) => {
  const [cycles, setCycles] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Cycle Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newCycle, setNewCycle] = useState({
    scopeDepartmentId: '',
    scopeLocation: '',
    dateRangeStart: '',
    dateRangeEnd: ''
  });

  // Assign Auditor State
  const [selectedAuditor, setSelectedAuditor] = useState('');

  const isAdminOrManager = ['Enterprise Admin', 'Asset Manager'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [cyclesRes, assetsRes, empRes] = await Promise.all([
        fetch('http://localhost:5000/api/audit-cycles', { headers }),
        fetch('http://localhost:5000/api/assets', { headers }),
        fetch('http://localhost:5000/api/employees', { headers })
      ]);

      if (cyclesRes.ok) {
        const data = await cyclesRes.json();
        setCycles(data.cycles || []);
      }
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data.assets || []);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Error fetching audit data:", err);
    }
    setLoading(false);
  };

  const handleCreateCycle = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/audit-cycles', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCycle)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Cycle created successfully!");
        setIsCreating(false);
        fetchData(); // Refresh list
      } else {
        alert(data.error || "Failed to create cycle");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating cycle");
    }
  };

  const handleAssignAuditor = async () => {
    if (!selectedAuditor || !selectedCycle) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/audit-cycles/${selectedCycle._id}/auditors`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auditorIds: [selectedAuditor] })
      });
      if (res.ok) {
        alert("Auditor assigned!");
        fetchData();
        setSelectedCycle(prev => ({ ...prev, auditorIds: [...prev.auditorIds, selectedAuditor] }));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to assign auditor");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyItem = async (assetId, verification) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/audit-items', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auditCycleId: selectedCycle._id,
          assetId,
          verification,
          notes: ''
        })
      });
      if (res.ok) {
        alert(`Marked as ${verification}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to verify item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseCycle = async () => {
    if (!window.confirm("Are you sure you want to close this audit cycle? Missing items will be marked as Lost.")) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/audit-cycles/${selectedCycle._id}/close`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Audit cycle closed successfully.");
        fetchData();
        setSelectedCycle(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to close cycle");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIAnalyze = async () => {
    // Stub for AI Analysis
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/ai/audit/summarize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ auditCycleId: selectedCycle._id })
      });
      if (res.ok) {
        const data = await res.json();
        alert("AI Summary: " + data.summary);
      } else {
        alert("AI endpoint not implemented yet.");
      }
    } catch (err) {
      alert("AI endpoint not implemented yet.");
    }
  };

  return (
    <div className="ml-[260px] flex-1 bg-white text-slate-900 overflow-y-auto w-full h-full p-8 font-body">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-headline tracking-tight">Asset Audit</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Physical verification and compliance tracking.
          </p>
        </div>
        {isAdminOrManager && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Audit Cycle
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Cycles List */}
          <div className="col-span-4 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Audit Cycles</h2>
            {cycles.length === 0 ? (
              <p className="text-slate-500 text-sm">No audit cycles found.</p>
            ) : (
              <div className="space-y-3">
                {cycles.map(cycle => (
                  <div 
                    key={cycle._id}
                    onClick={() => { setSelectedCycle(cycle); setIsCreating(false); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCycle?._id === cycle._id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {new Date(cycle.dateRangeStart).toLocaleDateString()} - {new Date(cycle.dateRangeEnd).toLocaleDateString()}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cycle.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {cycle.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Scope: {cycle.scopeLocation || 'All Locations'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Cycle Details / Create Form */}
          <div className="col-span-8">
            {isCreating ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Create New Audit Cycle</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                    <input 
                      type="date" 
                      value={newCycle.dateRangeStart}
                      onChange={e => setNewCycle({...newCycle, dateRangeStart: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                    <input 
                      type="date" 
                      value={newCycle.dateRangeEnd}
                      onChange={e => setNewCycle({...newCycle, dateRangeEnd: e.target.value})}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scope Location (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Server Room A"
                    value={newCycle.scopeLocation}
                    onChange={e => setNewCycle({...newCycle, scopeLocation: e.target.value})}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsCreating(false)} className="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={handleCreateCycle} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors">Create Cycle</button>
                </div>
              </div>
            ) : selectedCycle ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Cycle Details</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Status: {selectedCycle.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAIAnalyze} className="px-4 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      AI Summary
                    </button>
                    {isAdminOrManager && selectedCycle.status === 'Open' && (
                      <button onClick={handleCloseCycle} className="px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        Close Cycle
                      </button>
                    )}
                  </div>
                </div>

                {selectedCycle.status === 'Open' ? (
                  <div className="p-6">
                    {/* Auditor Assignment */}
                    {isAdminOrManager && (
                      <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Assign Auditors</h4>
                        <div className="flex gap-3">
                          <select 
                            value={selectedAuditor}
                            onChange={(e) => setSelectedAuditor(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none"
                          >
                            <option value="">Select Employee...</option>
                            {employees.map(emp => (
                              <option key={emp._id} value={emp._id}>{emp.name}</option>
                            ))}
                          </select>
                          <button onClick={handleAssignAuditor} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Assign</button>
                        </div>
                      </div>
                    )}

                    {/* Asset Checklist */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Asset Checklist</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {assets.filter(a => !selectedCycle.scopeLocation || a.location === selectedCycle.scopeLocation).map(asset => (
                              <tr key={asset._id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3">
                                  <p className="text-sm font-bold text-slate-800">{asset.name}</p>
                                  <p className="text-xs text-slate-500">{asset.assetTag}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => handleVerifyItem(asset._id, 'Verified')} className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition-colors">Verified</button>
                                    <button onClick={() => handleVerifyItem(asset._id, 'Missing')} className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-bold transition-colors">Missing</button>
                                    <button onClick={() => handleVerifyItem(asset._id, 'Damaged')} className="px-3 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded text-xs font-bold transition-colors">Damaged</button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Discrepancy Report</h4>
                    <p className="text-sm text-slate-500 mb-4">Cycle is closed. View the discrepancy report below or use the AI Summary button above.</p>
                    {/* Discrepancy report could be fetched via GET /api/audit-cycles/:id/discrepancy-report, 
                        but for simplicity we just instruct the user it's closed. */}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">fact_check</span>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Select an Audit Cycle</h3>
                <p className="text-sm text-slate-500 max-w-sm">Choose an audit cycle from the list to view its details or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditScreen;
