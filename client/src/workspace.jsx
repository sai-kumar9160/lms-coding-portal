import { createContext, useContext, useEffect, useState } from 'react';
import { request, setCollegeContext } from './api';

// The Super Admin's chosen college is remembered for this browser tab only.
const COLLEGE_KEY = 'lms-work-college';
const storedCollege = () => { try { return sessionStorage.getItem(COLLEGE_KEY) || ''; } catch { return ''; } };
const storeCollege = (id) => { try { if (id) sessionStorage.setItem(COLLEGE_KEY, id); else sessionStorage.removeItem(COLLEGE_KEY); } catch { /* storage unavailable */ } };

const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);

// Signed-in state shared by the layout and every page.
export function WorkspaceProvider({ onSignedOut, children }) {
    const [user, setUser] = useState(null);
    const [college, setCollege] = useState(null);
    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [access, setAccess] = useState({ menu: [], permissions: {} });
    const [workCollegeId, setWorkCollegeId] = useState(storedCollege);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [modal, setModal] = useState('');
    async function api(path, method = 'GET', body) {
        try {
            return await request(path, method, body);
        }
        catch (error) {
            if (error.status === 401)
                onSignedOut();
            throw error;
        }
    }
    // Data is loaded according to the role's database permissions (GET /menu).
    // College users always work in their own college; a Super Admin works in the college chosen in the switcher.
    async function reload(chosenCollegeId = workCollegeId) {
        setCollegeContext('');
        const [me, menu] = await Promise.all([api('/me'), api('/menu')]);
        const allowed = (code) => menu.permissions[code]?.view;
        const collegeList = allowed('colleges') ? await api('/colleges') : [];
        const switched = me.user.role === 'SUPER_ADMIN' && collegeList.find(c => String(c.id) === String(chosenCollegeId));
        if (me.user.role === 'SUPER_ADMIN' && !switched && chosenCollegeId) { setWorkCollegeId(''); storeCollege(''); }
        setCollegeContext(switched ? switched.id : '');
        const inCollege = Boolean(me.user.collegeId || switched);
        const [courseList, userList] = await Promise.all([
            inCollege && allowed('courses') ? api('/courses') : [],
            inCollege && allowed('people') ? api('/users') : [],
        ]);
        setColleges(collegeList); setCourses(courseList); setUsers(userList);
        setCollege(me.college || switched || null);
        setAccess(menu);
        setUser(me.user);
    }
    // Super Admin college switcher.
    const switchCollege = (id) => act(async () => { setWorkCollegeId(id); storeCollege(id); setModal(''); await reload(id); });
    useEffect(() => { reload().catch(e => setError(e.message)); }, []);
    async function act(action) {
        setBusy(true); setError(''); setNotice('');
        try {
            await action();
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    const logout = () => act(async () => { await api('/auth/logout', 'POST'); onSignedOut(); });
    if (!user)
        return <div className="loading">{error || 'Opening your campus…'}</div>;
    // can('courses', 'update') mirrors the server's requirePermission checks, to show or hide actions.
    const can = (code, action = 'view') => Boolean(access.permissions[code]?.[action]);
    // inCollege: requests have a college context (always for college users; after choosing one for Super Admin).
    const inCollege = Boolean(user.collegeId || (user.role === 'SUPER_ADMIN' && college));
    const value = { user, college, inCollege, switchCollege, courses, users, colleges, menu: access.menu, can, reload, api, act, busy, error, setError, notice, setNotice, modal, setModal, logout, isStudent: user.role === 'STUDENT', isSuper: user.role === 'SUPER_ADMIN' };
    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
