(function(){
	//display
	function outputDisplay(msg) {
		eid('loading-in').textContent = msg;
	};
	outputDisplay('Starting...');
	
	//make path valid fn
	function makePathValid(dp){
		return dp.substring(dp.indexOf(mainGameFolder));
	};
	
	//local storage key
	let novelListLSKey = 'novelList';
	
	//variable to set for final data
	let finalData;

	//let's begin...!
	(new Promise(function(resolve) {
		let savedNovelList = localStorage.getItem(novelListLSKey);
		if(savedNovelList) {
			outputDisplay('Retriving Files...');
			savedNovelList = JSON.parse(savedNovelList);
			
			let pendingFileOperations = [];
			
			Object.keys(savedNovelList).forEach((key)=>{
				let curNovel = savedNovelList[key];
				//images
				[
					'icon',
					'thumbnail'
				].forEach((imgKey)=>{
					if(imgKey in curNovel) {
						pendingFileOperations.push(
							requestFile(
								makePathValid(curNovel[imgKey])
							).then(function(file){
								curNovel[imgKey] = file;
							}).catch(function(){
								//something wrong happened getting the file
								delete curNovel[imgKey];
							})
						);
					}
				});
			});
			
			if(pendingFileOperations.length === 0) {
				pendingFileOperations = Promise.resolve();
			} else {
				pendingFileOperations = Promise.allSettled(pendingFileOperations);
			}
			
			pendingFileOperations.then(function() {
				finalData = savedNovelList;
				resolve();
			});
		} else {
			savedNovelList = undefined;
			outputDisplay('Retrieving directory listing...');
			//scan for real
			let collectedDirectories = {};
			let pendingPromises = [];
			
			let novFolder = mainGameFolder + '/' + novelsFolder;
			
			enumerateFiles(novFolder, function(file){
				outputDisplay(`Checking file ${file.name}`);
				
				let pathParts = splitPath(
					file.name.substr(
						file.name.indexOf(novFolder) +
						novFolder.length + 1
					)
				);
				
				//see if this is a subdirectory of the main directory
				//we cut out the main folder already so no need to worry about that
				if(pathParts.length !== 0) {
					let gameDir = pathParts.shift();
					let ppLen = pathParts.length;
					let fileNameFull = pathParts[ppLen - 1];
					let fileType = file.type.split('/');
					let fileName, fileExt;
					
					if(fileNameFull) {
						let dot = fileNameFull.lastIndexOf('.');
						fileName = fileNameFull.substring(0,dot);
						fileExt = fileNameFull.substr(dot + 1);
					}
					
					//see if the directory has been captured
					let thisDirObj = collectedDirectories[gameDir];
					if(!thisDirObj) {
						//if not exists then we will just put it ourselves
						thisDirObj = {};
						collectedDirectories[gameDir] = thisDirObj;
					}
					
					if(ppLen === 1) {
						//it is a file at the root of the dir
						let ffnFound = true;
						
						switch(fileNameFull) {
							case 'script.zip':
								pendingPromises.push(
									JSZip.loadAsync(file, {createFolders: true}).then(function(zip){
										if(zip.files['script/main.scr']) {
											thisDirObj.hasMain = true;
										}
									})
								);
								break;
							default:
								ffnFound = false;
								break;
						}
						
						if(!ffnFound) {
							switch(fileName) {
								case 'icon':
									if(fileType[0] === 'image') {
										thisDirObj.icon = file;
									}
									break;
								case 'thumbnail':
									if(fileType[0] === 'image') {
										thisDirObj.thumbnail = file;
									}
									break;
								case 'info':
									if(file.type === 'text/plain') {
										pendingPromises.push(
											checkInfoFile(file).then(function(title) {
												thisDirObj.title = title;
											})
										);
									}
									break;
							}
						}
					} else {
						//in a subdirectory
						
						//check script/main.scr
						if(
							fileNameFull === 'main.scr' &&
							pathParts[0] === 'script' &&
							ppLen === 2
						) {
							thisDirObj.hasMain = true;
						}
					}
				}
			}) //end enumerateFiles handlefn
			.then(function(){
				outputDisplay('Waiting for pending operations...');
				return Promise.allSettled(pendingPromises);
			})
			.then(function(){ //pendingPromises is resolved
				//note: everything here is syncronous
				
				//confirm to see if the directory has the minimum requirement to be a novel
				//a novel needs at VERY VERY minimum, a main.scr file, or a script.zip with main.scr inside.
				Object.keys(collectedDirectories).forEach((dirName)=>{
					let dir = collectedDirectories[dirName];

					//see if it has a main
					if(!dir.hasMain) {
						//no main. invalid novel.
						delete collectedDirectories[dirName];
					} else {
						//it does have a main
						delete dir.hasMain;

						//does it have a title
						if(dir.title === null) {
							//if not just set it to the directory;s name
							dir.title = dirName;
						}
					}
				});

				//put into localStorage
				localStorage.setItem(
					novelListLSKey,
					JSON.stringify(
						collectedDirectories,
						(k, v)=>{ //replacer fn
							if(v instanceof File) {
								return v.name;
							} else {
								return v;
							}
						}
					)
				);
				
				finalData = collectedDirectories;
				resolve();
			});
		}
	})).then(function(){
		novelProps = finalData;
		printNovels();
	}).catch(function(err) {
		console.error(err);
		outputDisplay('An error occured...');
	});
})();