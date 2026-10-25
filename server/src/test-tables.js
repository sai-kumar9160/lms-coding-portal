// Used by the test helpers only (the application writes its SQL out in full in each model).
// Maps a JavaScript property to its column for every table: { table, columns }, so tests can read rows back with camelCase names.
// The real table definitions are in sql/*.sql.
const audit = { createdAt: 'i_ts', updatedAt: 'u_ts', createdBy: 'crte_usr_id', updatedBy: 'updte_usr_id', activeIndicator: 'a_in', deletedAt: 'd_ts' };

export const tables = {
    roleMaster: { table: 'role_t', columns: { id: 'role_id', code: 'role_code', name: 'role_name', ...audit } },
    menuItem: { table: 'app_mnu_itm_lst_t', columns: { id: 'mnu_itm_id', code: 'mnu_itm_cd', name: 'mnu_itm_nm', description: 'mnu_dscn_tx', icon: 'mnu_itm_icn_tx', url: 'mnu_itm_url_tx', parentId: 'prnt_mnu_itm_id', sequence: 'sqnce_id', header: 'hdr_in', showInMenu: 'shw_in', ...audit } },
    roleMenuPermission: { table: 'app_rle_mnu_itm_rel_t', columns: { id: 'rle_mnu_itm_rel_ky', roleId: 'role_id', menuItemId: 'mnu_itm_id', canView: 'slct_in', canCreate: 'insrt_in', canUpdate: 'updt_in', canDelete: 'dlte_in', canExport: 'exprt_in', ...audit } },
    session: { table: 'Session', columns: { sid: 'sid', data: 'data', userId: 'userId', expiresAt: 'expiresAt', ...audit } },
    college: { table: 'College', columns: { id: 'id', name: 'name', slug: 'slug', active: 'active', ...audit } },
    user: { table: 'User', columns: { id: 'id', name: 'name', email: 'email', mobileNo: 'mobile_no', password: 'password', role: 'role', roleId: 'role_id', status: 'status', collegeId: 'collegeId', ...audit } },
    course: { table: 'Course', columns: { id: 'id', collegeId: 'collegeId', title: 'title', description: 'description', status: 'status', code: 'course_cd', level: 'level_cd', durationHours: 'duration_hrs_ct', objectives: 'objectives_tx', outcomes: 'outcomes_tx', shared: 'shared_in', syllabusFileId: 'syllabus_file_id', teacherId: 'teacherId', ...audit } },
    courseModule: { table: 'CourseModule', columns: { id: 'id', collegeId: 'collegeId', title: 'title', description: 'module_dscn_tx', position: 'position', courseId: 'courseId', ...audit } },
    lesson: { table: 'Lesson', columns: { id: 'id', collegeId: 'collegeId', title: 'title', lessonType: 'lesson_type', content: 'content', contentFormat: 'content_fmt_cd', fileId: 'file_id', durationSec: 'duration_sec', allowDownload: 'allow_download_in', published: 'published_in', prerequisiteLessonId: 'prerequisite_lesson_id', position: 'position', moduleId: 'moduleId', ...audit } },
    enrollment: { table: 'Enrollment', columns: { id: 'id', collegeId: 'collegeId', userId: 'userId', courseId: 'courseId', progressPct: 'progress_pct', completedAt: 'completed_at', ...audit } },
    lessonProgress: { table: 'LessonProgress', columns: { id: 'id', collegeId: 'collegeId', userId: 'userId', lessonId: 'lessonId', completedAt: 'completedAt', lastPositionSec: 'last_position_sec', timeSpentSec: 'time_spent_sec', ...audit } },
    courseInstructor: { table: 'crse_instrctr_rel_t', columns: { id: 'crse_instrctr_id', collegeId: 'college_id', courseId: 'course_id', userId: 'user_id', role: 'instrctr_role_cd', ...audit } },
    fileUpload: { table: 'file_upld_dtl_t', columns: { id: 'file_id', collegeId: 'college_id', storageKey: 'storage_key_tx', originalName: 'orgnl_file_nm', mimeType: 'mime_type_tx', sizeBytes: 'size_bytes_ct', checksum: 'checksum_tx', purpose: 'purpose_cd', lessonId: 'lesson_id', ...audit } },
    passwordReset: { table: 'pwd_rst_tkn_dtl_t', columns: { id: 'rst_tkn_id', userId: 'user_id', tokenHash: 'tkn_hash_tx', expiresAt: 'expires_ts', usedAt: 'used_ts', requestIp: 'rqst_ip_tx', ...audit } },
    academicYear: { table: 'acdmc_yr_lst_t', columns: { id: 'acdmc_yr_id', collegeId: 'college_id', name: 'acdmc_yr_nm', startDate: 'start_dt', endDate: 'end_dt', isCurrent: 'is_crnt_in', ...audit } },
    department: { table: 'dept_lst_t', columns: { id: 'dept_id', collegeId: 'college_id', code: 'dept_cd', name: 'dept_nm', hodUserId: 'hod_usr_id', ...audit } },
    program: { table: 'prgm_lst_t', columns: { id: 'prgm_id', collegeId: 'college_id', departmentId: 'dept_id', code: 'prgm_cd', name: 'prgm_nm', durationYears: 'duration_yrs_ct', ...audit } },
    batch: { table: 'btch_lst_t', columns: { id: 'btch_id', collegeId: 'college_id', programId: 'prgm_id', academicYearId: 'acdmc_yr_id', name: 'btch_nm', section: 'section_tx', ...audit } },
    studentProfile: { table: 'stdnt_prfl_dtl_t', columns: { id: 'stdnt_prfl_id', userId: 'user_id', collegeId: 'college_id', rollNumber: 'roll_no', batchId: 'btch_id', admissionYear: 'admsn_yr', dateOfBirth: 'dob_dt', gender: 'gndr_cd', guardianPhone: 'grdn_phone_no', ...audit } },
    teacherProfile: { table: 'tchr_prfl_dtl_t', columns: { id: 'tchr_prfl_id', userId: 'user_id', collegeId: 'college_id', employeeCode: 'emp_cd', departmentId: 'dept_id', designation: 'dsgntn_tx', qualification: 'qlfctn_tx', ...audit } },
    cohort: { table: 'chrt_lst_t', columns: { id: 'chrt_id', collegeId: 'college_id', name: 'chrt_nm', description: 'chrt_dscn_tx', batchId: 'btch_id', archived: 'archived_in', ...audit } },
    cohortMember: { table: 'chrt_mbr_rel_t', columns: { id: 'chrt_mbr_id', collegeId: 'college_id', cohortId: 'chrt_id', userId: 'user_id', ...audit } },
    auditLog: { table: 'adt_log_dtl_t', json: ['before', 'after'], columns: { id: 'adt_log_id', collegeId: 'college_id', actorId: 'actor_usr_id', actingAsSuperAdmin: 'acting_as_sa_in', action: 'action_cd', entityType: 'entity_type_cd', entityId: 'entity_id', before: 'before_json', after: 'after_json', ipAddress: 'ip_addr_tx', userAgent: 'user_agent_tx', requestId: 'request_id', occurredAt: 'occurred_ts' } },
    question: { table: 'qstn_lst_t', json: ['answerKey'], columns: { id: 'qstn_id', collegeId: 'college_id', courseId: 'course_id', questionType: 'qstn_type_cd', stem: 'stem_tx', explanation: 'explanation_tx', difficulty: 'difficulty_cd', marks: 'marks_ct', negativeMarks: 'negative_marks_ct', answerKey: 'answer_key_json', topic: 'topic_tx', codingProblemId: 'cdng_prblm_id', ...audit } },
    questionOption: { table: 'qstn_optn_lst_t', columns: { id: 'qstn_optn_id', questionId: 'qstn_id', text: 'optn_tx', isCorrect: 'is_correct_in', sequence: 'sqnce_id', createdAt: 'i_ts' } },
    assessment: { table: 'asmt_lst_t', columns: { id: 'asmt_id', collegeId: 'college_id', courseId: 'course_id', assessmentType: 'asmt_type_cd', title: 'asmt_ttl', instructions: 'instructions_tx', durationMin: 'duration_min_ct', passPct: 'pass_pct', maxAttempts: 'max_attempts_ct', attemptStrategy: 'attempt_strategy_cd', shuffleQuestions: 'shuffle_qstn_in', shuffleOptions: 'shuffle_optn_in', resultVisibility: 'result_visibility_cd', resultsPublished: 'results_published_in', status: 'status_cd', ...audit } },
    assessmentQuestion: { table: 'asmt_qstn_rel_t', columns: { id: 'asmt_qstn_id', assessmentId: 'asmt_id', questionId: 'qstn_id', sequence: 'sqnce_id', marksOverride: 'marks_override_ct' } },
    assessmentWindow: { table: 'asmt_wndw_lst_t', columns: { id: 'asmt_wndw_id', assessmentId: 'asmt_id', cohortId: 'chrt_id', opensAt: 'opens_ts', closesAt: 'closes_ts', extraTimeMin: 'extra_time_min_ct', ...audit } },
    attempt: { table: 'atmpt_dtl_t', json: ['layout'], columns: { id: 'atmpt_id', collegeId: 'college_id', assessmentId: 'asmt_id', windowId: 'asmt_wndw_id', userId: 'user_id', attemptNo: 'atmpt_no', status: 'status_cd', startedAt: 'started_ts', expiresAt: 'expires_ts', submittedAt: 'submitted_ts', layout: 'layout_json', score: 'score_ct', maxScore: 'max_score_ct', isPassed: 'is_passed_in', needsGrading: 'needs_grading_in', createdAt: 'i_ts', updatedAt: 'u_ts' } },
    attemptAnswer: { table: 'atmpt_ans_dtl_t', json: ['answer'], columns: { id: 'atmpt_ans_id', attemptId: 'atmpt_id', questionId: 'qstn_id', answer: 'answer_json', isCorrect: 'is_correct_in', marksAwarded: 'marks_awarded_ct', feedback: 'feedback_tx', evaluatedBy: 'evaluated_by', evaluatedAt: 'evaluated_ts', savedAt: 'saved_ts' } },
    codingProblem: { table: 'cdng_prblm_lst_t', json: ['languages'], columns: { id: 'cdng_prblm_id', collegeId: 'college_id', slug: 'prblm_slug_tx', title: 'prblm_ttl', difficulty: 'difficulty_cd', topic: 'topic_tx', statement: 'statement_tx', inputFormat: 'input_format_tx', outputFormat: 'output_format_tx', constraints: 'constraints_tx', timeLimitMs: 'time_limit_ms_ct', memoryLimitMb: 'memory_limit_mb_ct', sequence: 'sqnce_id', status: 'status_cd', visibility: 'visibility_cd', languages: 'languages_json', checker: 'checker_cd', epsilon: 'epsilon_ct', scoring: 'scoring_cd', maxScore: 'max_score_ct', referenceLanguage: 'reference_lang_cd', referenceSolution: 'reference_solution_tx', validatedAt: 'validated_ts', ...audit } },
    codingTestCase: { table: 'cdng_tst_cs_lst_t', columns: { id: 'cdng_tst_cs_id', problemId: 'cdng_prblm_id', input: 'input_tx', expectedOutput: 'expected_output_tx', isSample: 'is_sample_in', weight: 'weight_ct', group: 'group_tx', explanation: 'explanation_tx', sequence: 'sqnce_id', createdAt: 'i_ts' } },
    codingSubmission: { table: 'cdng_sbmsn_dtl_t', json: ['results', 'limits'], columns: { id: 'cdng_sbmsn_id', collegeId: 'college_id', userId: 'user_id', problemId: 'cdng_prblm_id', kind: 'kind_cd', jobStatus: 'job_status_cd', language: 'lang_cd', code: 'code_tx', customInput: 'custom_input_tx', status: 'status_cd', passedCount: 'passed_ct', totalCount: 'total_ct', score: 'score_ct', maxScore: 'max_score_ct', runtimeMs: 'runtime_ms_ct', results: 'results_json', limits: 'limits_json', attemptId: 'atmpt_id', questionId: 'qstn_id', tries: 'tries_ct', worker: 'worker_tx', startedAt: 'started_ts', judgedAt: 'judged_ts', createdAt: 'i_ts' } },
};

const q = name => `"${name}"`;
const tableOf = entity => {
    const def = tables[entity];
    if (!def) throw new Error(`Unknown table entity: ${entity}`);
    return def;
};
const columnOf = (def, property) => {
    const column = def.columns[property];
    if (!column) throw new Error(`${def.table} has no column for "${property}"`);
    return q(column);
};
// "Course" for a table name, as written in FROM / JOIN clauses.
export const tableName = entity => q(tableOf(entity).table);
// c."title" AS "title", c."course_cd" AS "code", ...  (only the listed properties when `only` is given)
export function columns(entity, alias, only) {
    const def = tableOf(entity);
    return (only ?? Object.keys(def.columns)).map(property => `${alias}.${columnOf(def, property)} AS ${q(property)}`).join(', ');
}
// "course_cd" for one property, optionally prefixed with an alias: col('course', 'code', 'c') -> c."course_cd".
export const col = (entity, property, alias) => `${alias ? `${alias}.` : ''}${columnOf(tableOf(entity), property)}`;
