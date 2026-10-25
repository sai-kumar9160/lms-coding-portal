import { useEffect, useState } from 'react';
import { Handshake, Trash2 } from 'lucide-react';
import { PaginatedTable } from './Pagination';
import { PasswordInput } from './PasswordInput';
import { useWorkspace } from '../workspace';

// Super Admin only: vendors are partner accounts without a college. They sign in at /login?as=vendor with the
// email and password set here, and can publish shared coding problems.
export function VendorDirectory() {
    const { api, act, busy, setNotice } = useWorkspace();
    const [vendors, setVendors] = useState([]);
    const load = () => api('/vendors').then(setVendors);
    useEffect(() => { load().catch(() => {}); }, []);
    function create(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        act(async () => {
            await api('/vendors', 'POST', data);
            form.reset();
            await load();
            setNotice(`Vendor login created. Share the email and password with them; they sign in at /login?as=vendor.`);
        });
    }
    const remove = vendor => { if (window.confirm(`Remove ${vendor.name}? They will be signed out and can no longer log in.`)) act(async () => { await api(`/vendors/${vendor.id}`, 'DELETE'); await load(); setNotice('Vendor removed.'); }); };
    return <section className="college-directory vendor-directory">
        <div className="directory-heading"><span className="eyebrow">PARTNERS</span><h3><Handshake size={18}/> Vendors</h3>
            <p className="muted">Give a content partner a login. Vendors have no college; they see only the Coding Problems library and can publish shared problems.</p></div>
        <form className="academic-form" onSubmit={create}>
            <div className="academic-fields">
                <label>Name<input name="name" required minLength={2} maxLength={100}/></label>
                <label>Email<input name="email" type="email" required autoComplete="off"/></label>
                <label>Mobile number<input name="mobileNo" type="tel" required maxLength={25} placeholder="+919876543210"/></label>
                <label>Password<PasswordInput name="password" required minLength={10} maxLength={100} autoComplete="new-password" placeholder="At least 10 characters"/></label>
            </div>
            <div className="row-actions"><button className="primary" disabled={busy}>Create vendor login</button></div>
        </form>
        <div className="table-wrap directory-table-wrap"><PaginatedTable>
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Problems</th><th>Action</th></tr></thead>
            <tbody>{vendors.map(vendor => <tr key={vendor.id}><td><strong>{vendor.name}</strong></td><td>{vendor.email}</td><td>{vendor.mobileNo || 'Not provided'}</td><td>{vendor.problems}</td>
                <td><button type="button" className="text-button danger" disabled={busy} onClick={() => remove(vendor)} aria-label={`Remove ${vendor.name}`}><Trash2 size={15}/> Remove</button></td></tr>)}
                {vendors.length === 0 && <tr><td colSpan={5}>No vendors yet.</td></tr>}</tbody>
        </PaginatedTable></div>
    </section>;
}
