const { execSync }  = require('child_process');
const { statSync }  = require('fs');
const { join }      = require('path');
const { type }      = require('os');
 
try {
    statSync(join(process.cwd(), 'build'));
    if(type() === 'Windows_NT') {
        // https://stackoverflow.com/a/32607287
        execSync('del /f /s /q "build" 1>nul');
        execSync('rd /s /q "build"');
    } else {
        execSync('rm -rf build');
    }
} catch {}