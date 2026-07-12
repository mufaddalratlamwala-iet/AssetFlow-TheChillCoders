import React, { useState, useEffect } from 'react';

const BookingScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    resourceAssetId: '',
    startTime: '09:00',
    endTime: '10:00'
  });

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // 1. Fetch assets (filter by bookable if your API supports it, else fetch all)
      const assetRes = await fetch('http://localhost:5000/api/assets', { headers });
      let fetchedAssets = [];
      if (assetRes.ok) {
        const assetData = await assetRes.json();
        // Fallback to all assets if isBookable isn't explicitly used
        fetchedAssets = assetData.assets || [];
        // Optional: filter to just Conference Rooms / Shared equipment
        // fetchedAssets = fetchedAssets.filter(a => a.isBookable || a.category === 'Room');
        setAssets(fetchedAssets);
        if (fetchedAssets.length > 0) {
          setSelectedAsset(fetchedAssets[0]);
          if (!newBooking.resourceAssetId) {
            setNewBooking(prev => ({ ...prev, resourceAssetId: fetchedAssets[0]._id }));
          }
        }
      }

      // 2. Fetch bookings for this date
      const bookingRes = await fetch(`http://localhost:5000/api/bookings?date=${currentDate}`, { headers });
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBookings(bookingData || []);
      }
    } catch (err) {
      console.error("Failed to fetch booking data", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const handleCreateBooking = async () => {
    if (!newBooking.resourceAssetId) {
      alert("Please select a resource");
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Combine date and time
    const startDateTime = new Date(`${currentDate}T${newBooking.startTime}:00`).toISOString();
    const endDateTime = new Date(`${currentDate}T${newBooking.endTime}:00`).toISOString();

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceAssetId: newBooking.resourceAssetId,
          startTime: startDateTime,
          endTime: endDateTime
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Booking created successfully!");
        fetchData(); // Refresh timeline
      } else {
        alert("Booking failed: " + (data.error || data.message));
      }
    } catch (err) {
      alert("Error creating booking");
      console.error(err);
    }
  };

  // Helper to calculate left margin and width based on time string (e.g. "09:00" to "10:30")
  const getTimelineStyle = (startISO, endISO) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    
    // Baseline is 8 AM for our UI (can be adjusted)
    const startHour = start.getHours() + (start.getMinutes() / 60);
    const endHour = end.getHours() + (end.getMinutes() / 60);
    
    // UI displays 8:00 AM to 6:00 PM (10 hours total)
    // 10 hours = 100% width, so 1 hour = 10%
    const leftPercent = Math.max(0, (startHour - 8) * 10);
    const widthPercent = Math.min(100 - leftPercent, (endHour - startHour) * 10);
    
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      position: 'absolute'
    };
  };

  const renderTimelineBlocks = (assetId) => {
    const assetBookings = bookings.filter(b => b.resourceAssetId === assetId || (b.resourceAssetId && b.resourceAssetId._id === assetId));
    
    return assetBookings.map(booking => {
      const style = getTimelineStyle(booking.startTime, booking.endTime);
      return (
        <div 
          key={booking._id}
          className="h-10 bg-blue-100 border border-blue-300 rounded-md text-xs text-blue-800 flex items-center px-2 shadow-sm overflow-hidden z-10"
          style={style}
          title={`${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}`}
        >
          <span className="truncate font-semibold">{booking.bookedBy?.name || 'Booked'}</span>
        </div>
      );
    });
  };

  return (
    <div className="flex-1 bg-white text-slate-900 overflow-y-auto w-full h-full p-8 font-body">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-headline tracking-tight">Resource Booking</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Manage infrastructure, conference rooms, and technical labs.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200">
            <button className="px-5 py-1.5 text-sm font-bold bg-white text-slate-800 rounded-full shadow-sm">Timeline</button>
            <button className="px-5 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-full">Calendar</button>
          </div>
          <button className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            New Booking
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 px-4 text-sm font-bold text-slate-700">
            <span className="material-symbols-outlined text-rose-500 text-sm">calendar_month</span>
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="border-none bg-transparent outline-none cursor-pointer"
            />
          </div>
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        
        <button 
          onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
          className="text-rose-500 font-bold text-sm tracking-wide"
        >
          Today
        </button>
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter By Category:</span>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none appearance-none cursor-pointer">
            <option>All Resources</option>
            <option>Rooms</option>
            <option>Equipment</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Timeline Grid */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Timeline Header (Hours) */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 py-3 pl-[240px] relative">
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
              <div key={hour} className="flex-1 text-center text-xs font-bold text-slate-400 tracking-wider">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Timeline Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 relative">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 pl-[240px] pointer-events-none flex h-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <div key={i} className="flex-1 border-l border-slate-100/60 h-full"></div>
              ))}
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading resources...</div>
            ) : assets.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No resources available.</div>
            ) : (
              assets.map(asset => (
                <div 
                  key={asset._id} 
                  className={`flex h-24 items-center cursor-pointer transition-colors hover:bg-slate-50/50 relative ${selectedAsset?._id === asset._id ? 'bg-slate-50' : ''}`}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setNewBooking(prev => ({ ...prev, resourceAssetId: asset._id }));
                  }}
                >
                  {/* Resource Info Column */}
                  <div className="w-[240px] shrink-0 h-full border-r border-slate-100 p-4 flex items-center gap-3 bg-white z-10">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm truncate w-48">{asset.name || asset.serialNumber}</h4>
                      <p className="text-xs text-slate-500 truncate w-48">{asset.category || 'Asset'} &bull; {asset.department || 'Shared'}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Row Area */}
                  <div className="flex-1 h-full relative py-7 px-1">
                    {renderTimelineBlocks(asset._id)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar - Details & Actions */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          
          {selectedAsset && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-32 bg-slate-100 relative">
                {/* Placeholder Image */}
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" 
                  alt="Room" 
                  className="w-full h-full object-cover opacity-80 mix-blend-multiply" 
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  ACTIVE
                </div>
              </div>
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">{selectedAsset.name || selectedAsset.serialNumber}</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{selectedAsset.category || 'Asset'}</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{selectedAsset.status || 'Available'}</span>
                </div>
              </div>
              
              <div className="p-5 bg-slate-50 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Time Slot</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start</p>
                    <input 
                      type="time" 
                      value={newBooking.startTime}
                      onChange={e => setNewBooking(prev => ({...prev, startTime: e.target.value}))}
                      className="font-bold text-slate-800 text-sm outline-none w-full text-center" 
                    />
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End</p>
                    <input 
                      type="time" 
                      value={newBooking.endTime}
                      onChange={e => setNewBooking(prev => ({...prev, endTime: e.target.value}))}
                      className="font-bold text-slate-800 text-sm outline-none w-full text-center" 
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleCreateBooking}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl shadow-sm shadow-rose-500/20 active:scale-[0.98] transition-all"
                >
                  Resolve & Book
                </button>
                <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-all">
                  Compare Alternatives
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Your Bookings</h4>
            <div className="bg-rose-50 text-rose-500 font-bold text-xs px-2 py-1 rounded-lg border border-rose-100 flex flex-col items-center leading-tight">
              <span className="text-sm">3</span>
              <span className="text-[8px] uppercase tracking-wider">Total</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BookingScreen;
