var mainGameFolder = '.vnoko',
novelsFolder = 'novels',
storage = navigator.getDeviceStorage('sdcard');

function formDir(relFilePath) {
    return `${mainGameFolder}/${relFilePath}`;
}
function requestFile(path, callback) {
    var rq = storage.get(path);

    rq.onsuccess = (e)=>{
        console.log(e.target.result);
        callback(e);
    };
    rq.onerror = (e)=>{
        console.error(path, e.target.error);
        callback(e);
    }
}

navigator.getDeviceStorages('sdcard').forEach(tds => {
    if(
        tds.storageName.toLowerCase() === 'sdcard' &&
        tds.default
    ) {
        mainGameFolder = 'others/' + mainGameFolder;
    }
});