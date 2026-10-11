import PDFDocument from 'pdfkit';

const green = '#1d4639', grey = '#5f6b63', light = '#dfe7d9';
const levels = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };
const types = { TEXT: 'Reading', VIDEO: 'Video', DOCUMENT: 'PDF' };
// The built-in PDF fonts only cover Windows-1252; replace anything else so it never prints as garbage.
const winAnsiExtras = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const printable = (text = '') => String(text).replace(/→/g, '->').replace(/[^\n\x20-\x7e\xa0-\xff]/g, ch => (winAnsiExtras.includes(ch) ? ch : '?'));
const lines = (text) => printable(text).split('\n').map(line => line.trim()).filter(Boolean);
const minutes = (sec) => (sec ? ` · ${Math.round(sec / 60)} min` : '');

function heading(doc, text) {
    doc.moveDown(0.8).font('Helvetica-Bold').fontSize(13).fillColor(green).text(printable(text));
    const y = doc.y + 2;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).lineWidth(0.7).strokeColor(light).stroke();
    doc.moveDown(0.5);
}

function bullets(doc, text) {
    for (const line of lines(text))
        doc.font('Helvetica').fontSize(10.5).fillColor('#263b34').text(`•  ${line.replace(/^•\s*/, '')}`, { indent: 6, paragraphGap: 3 });
}

// Renders a course syllabus: details, objectives, every unit with its lessons and topics, outcomes, page footer.
export function renderSyllabus(course) {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 54, bottom: 64, left: 54, right: 54 }, bufferPages: true, info: { Title: `${printable(course.title)} — Syllabus`, Author: printable(course.college.name) } });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(grey).text(printable(course.college.name).toUpperCase(), { characterSpacing: 1.2 });
    doc.moveDown(0.4).font('Helvetica-Bold').fontSize(22).fillColor('#18322a').text(printable(course.title));
    const facts = [course.code && `Code ${course.code}`, course.level && levels[course.level], course.durationHours && `${course.durationHours} hours`,
        `${course.modules.length} units`, `${course.modules.reduce((n, m) => n + m.lessons.length, 0)} lessons`].filter(Boolean).join('   ·   ');
    doc.moveDown(0.3).font('Helvetica').fontSize(10).fillColor(grey).text(printable(facts));
    if (course.instructors.length)
        doc.text(printable(`Instructors: ${course.instructors.map(i => i.user.name).join(', ')}`));
    doc.moveDown(0.8).font('Helvetica').fontSize(11).fillColor('#263b34').text(printable(course.description), { lineGap: 2 });

    if (course.objectives.trim()) { heading(doc, 'Learning objectives'); bullets(doc, course.objectives); }

    heading(doc, 'Syllabus');
    course.modules.forEach((module, m) => {
        doc.moveDown(m ? 0.7 : 0).font('Helvetica-Bold').fontSize(12).fillColor(green).text(printable(module.title));
        if (module.description.trim())
            doc.font('Helvetica-Oblique').fontSize(10).fillColor(grey).text(printable(module.description), { paragraphGap: 4 });
        module.lessons.forEach((lesson, l) => {
            doc.moveDown(0.25).font('Helvetica-Bold').fontSize(10.5).fillColor('#263b34').text(printable(lesson.title), { indent: 10, continued: true })
                .font('Helvetica').fillColor(grey).text(`   ${types[lesson.lessonType]}${minutes(lesson.durationSec)}`);
            // Text lessons carry their topics; include them, shortened if very long.
            if (lesson.lessonType === 'TEXT' && lesson.content.trim()) {
                const body = lesson.content.length > 1500 ? `${lesson.content.slice(0, 1500)}…` : lesson.content;
                doc.font('Helvetica').fontSize(9.5).fillColor('#3d4d44');
                for (const line of lines(body))
                    doc.text(line, { indent: 22, paragraphGap: 1 });
            }
            if (l === module.lessons.length - 1) doc.moveDown(0.2);
        });
    });

    if (course.outcomes.trim()) { heading(doc, 'Learning outcomes'); bullets(doc, course.outcomes); }

    // Footer on every page.
    const range = doc.bufferedPageRange();
    const generated = new Date().toISOString().slice(0, 10);
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const bottom = doc.page.height - 40;
        doc.page.margins.bottom = 0;
        doc.font('Helvetica').fontSize(8).fillColor(grey)
            .text(printable(`${course.code || course.title} — Syllabus · Generated ${generated}`), 54, bottom, { lineBreak: false })
            .text(`Page ${i + 1} of ${range.count}`, 54, bottom, { width: doc.page.width - 108, align: 'right', lineBreak: false });
    }
    doc.end();
    return doc;
}
