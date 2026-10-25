import { CollegeDirectory } from '../components/CollegeDirectory';
import { VendorDirectory } from '../components/VendorDirectory';
import { useWorkspace } from '../workspace';

export function CollegesPage() {
    const { user, can } = useWorkspace();
    return <>
        <CollegeDirectory/>
        {user.role === 'SUPER_ADMIN' && can('colleges', 'create') && <VendorDirectory/>}
    </>;
}
