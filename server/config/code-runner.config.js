// Coding practice runs student programs. CODE_RUNNER selects how:
//   local  - runs programs on this server in a temporary folder with a time limit. Only for development or a
//            trusted lab server: the program runs with the server's own operating-system permissions.
//   judge0 - sends programs to a Judge0 sandbox (JUDGE0_URL, optional JUDGE0_KEY). Use this in production.
//   off    - coding problems can be read but not run.
// The default is local in development and off in production, so production never runs code unsandboxed by accident.
const production = process.env.NODE_ENV === 'production';
const mode = (process.env.CODE_RUNNER || (production ? 'off' : 'local')).toLowerCase();
if (!['local', 'judge0', 'off'].includes(mode))
    throw new Error('CODE_RUNNER must be local, judge0 or off');
if (mode === 'judge0' && !process.env.JUDGE0_URL)
    throw new Error('CODE_RUNNER=judge0 needs JUDGE0_URL');

export const codeRunnerConfig = {
    mode,
    judge0Url: (process.env.JUDGE0_URL || '').replace(/\/+$/, ''),
    judge0Key: process.env.JUDGE0_KEY || '',
    // Toolchains for local mode; anything missing is simply not offered as a language.
    commands: {
        python: process.env.PYTHON_PATH || 'python',
        node: process.execPath,
        javac: process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/javac` : 'javac',
        java: process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/java` : 'java',
        gcc: process.env.GCC_PATH || 'gcc',
        gxx: process.env.GXX_PATH || 'g++',
    },
    maxParallel: Number(process.env.CODE_RUNNER_PARALLEL || 4),
    maxQueue: 30,
    maxSourceBytes: 64 * 1024,
    maxOutputBytes: 2 * 1024 * 1024,
};
