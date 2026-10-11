import { BookOpen, Building2, Circle, ClipboardCheck, Code2, Layers, LayoutDashboard, ScrollText, ShieldCheck, Users } from 'lucide-react';

// Icon names stored in app_mnu_itm_lst_t.mnu_itm_icn_tx. Add an entry here when a menu uses a new icon.
const icons = { BookOpen, Building2, ClipboardCheck, Code2, Layers, LayoutDashboard, ScrollText, ShieldCheck, Users };

export const menuIcon = (name) => icons[name] || Circle;
