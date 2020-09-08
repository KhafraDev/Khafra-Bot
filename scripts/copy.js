const { execSync } = require('child_process');
const { type } = require('os');
    
try {
    if(type() === 'Windows_NT') {
        execSync('xcopy "./src/Commands/Fun/Cowsay" "./build/Commands/Fun/Cowsay" /S /I /Y');
    } else {
        execSync('cp -r ./src/Commands/Fun/Cowsay ./build/Commands/Fun/Cowsay')
    }
} catch(e) {
    throw e;
}