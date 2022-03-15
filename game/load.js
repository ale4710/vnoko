var
gamedir = decodeURIComponent(location.hash.substring(1)),
fileTypeConsts = {
    script: 0,
    sprite: 1,
    background: 2,
    sound: 3,
    music: 4
},
fileTypeInfo = { //the "archive" property will be set if it's archivee
    0: {dir: 'script'},
    1: {dir: 'foreground'},
    2: {dir: 'background'},
    3: {dir: 'sound'},
    4: {dir: 'sound'}
};

function formGameDir(relFilePath) {
    return formDir(`${novelsFolder}/${gamedir}/${relFilePath}`);
}

var requestTypes = {
    fs: 0,
    zip: 1
};

function getFile(type, filename, callback, responseType) {
    var fti = fileTypeInfo, //"fti" = file type info
    rqfCallback = (e)=>{
        var rq = e.target;
        callback(
            rq.result, 
            requestTypes.fs,
            rq
        );
    };
    /* rqfCallback = (e)=>{
        var rq = e.target;
        if(rq.readyState === rq.DONE) {
            callback(
                rq.response, 
                requestTypes.fs,
                rq
            );
        }
    }; */
    
    if(type === -1) {
        requestFile(formGameDir(filename), rqfCallback);
    } else {
        //"tft" = this file type
        var tft = fti[type];
        if(tft.archive) {
            var fia = tft.archive.files[tft.archivePrefix + filename];
            if(fia) {
                fia.async(responseType || 'blob')
                    .then((data)=>{
                        callback(
                            data,
                            requestTypes.zip
                        )
                    })
                    .catch((err)=>{
                        console.error(err);
                        callback(
                            null,
                            requestTypes.zip,
                            err
                        )
                    });
            } else {
                callback(
                    null,
                    requestTypes.zip
                );
            }
            
        } else {
            requestFile(formGameDir(`${fti[type].dir}/${filename}`), rqfCallback);
        }
    }
}