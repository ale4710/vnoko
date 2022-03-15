var te;

(()=>{
    var loadingDisp = eid('loading-in'),
    pendingOperations = 0,
    doneLooking = false,
    savedNovelList = localStorage.getItem('novelList'),
    allDone = emptyFn,
    checkDone = ()=>{
        allDone(
            pendingOperations === 0 &&
            doneLooking
        );
    };

    eid('loading-in').textContent = 'Starting...';

    if(savedNovelList) {
        loadingDisp.innerHTML = 'Retriving Files...';
        savedNovelList = JSON.parse(savedNovelList);

        doneLooking = true;

        allDone = (done)=>{
            if(done) {
                novelProps = savedNovelList;
                printNovels();
            }
        };

        var makePathValid = (dp)=>{
            return dp.substring(dp.indexOf(mainGameFolder));
        };

        Object.keys(savedNovelList).forEach((key)=>{
            var curNovel = savedNovelList[key];
            //images
            [
                'icon',
                'thumbnail'
            ].forEach((imgKey)=>{
                if(imgKey in curNovel) {
                    pendingOperations++;
                    var fr = storage.get(
                        makePathValid(curNovel[imgKey])
                    );

                    console.log(makePathValid(curNovel[imgKey]));

                    fr.onsuccess = ()=>{
                        curNovel[imgKey] = fr.result;
                        pendingOperations--;
                        checkDone();
                    };

                    fr.onerror = ()=>{
                        //curNovel[imgKey] = `placeholder-${imgKey}.png`;
                        delete curNovel[imgKey];
                        console.error(fr);
                        pendingOperations--;
                        checkDone();
                    }
                }
            });
        });
    } else {
        var novFolder = mainGameFolder + '/' + novelsFolder,
        novEnum = storage.enumerate(novFolder),
        seenDirs = 0,
        seenFiles = 0,
        collectedDirectories = {},

        printStatus = ()=>{
            loadingDisp.innerHTML = `Loading!!!<br>Seen directories: ${seenDirs}<br>Seen files: ${seenFiles}`;
        };

        te = novEnum;


        allDone = (done)=>{
            printStatus();

            if(done) {
                //confirm to see if the directory has the minimum requirement to be a novel
                //a novel needs at VERY VERY minimum, a main.scr file, or a script.zip with main.scr inside.
                var cdKeys = Object.keys(collectedDirectories);

                cdKeys.forEach((dir)=>{
                    var td = collectedDirectories[dir];

                    //see if it has a main
                    if(!td.hasMain) {
                        //no main. invalid novel.
                        delete collectedDirectories[dir];
                    } else {
                        //it does have a main
                        delete td.hasMain;

                        //does it have a title
                        if(td.title === null) {
                            //if not just set it to the directory;s name
                            td.title = dir;
                        }
                    }
                });

                novelProps = collectedDirectories;
                //put into localStorage
                (()=>{
                    localStorage.setItem(
                        'novelList',
                        JSON.stringify(
                            novelProps,
                            (k, v)=>{
                                if(v instanceof File) {
                                    return v.name;
                                } else {
                                    return v;
                                }
                            }
                        )
                    );
                })();

                printNovels();
            }
            
        };

        novEnum.onsuccess = ()=>{
            var file = novEnum.result;
            if(file) {
                seenFiles++;
                printStatus();
    
                var pathParts = splitPath(
                    file.name.substr(
                        file.name.indexOf(novFolder) +
                        novFolder.length + 1
                    )
                ),
                ppLen = pathParts.length;
    
                //see if this is a subdirectory of the main directory
                //we cut out the main folder already so no need to worry about that
                if(ppLen !== 0) {
                    //get the directory
                    var gameDir = pathParts.shift(),
                    ppLen = pathParts.length,
                    fileNameFull = pathParts[ppLen - 1],
                    fileType = file.type.split('/'),
                    fileName,
                    fileExt;
    
                    if(fileNameFull) {
                        var dot = fileNameFull.lastIndexOf('.');
                        fileName = fileNameFull.substring(0,dot);
                        fileExt = fileNameFull.substr(dot + 1);
                    }
    
                    /* console.log(
                        pathParts,
                        gameDir,
                        fileNameFull,
                        fileName,
                        fileType,
                        fileName,
                        fileExt
                    ); */
    
                    /* 
                        pathParts (after .shift()ing it):
                        [folder, filename] //note: it can keep going.
                        [filename] //this is at the root of the game directory
                     */
    
                    //see if the directory has been captured
                    var thisDirObj = collectedDirectories[gameDir];
                    if(!thisDirObj) {
                        //if not exists then we will just put it ourselves
                        thisDirObj = {};
                        collectedDirectories[gameDir] = thisDirObj;
                        seenDirs++;
                    }
    
                    var apo = ()=>{pendingOperations++;}, //add pending operation
                    pod = ()=>{
                        //pending operation done
                        pendingOperations--;
                        checkDone();
                    };
    
    
    
                    if(ppLen === 1) {
                        //it is a file at the root of the dir
                        switch(fileNameFull) {
                            case 'script.zip':
                                JSZip.loadAsync(file, {createFolders: true}).then((zip)=>{
                                    if(zip.files['script/main.scr']) {
                                        thisDirObj.hasMain = true;
                                    }
                                    pod();
                                }).catch((e)=>{
                                    console.error(e);
                                    pod();
                                });
                                apo();
                                break;
                            default:
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
                                            checkInfoFile(file, (title)=>{
                                                thisDirObj.title = title;
                                                pod();
                                            });
                                            apo();
                                        }
                                        break;
                                }
                        }
                    } else {
                        //in a subdirectory
                        
                        //script/main.scr
                        if(
                            fileNameFull === 'main.scr' &&
                            pathParts[0] === 'script' &&
                            ppLen === 2
                        ) {
                            thisDirObj.hasMain = true;
                        }
                    }
    
                }
    
                novEnum.continue();
            } else {
                //done.
                doneLooking = true;
                checkDone();
            }
        };
    
        novEnum.onerror = (e)=>{
            console.error(e);
        }
    }
})();