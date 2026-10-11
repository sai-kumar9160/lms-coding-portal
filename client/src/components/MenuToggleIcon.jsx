// Sidebar toggle icon: a chevron with an underline next to three lines. The chevron points left
// (collapse) while the sidebar is open and right (expand) while it is closed.
export function MenuToggleIcon({ closed, size = 22 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points={closed ? '4 7 7.5 10 4 13' : '7.5 7 4 10 7.5 13'}/>
        <line x1="3.5" y1="17" x2="8" y2="17"/>
        <line x1="11" y1="7" x2="21" y2="7"/>
        <line x1="11" y1="12" x2="21" y2="12"/>
        <line x1="11" y1="17" x2="21" y2="17"/>
    </svg>;
}
