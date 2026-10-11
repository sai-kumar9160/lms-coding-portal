import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { GraduationCap, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { menuPages, pageRegistry } from '../pages/registry';
import { menuIcon } from './menuIcons';
import { Modal } from './Modal';
import { MenuToggleIcon } from './MenuToggleIcon';

// Name and avatar in the header; clicking opens account details and Sign out.
function ProfileMenu({ user, college, busy, logout }) {
    const [open, setOpen] = useState(false);
    const container = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const closeOutside = event => { if (!container.current?.contains(event.target)) setOpen(false); };
        const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
    }, [open]);
    const role = user.role.toLowerCase().replaceAll('_', ' ');
    return <div className="profile-menu" ref={container}>
        <button className="profile" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>
            <div><strong>{user.name}</strong><small>{role}</small></div><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span><ChevronDown size={16}/>
        </button>
        {open && <div className="profile-dropdown" role="menu">
            <div className="profile-details"><strong>{user.name}</strong><span>{user.email}</span><small>{role}{college ? ` · ${college.name}` : ''}</small></div>
            <button role="menuitem" className="profile-signout" disabled={busy} onClick={logout}><LogOut size={16}/> Sign out</button>
        </div>}
    </div>;
}


// When the sidebar is closed only the icon shows; the name appears as a tooltip.
function MenuLink({ item, onNavigate, iconOnly }) {
    const Icon = menuIcon(item.icon);
    return <NavLink to={item.url} aria-label={item.name} title={iconOnly ? item.name : undefined} onClick={onNavigate} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19}/><span className="nav-text">{item.name}</span></NavLink>;
}

// Sidebar open/closed is a per-browser preference; storage may be unavailable.
const savedClosed = () => { try { return localStorage.getItem('lms-sidebar-closed') === '1'; } catch { return false; } };
const saveClosed = value => { try { localStorage.setItem('lms-sidebar-closed', value ? '1' : '0'); } catch { /* ignore */ } };
const isPhone = () => window.matchMedia('(max-width: 800px)').matches;

export function AppLayout() {
    const { user, college, colleges, inCollege, switchCollege, menu, can, error, setError, notice, busy, logout, modal, setModal, isSuper } = useWorkspace();
    const { pathname } = useLocation();
    // Wide screens: the ☰ button switches between the full sidebar and an icons-only sidebar (remembered).
    // Phones: the sidebar is hidden and ☰ opens it over the page.
    const [closed, setClosed] = useState(savedClosed);
    const [phoneOpen, setPhoneOpen] = useState(false);
    useEffect(() => setError(''), [pathname]);
    const toggleSidebar = () => {
        if (isPhone()) return setPhoneOpen(value => !value);
        setClosed(value => { saveClosed(!value); return !value; });
    };
    // Sidebar from GET /menu: header rows become section labels with their children below.
    const sections = [{ name: 'Workspace', items: menu.filter(item => !item.header) }, ...menu.filter(item => item.header).map(item => ({ name: item.name, items: item.children }))]
        .map(section => ({ ...section, items: section.items.filter(item => pageRegistry[item.url]) }))
        .filter(section => section.items.length);
    const page = pageRegistry[pathname] || {};
    // On the overview, offer the first create action the role has. College-owned items need a college context.
    const available = (a) => a && can(a.code, 'create') && (!a.needsCollege || inCollege);
    const action = page.action ? (available(page.action) ? page.action : null)
        : pathname === menuPages(menu)[0]?.url ? Object.values(pageRegistry).map(p => p.action).find(available) : null;
    return <div className={`app-layout${closed ? ' sidebar-closed' : ''}${phoneOpen ? ' sidebar-phone-open' : ''}`}>
        <aside>
            <div className="brand" title={closed ? 'NextByte' : undefined}><GraduationCap size={30}/><span className="nav-text"> NextByte<span className="brand-dot">.</span></span></div>
            {sections.map(section => <div className="nav-section" key={section.name}>
                <small className="nav-label">{section.name.toUpperCase()}</small>
                <nav>{section.items.map(item => <MenuLink key={item.code} item={item} iconOnly={closed} onNavigate={() => setPhoneOpen(false)}/>)}</nav>
            </div>)}
        </aside>
        {phoneOpen && <div className="sidebar-scrim" onClick={() => setPhoneOpen(false)}/>}
        <main>
            <header>
                <button className="sidebar-toggle" aria-label="Show or hide the menu" title="Show or hide the menu" aria-expanded={isPhone() ? phoneOpen : !closed} onClick={toggleSidebar}><MenuToggleIcon closed={closed}/></button>
                {action && action.modal !== 'college' && <button className="header-action" onClick={() => setModal(action.modal)}><Plus size={16}/> {action.label}</button>}
                {isSuper && <label className="college-switcher">Working in<select value={college?.id || ''} disabled={busy} onChange={event => switchCollege(event.target.value)}><option value="">Platform (no college)</option>{colleges.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (suspended)'}</option>)}</select></label>}
                <ProfileMenu user={user} college={college} busy={busy} logout={logout}/></header>
            <div className="content">
                {error && <div role="alert" className="alert">{error}</div>}
                {notice && <div role="status" className="success">{notice}</div>}
                <Outlet/>
                <footer>Campus · A space to learn, a place to grow.</footer>
            </div>
        </main>
        {modal && <Modal/>}
    </div>;
}
