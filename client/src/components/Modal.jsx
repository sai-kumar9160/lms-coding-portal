import { X } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { CourseManager } from './CourseManager';
import { CourseViewer } from './CourseViewer';
import { CreateForm } from './CreateForm';
import { ProfileForm } from './ProfileForm';

// modal values: 'college' | 'user' | 'course' (create forms), 'manage:<courseId>', 'profile:<userId>', or '<courseId>' (viewer).
export function Modal() {
    const { modal, setModal, courses, users, error, reload } = useWorkspace();
    const managed = modal.startsWith('manage:') && courses.find(c => c.id === modal.slice(7));
    const viewed = courses.find(c => c.id === modal);
    const person = modal.startsWith('profile:') && users.find(u => u.id === modal.slice(8));
    return <div className="modal-backdrop"><section className={`modal${managed || viewed ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label="Workspace form">
        <button aria-label="Close dialog" className="close" onClick={() => setModal('')}><X size={22}/></button>
        {error && <div className="alert" role="alert">{error}</div>}
        {person ? <ProfileForm person={person}/> : managed ? <CourseManager course={managed} onSaved={reload}/> : ['college', 'user', 'course'].includes(modal) ? <CreateForm kind={modal}/> : viewed ? <CourseViewer course={viewed}/> : null}
    </section></div>;
}
