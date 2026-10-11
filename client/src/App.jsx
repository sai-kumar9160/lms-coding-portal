import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { restoreSession } from './api';
import { WorkspaceProvider, useWorkspace } from './workspace';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { menuPages, pageRegistry } from './pages/registry';

// Routes exist only for menu items the role can view, so unpermitted URLs redirect to the first page.
function MenuRoutes() {
    const { menu } = useWorkspace();
    const pages = menuPages(menu);
    const home = pages[0]?.url;
    return <Routes>
        <Route element={<AppLayout/>}>
            {pages.map(item => { const Page = pageRegistry[item.url].component; return <Route key={item.url} path={item.url} element={<Page/>}/>; })}
            <Route path="*" element={home ? <Navigate to={home} replace/> : <div className="empty"><h3>No pages are assigned to your role</h3><p>Ask your administrator to grant menu access.</p></div>}/>
        </Route>
    </Routes>;
}

export function App() {
    const [token, setToken] = useState('');
    const [booting, setBooting] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    useEffect(() => { restoreSession().then(data => { if (data)
        setToken(data.token); }).catch(e => setError(e.message)).finally(() => setBooting(false)); }, []);
    if (booting)
        return <div className="loading">Restoring your campus session…</div>;
    if (!token)
        return <>{error && <div role="alert" className="alert">{error}</div>}<Routes>
            <Route path="/login" element={<AuthPage onLogin={newToken => { setError(''); setToken(newToken); navigate('/overview', { replace: true }); }}/>}/>
            <Route path="/reset-password" element={<AuthPage onLogin={newToken => { setToken(newToken); navigate('/overview', { replace: true }); }}/>}/>
            <Route path="*" element={<Navigate to="/login" replace/>}/>
        </Routes></>;
    return <WorkspaceProvider key={token} onSignedOut={() => { setToken(''); navigate('/login', { replace: true }); }}><MenuRoutes/></WorkspaceProvider>;
}
