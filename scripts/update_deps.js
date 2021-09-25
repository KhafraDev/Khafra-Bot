import { execSync } from 'child_process';

const outdated = JSON.parse(execSync('npm outdated --json').toString());

for (const key of Object.keys(outdated)) {
    const pkg = outdated[key];
    console.log(`Installing ${key}@${pkg.wanted} (current:${pkg.current})`);
    execSync(`npm i ${key}@${pkg.wanted}`);
}