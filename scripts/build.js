const { rmdir } = require('fs/promises');
const { join, resolve } = require('path');

rmdir(join(resolve('.'), 'build'), {
    recursive: true
}).then(() => {});