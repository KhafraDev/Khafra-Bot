const { execSync } = require('child_process');
const { type } = require('os');
    
try {
    if(type() === 'Windows_NT') {
        execSync('xcopy "./src/Commands/Fun/Cowsay" "./build/Commands/Fun/Cowsay" /S /I /Y');
    } else {
        throw 'not available yet';
    }
} catch(e) {
    throw e;
}