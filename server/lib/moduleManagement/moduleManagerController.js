let fs = require('fs');
let path = require('path');
let modulesBase = {
    app: path.join(__dirname, '..', '..', 'app')
};

function getImplementations(moduleName) {
    let implementations = [];
    let baseDir = modulesBase[moduleName];
    let files = fs.readdirSync(baseDir);
    files.forEach((file) =>{
        if(fs.lstatSync(path.join(baseDir, file)).isDirectory()){
            let metaFile = path.join(baseDir, file, 'meta.json');
            if(fs.existsSync(metaFile)){
                let meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
                implementations.push(meta);
            }
        }
    });
    return implementations;
}


exports.getImplementations = getImplementations;