import { spawn } from 'child_process';

const child = spawn('yarn', ['workspace', 'backend', 'run', 'prisma', 'migrate', 'dev', '--name', 'make_required'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true
});

child.stdin.write('y\n');
child.stdin.end();

child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
