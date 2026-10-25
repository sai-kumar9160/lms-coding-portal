// Puts every student into the "CSE" branch group of their college (created when missing).
import 'dotenv/config';
import { db } from '../config/db.config.js';

try {
    const result = await db.transaction(async tx => {
        const students = await tx.many(`SELECT id, "collegeId" FROM "User" WHERE role = 'STUDENT' AND "collegeId" IS NOT NULL`);
        const collegeIds = [...new Set(students.map(student => student.collegeId))];
        let createdGroups = 0;
        for (const collegeId of collegeIds) {
            let group = await tx.one(`SELECT chrt_id AS id FROM chrt_lst_t WHERE college_id = $1 AND lower(chrt_nm) = 'cse' AND a_in = 1 AND archived_in = 0 ORDER BY i_ts ASC LIMIT 1`, [collegeId]);
            if (!group) {
                group = await tx.one(`INSERT INTO chrt_lst_t (college_id, chrt_nm, chrt_dscn_tx) VALUES ($1, 'CSE', 'Computer Science and Engineering branch group') RETURNING chrt_id AS id`, [collegeId]);
                createdGroups++;
            }
            const ids = students.filter(student => student.collegeId === collegeId).map(student => student.id);
            for (const userId of ids)
                await tx.run(
                    `INSERT INTO chrt_mbr_rel_t (chrt_mbr_id, college_id, chrt_id, user_id) VALUES (DEFAULT, $1, $2, $3)
                     ON CONFLICT (chrt_id, user_id) DO UPDATE SET a_in = 1, d_ts = NULL`, [collegeId, group.id, userId]);
            const { total } = await tx.one('SELECT COUNT(*) AS total FROM chrt_mbr_rel_t WHERE chrt_id = $1 AND a_in = 1 AND user_id = ANY($2::int[])', [group.id, ids]);
            if (total !== ids.length) throw new Error('CSE assignment verification failed');
        }
        return { studentsAssigned: students.length, colleges: collegeIds.length, createdGroups };
    });
    console.log(JSON.stringify(result));
}
finally { await db.end(); }
