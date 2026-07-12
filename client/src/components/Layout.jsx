import React from 'react';

const SidebarItem = ({ icon, label, active }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-rose-50 text-rose-500 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
    <span className={`material-symbols-outlined text-xl ${active ? 'text-rose-500' : 'text-slate-500'}`}>{icon}</span>
    <span className="text-sm">{label}</span>
  </div>
);

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#f9fafb] font-body overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 relative z-20">
        <div>
          <div className="p-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">category</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">AssetFlow</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Enterprise Resource</p>
            </div>
          </div>
          <div className="px-3 space-y-1 mt-2">
            <SidebarItem icon="dashboard" label="Dashboard" />
            <SidebarItem icon="domain" label="Org Setup" />
            <SidebarItem icon="devices" label="Assets" />
            <SidebarItem icon="swap_horiz" label="Allocation" active />
            <SidebarItem icon="calendar_month" label="Booking" />
            <SidebarItem icon="build" label="Maintenance" />
            <SidebarItem icon="fact_check" label="Audit" />
            <SidebarItem icon="bar_chart" label="Reports" />
            <SidebarItem icon="notifications" label="Notifications" />
          </div>
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 leading-tight">Marcus Chen</p>
              <p className="text-xs text-slate-500">Admin Profile</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 cursor-pointer">keyboard_arrow_down</span>
          </div>
          <div className="mt-2 flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-xl">menu_open</span>
            <span className="text-sm font-medium">Collapse</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="w-96">
             <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Search assets, users..." 
                  className="w-full bg-slate-100 text-sm text-slate-900 rounded-lg pl-9 pr-10 py-2 border-none focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">⌘</span>
                  <span className="text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">K</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-sm">add</span>
              Quick Action
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
