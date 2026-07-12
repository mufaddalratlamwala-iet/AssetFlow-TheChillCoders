import React, { useState, useEffect } from 'react';

const AllocationScreen = () => {
  const [transferType, setTransferType] = useState('Permanent');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Hardcoded for mockup purposes since we don't have an asset selector in this UI
  const assetId = "60d5ecb54d6f831e5c8b4567"; // Replace with real asset ID later

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.employees || []);
        }
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleRequestAllocation = async () => {
    if (!selectedEmployee) {
      alert("Please select a new custodian.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:5000/api/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assetId,
          employeeId: selectedEmployee,
          expectedReturnDate: transferType === 'Temporary' ? effectiveDate : undefined,
          notes: reason
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("Allocation successful!");
        setSelectedEmployee('');
        setReason('');
      } else {
        alert("Failed to allocate: " + (data.message || data.error || 'Unknown error'));
      }
    } catch (err) {
      alert("Error submitting request.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 bg-[#f9fafb] text-slate-900 overflow-y-auto w-full h-full p-8">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-headline">Asset Allocation</h1>
          <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
            Transfer or assign custody of organizational resources. Ensure policy 
            compliance before initiating permanent transfers.
          </p>
        </div>

        {/* Conflict Banner */}
        <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 mb-8 flex gap-4">
          <div className="text-red-500 mt-0.5">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <h3 className="text-red-600 font-bold text-sm tracking-wide uppercase mb-1">Direct Reallocation Blocked</h3>
            <p className="text-slate-600 text-sm mb-3">
              Asset <span className="bg-slate-200 text-slate-800 font-mono px-1.5 py-0.5 rounded text-xs mx-1">AF-MBP-2024-001</span> 
              is currently assigned to <span className="font-semibold text-slate-900">Elena Vance</span>. 
              Standard policy requires a formal Transfer Request to maintain chain of custody.
            </p>
            <button className="text-red-500 hover:text-red-600 font-semibold text-sm flex items-center gap-1 transition-colors">
              Review Policy <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Form */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg">description</span>
                <h2 className="text-lg font-bold text-slate-800 font-headline">Transfer Details</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target Asset */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Target Asset</label>
                    <input 
                      type="text" 
                      disabled 
                      value="Apple MacBook Pro 16&quot;" 
                      className="w-full bg-slate-100 text-slate-500 text-sm rounded-lg px-4 py-2.5 border border-slate-200 cursor-not-allowed"
                    />
                  </div>

                  {/* New Custodian */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">New Custodian <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">person</span>
                      <select 
                        className="w-full bg-white text-slate-600 text-sm rounded-lg pl-9 pr-4 py-2.5 border border-slate-300 appearance-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.user?.name || emp.name || emp._id}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {/* Transfer Type */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Transfer Type</label>
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                      <button 
                        onClick={() => setTransferType('Permanent')}
                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${transferType === 'Permanent' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Permanent
                      </button>
                      <button 
                        onClick={() => setTransferType('Temporary')}
                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${transferType === 'Temporary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Temporary
                      </button>
                    </div>
                  </div>

                  {/* Effective Date */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full bg-white text-slate-600 text-sm rounded-lg px-4 py-2.5 border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Reason for Allocation</label>
                  <textarea 
                    rows="4" 
                    placeholder="Provide justification for this transfer request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-white text-slate-800 text-sm rounded-lg px-4 py-3 border border-slate-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Form Actions */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4">
                <button className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors px-4 py-2">
                  Discard Changes
                </button>
                <button 
                  onClick={handleRequestAllocation}
                  disabled={loading}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  {loading ? 'Submitting...' : 'Request Allocation'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Asset Info & History */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            
            {/* Asset Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
              {/* Pattern Background Top */}
              <div className="h-24 bg-slate-50 border-b border-slate-100 flex items-start justify-end p-4 cyber-grid">
                <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                  Status: Deployed
                </span>
              </div>
              
              {/* Icon Overlay */}
              <div className="absolute top-16 left-6 w-14 h-14 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 text-2xl">laptop_mac</span>
              </div>

              <div className="p-6 pt-10">
                <h3 className="text-lg font-bold text-slate-900 font-headline">MacBook Pro 16"</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6">SN: C02F839238 &bull; $3,499.00</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Department</span>
                    <span className="text-sm font-medium text-slate-800">Engineering</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Purchase Date</span>
                    <span className="text-sm font-medium text-slate-800">Oct 12, 2023</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Condition</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Excellent
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifecycle History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
                <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Lifecycle History</h3>
              </div>
              <div className="p-5">
                <div className="relative pl-6 border-l border-slate-200 space-y-6">
                  
                  {/* Item 1 - Current */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-rose-500 bg-white"></div>
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-rose-500 opacity-20 animate-ping"></div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Current</p>
                    <p className="text-sm font-bold text-slate-800">Assigned to Elena Vance</p>
                    <p className="text-xs text-slate-500 mt-1">Authorized by IT Admin &bull; Jan 04, 2024</p>
                  </div>

                  {/* Item 2 */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-slate-300 bg-white"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dec 15, 2023</p>
                    <p className="text-sm font-medium text-slate-700">Maintenance: Kernel Patch</p>
                    <p className="text-xs text-slate-500 mt-1">Completed by Helpdesk &bull; Ticket #8992</p>
                  </div>

                  {/* Item 3 */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-slate-300 bg-white"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Oct 12, 2023</p>
                    <p className="text-sm font-medium text-slate-700">Asset Registered</p>
                    <p className="text-xs text-slate-500 mt-1">Added to Engineering inventory</p>
                  </div>

                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
};

export default AllocationScreen;
