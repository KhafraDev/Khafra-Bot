const { execSync }  = require('child_process');
const { statSync }  = require('fs');
const { join }      = require('path');
const { type }      = require('os');
 
try {
    statSync(join(process.cwd(), 'build'));
    if(type() === 'Windows_NT') {
        execSync('rd /s /q "build"');
    } else {
        execSync('rm -rf build');
    }
} catch {}