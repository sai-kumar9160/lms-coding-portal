// Re-converts a course's linked PDF with the current converter and replaces its units and lessons.
// Usage (from E:\LMS\server): node scripts/rebuild-course.mjs --course <course id>
// The same action is available in the app as Manage course → "Rebuild lessons from the course PDF".
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { db } from '../config/db.config.js';
import { rebuildCourseFromPdf } from '../src/services/pdf-course.service.js';
import { resolveKey } from '../src/services/file-storage.service.js';

const { values: args } = parseArgs({ options: { course: { type: 'string' } } });
try {
    if (!args.course) throw new Error('Usage: node scripts/rebuild-course.mjs --course <course id>');
    const course = await db.course.findFirst({ where: { id: args.course, activeIndicator: 1 }, include: { syllabusFile: true } });
    if (!course?.syllabusFile) throw new Error('Course not found or it has no linked PDF');
    const result = await rebuildCourseFromPdf({ id: course.teacherId }, course.collegeId, course, resolveKey(course.syllabusFile.storageKey));
    await db.auditLog.create({ data: { collegeId: course.collegeId, actorId: course.teacherId, action: 'rebuild_from_pdf', entityType: 'course', entityId: course.id, after: result } });
    console.log(`Rebuilt "${course.title}": ${result.units} units, ${result.lessons} lessons, ${result.images} figures.`);
}
catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
finally {
    await db.$disconnect();
}
