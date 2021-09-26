import { execSync } from 'child_process';

console.log(execSync('npm outdated').toString());

const outdated = JSON.parse(execSync('npm outdated --json').toString());

for (const key of Object.keys(outdated)) {
    const pkg = outdated[key];
    console.log(`Installing ${key}@${pkg.latest} (current:${pkg.current})`);
    execSync(`npm i ${key}@${pkg.latest}`);
}