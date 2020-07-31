const { execSync }  = require('child_process');
 
try {
    execSync('xcopy "./src/Commands/Fun/Cowsay" "build/Commands/Fun/Cowsay" /F /Y');
} catch {}