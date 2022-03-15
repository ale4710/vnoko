function checkInfoFile(blob, callback) {
    callback = callback || emptyFn;
    blobToText(blob, (title)=>{
        if(title) {
            title = title.match(/^title\=([^\r\n]*)[\r\n]*$/i);
            if(title) {
                title = title[1];
            }
        }
    
        if(!title) {
            title = null;
        }

        callback(title);
    });
}