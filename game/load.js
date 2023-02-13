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

function getFile(type, filename, responseType) { //returns a promise
	if(type === -1) {
		return requestFile(formGameDir(filename)).then((file)=>{
			return {
				file: file,
				source: requestTypes.fs
			};
		});
	} else {
		let thisFileType = fileTypeInfo[type];
		let returnValue = {
			file: null
		};
		if(thisFileType.archive) {
			returnValue.source = requestTypes.zip;
			let archiveFile = thisFileType.archive.files[thisFileType.archivePrefix + filename];
			if(archiveFile) {
				return archiveFile.async(responseType || 'blob').then((file)=>{
					returnValue.file = file;
					return returnValue;
				}).catch((err)=>{
					console.error(err);
					returnValue.error = err;
					return returnValue;
				})
			} else {
				return Promise.resolve(returnValue);
			}
		} else {
			returnValue.source = requestTypes.fs;
			return requestFile(formGameDir(`${fileTypeInfo[type].dir}/${filename}`)).then((file)=>{
				returnValue.file = file;
				return returnValue;
			}).catch((err)=>{
				returnValue.error = err;
				return returnValue;
			});
		}
	}
}