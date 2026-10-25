// PostgreSQL enum values (see sql/00_types_and_functions.sql) as plain objects.
export const Role = Object.freeze({ SUPER_ADMIN: 'SUPER_ADMIN', COLLEGE_ADMIN: 'COLLEGE_ADMIN', TEACHER: 'TEACHER', STUDENT: 'STUDENT', VENDOR: 'VENDOR' });
export const UserStatus = Object.freeze({ PENDING: 'PENDING', ACTIVE: 'ACTIVE' });
// Platform accounts belong to no college: the Super Admin, and vendors (partners who publish shared content).
export const isPlatformRole = role => role === Role.SUPER_ADMIN || role === Role.VENDOR;
