import { OverviewPage } from './OverviewPage';
import { CoursesPage } from './CoursesPage';
import { PeoplePage } from './PeoplePage';
import { CollegesPage } from './CollegesPage';
import { AccessControlPage } from './AccessControlPage';
import { AcademicsPage } from './AcademicsPage';
import { AuditLogPage } from './AuditLogPage';
import { CodingPage } from './CodingPage';
import { CodingProblemsPage } from './CodingProblemsPage';
import { AssessmentsPage } from './AssessmentsPage';

// Maps menu item URLs (app_mnu_itm_lst_t.mnu_itm_url_tx) to React pages.
// A database menu item appears only when its URL is registered here (APCMMS routeRegistry style).
// action: the "create" button shown on the page, when the role has create permission for that menu code.
export const pageRegistry = {
    '/overview': { component: OverviewPage },
    '/courses': { component: CoursesPage },
    '/people': { component: PeoplePage, action: { code: 'people', modal: 'user', label: 'Add person', needsCollege: true } },
    '/colleges': { component: CollegesPage, action: { code: 'colleges', modal: 'college', label: 'Add college' } },
    '/access-control': { component: AccessControlPage },
    '/academics': { component: AcademicsPage },
    '/audit-log': { component: AuditLogPage },
    '/coding': { component: CodingPage },
    '/coding-problems': { component: CodingProblemsPage },
    '/assessments': { component: AssessmentsPage },
};

// Menu leaves (with registered pages) in sidebar order.
export function menuPages(menu) {
    return menu.flatMap(item => item.children.length ? item.children : [item]).filter(item => !item.header && pageRegistry[item.url]);
}
