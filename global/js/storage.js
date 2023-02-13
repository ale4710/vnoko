var mainGameFolder = '.vnoko',
novelsFolder = 'novels',
storage = getb2g().getDeviceStorage('sdcard');

function formDir(relFilePath) {
    return `${mainGameFolder}/${relFilePath}`;
}
function requestFile(path) {
	return new Promise(function(resolve, reject){
		let rq = storage.get(path);

		rq.onsuccess = (e)=>{
			//console.log(e.target.result);
			resolve(e.target.result);
		};
		rq.onerror = (e)=>{
			console.error(path, e.target.error);
			reject(e);
		}
	});
}

function enumerateFiles(path, handlefn) {
	return new Promise(function(resolve, reject){
		let dsEnum = storage.enumerate(path);
		if(checkb2gns()) {
			//3.0
			let fileIterate = dsEnum.values();
			function reciever(iterateRetv) {
				if(iterateRetv.done) {
					resolve();
				} else {
					let handlefnrv = handlefn(iterateRetv.value);
					if(handlefnrv === 'stop') {
						resolve();
					} else {
						next();
					}
				}
			};
			
			function next() {
				fileIterate.next()
				.then(reciever)
				.catch(reject);
			};
			
			next();
		} else {
			//not 3.0
			dsEnum.addEventListener('success', function(ev) {
				if(ev.target.done) {
					resolve();
				} else {
					let handlefnrv = handlefn(ev.target.result);
					if(handlefnrv === 'stop') {
						resolve();
					} else {
						ev.target.continue();
					}
				}
			});
			
			dsEnum.addEventListener('error', function(ev) {
				reject(e);
			});
		}
	});
}

getb2g().getDeviceStorages('sdcard').forEach(tds => {
    if(
        tds.storageName.toLowerCase() === 'sdcard' &&
        tds.default
    ) {
        mainGameFolder = 'others/' + mainGameFolder;
    }
});