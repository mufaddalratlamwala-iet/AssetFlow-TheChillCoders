import React from 'react';

const Sidebar = ({ currentScreen, setCurrentScreen, user, onLogout }) => {
    
    const NavLink = ({ id, label, icon }) => {
        const isActive = currentScreen === id;
        return (
            <button
                onClick={() => setCurrentScreen(id)}
                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 active:scale-95 text-left cursor-pointer ${
                    isActive 
                    ? 'text-primary font-bold bg-primary/10 shadow-sm' 
                    : 'text-on-surface-variant font-medium hover:bg-surface-variant hover:text-on-surface'
                }`}
            >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
                <span>{label}</span>
            </button>
        );
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] border-r border-outline-variant bg-surface flex flex-col py-6 z-50 shrink-0">
            <div className="px-6 mb-8 shrink-0">
                <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">AssetFlow</h1>
                <p className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-widest mt-1 opacity-80">Technical Operations</p>
            </div>
            
            <nav className="flex-1 px-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                <NavLink id="org-setup" label="Org Setup" icon="settings_suggest" />
                <NavLink id="assets" label="Assets" icon="inventory_2" />
                {user && ['Admin', 'Asset Manager', 'Department Head'].includes(user.role) && (
                    <NavLink id="reports" label="Reports" icon="analytics" />
                )}
                
                {/* Disabled nav links representing other features in design */}
                <div className="pt-4 border-t border-outline-variant/30 mt-4 space-y-1.5 opacity-40 pointer-events-none">
                    <div className="flex items-center gap-4 px-4 py-2 text-xs uppercase tracking-wider font-bold text-on-surface-variant">Future Phases</div>
                    <div className="flex items-center gap-4 px-4 py-2 text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
                        <span>Allocation</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-[20px]">build</span>
                        <span>Maintenance</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 text-on-surface-variant font-medium">
                        <span className="material-symbols-outlined text-[20px]">fact_check</span>
                        <span>Audit</span>
                    </div>
                </div>
            </nav>
            
            {/* User Profile Footer */}
            <div className="px-4 pt-6 border-t border-outline-variant shrink-0 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-outline-variant overflow-hidden flex items-center justify-center bg-primary/20 text-primary font-bold text-sm shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-on-surface font-semibold text-xs truncate leading-tight">{user?.name || 'Admin User'}</p>
                        <p className="text-on-surface-variant text-[10px] truncate">{user?.role || 'Enterprise Admin'}</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout} 
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
