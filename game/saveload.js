var savepath = 'save',
glbFileName = 'global',
saveFiles = {},
saveFilesReady = false;

function formSaveDir(slot) {
    var sfn;
    if(slot === glbFileName) {
        sfn = glbFileName;
    } else {
        sfn = savepath + numpad(slot, 2);
    }
    return formGameDir(`${savepath}/${sfn}.sav`);
}

function formSaveObject() {
    return {
        script: {
            file: null,
            position: null
        },
        variables: {},
        gameState: {
            music: null,
            screen: {
                background: null,
                sprites: [] //enforce order here, for layering...
            }
        },
        date: null
    }
}

function writeSaveFile(slot, callback) {
    var saveFile = saveFiles[slot], isgbl = (slot === glbFileName);
    if(saveFile || isgbl) {
        var saveFileLocation = formSaveDir(slot),
        absCallback = (p)=>{
            (callback || emptyFn)(p);
        },
        commitWrite = ()=>{
            var blobContents;
            if(isgbl) {
                blobContents = serializeGlobalVariables();
            } else {
                blobContents = serializeSaveFile(saveFile);
            }

            saveFile = new Blob([blobContents], {type: 'text/xml'});
            var writeAttempt = storage.addNamed(saveFile, saveFileLocation);
            writeAttempt.onsuccess = ()=>{
                absCallback(true);
            }
            writeAttempt.onerror = ()=>{
                absCallback(false);
            }
        },
        checkExisting = storage.get(saveFileLocation);

        checkExisting.onsuccess = ()=>{
            var deleteAttempt = storage.delete(saveFileLocation);
            deleteAttempt.onsuccess = ()=>{
                commitWrite();
            }
            deleteAttempt.onerror = ()=>{
                console.error('failed to delete', deleteAttempt);
                absCallback(false);
                //notify the user too
            }
        };

        checkExisting.onerror = ()=>{
            switch(checkExisting.error.name) {
                case 'NotFoundError':
                    commitWrite();
                    break;
                case 'SecurityError':
                default:
                    console.error(checkExisting);
                    absCallback(false);
                    //notify the user too
                    break;
            }
        }
    }      
}

function generateSaveFile(position) {
    var saveFile = formSaveObject();

    //script info
    saveFile.script.file = script.path;

    //check to see if the current instruction has a savetextindex
    var ci = script.instructions[position],
    stiKey = 'saveTextIndex';
    if(stiKey in ci) {
        saveFile.script.position = ci[stiKey];
    } else {
        return null;
    }

    //variables
    Object.assign(
        saveFile.variables,
        variables
    );

    //bgm
    var cbgm = sounds.bgmCurrentlyPlaying;
    if(cbgm) {
        saveFile.gameState.music = cbgm.path;
    }

    //screen's background
    var bgpath = display.screen.dataset.bgPath;
    if(bgpath) {
        saveFile.gameState.screen.background = bgpath;
    }

    //screen sprites
    var scrCh = display.screen.children;
    for(var i = 0; i < scrCh.length; i++) {
        var cs = scrCh[i];
        saveFile.gameState.screen.sprites.push({
            x: parseInt(cs.dataset.x),
            y: parseInt(cs.dataset.y),
            path: cs.dataset.path
        });
    }

    return saveFile;
}
function saveGameToFile(slot, callback) {
    callback = callback || emptyFn;
    if(lastValidSave) {
        var saveFile = lastValidSave;
        //date
        saveFile.date = new Date();
        //put it into a slot.
        saveFiles[slot] = saveFile;
        //additionally generate a thumbnail, update the list item, and mark where we saved
        generateSaveFileThumbnail(saveFile, (img)=>{
            saveFile.image = img;
        });
        updateSaveloadListEntry(slot, dateToString(saveFile.date));
        if(lastSaveEl) {
            var stb = (distanceToScrollBottom(display.textbox) === 0);
            lastSaveEl.classList.add('saved');
            if(stb) {
                textboxScrollToBottom();
            }
        }

        //okay, now we save it to disk.
        writeSaveFile(slot, (status)=>{
            if(status) {
                callback(true);
            } else {
                callback(false, 'An error occured while trying to write the file. Your save file is only available in this current session.');
            }
        });
    } else {
        //for the reason...
        callback(
            false,
            'At the moment, there is no place to save the game.'
        );
    }
}
var loadingGame = false;
function loadGameFromFile(slot, callback) {
    callback = callback || emptyFn;
    var csf = saveFiles[slot];
    if(csf) {
        var loadGame = ()=>{
            loadingGame = true;
            printSystemMessage(`Loaded game from slot ${slot}.`);
            /* var txtEl = printText(`Loaded game from slot ${slot}.`);
            txtEl.classList.add('systemMessage'); */
            pendingTextLine = csf.script.position;
    
            //varraibles
            //overwrite, preserve untouched variables
            /* Object.keys(csf.variables).forEach((vn)=>{
                variables[vn] = csf.variables[vn];
            }); */
            //completely start from a blank slate
            variables = {};
            Object.assign(
                variables,
                csf.variables
            );
            reassignGlobalVariables();
    
            //tunes
            stopSoundAll();
            if(csf.gameState.music) {
                playSound(
                    emptyFn,
                    csf.gameState.music,
                    soundsNameConst.bgm
                );
            }
    
            //graphgics
            setBackground(
                csf.gameState.screen.background,
                0
            ).exec();
    
            var ci = 0,
            di = ()=>{
                var spr = csf.gameState.screen.sprites[ci];
                if(spr) {
                    getImage(
                        fileTypeConsts.sprite,
                        spr.path,
                        (url)=>{
                            if(url) {
                                console.log(
                                    drawImage(
                                        url,
                                        spr.x,
                                        spr.y,
                                        spr.path
                                    )
                                )
                            }
                            ci++;
                            di();
                        }
                    );
                } else {
                    loadingGame = false;
                    showChoices(false);
                    inChoice = false;
                    locked = false;
                    pendingDelay = false;
                    pendingNewScreen = null;
                    loadScript(csf.script.file, (status)=>{
                        callback(status);
                        if(status){continueScript();}
                    });
                }
            };
    
            di();
        };

        if(pendingDelay) {
            console.log('load: delay interrupt sent.');
            window.addEventListener(
                delayInterruptRecieved.type,
                function pdofn() {
                    window.removeEventListener(
                        delayInterruptRecieved.type,
                        pdofn
                    );
                    loadGame();
                }
            );
            pendingDelayInterrupt = true;
            window.dispatchEvent(delayInterrupt);
        } else {
            loadGame();
        }
    } else {
        callback(false);
    }
}

var generateThumbnailsOnLoad = true;
function firstBootLoadSaves(progCallback) {
	progCallback = progCallback || emptyFn;
	//push list items
	for(i = 0; i < 100; i++) {
		let slmi = makeEl('div');
		let txt = makeEl('span');

		slmi.tabIndex = i;
		slmi.textContent = `Slot ${numpad(i, 2)}: `;
		slmi.classList.add('selectable');

		txt.textContent = 'Empty';
		slmi.appendChild(txt);

		saveloadMenuDisplay.list.appendChild(slmi);
	}

	return new Promise(function(resolve) {
		//load data
		let savesSeen = 0;
		let savesPending = 0;
		let savesLoaded = 0;
		
		let pendingOperations = [];
		
		function updateProgress() {
			progCallback(
				savesSeen,
				savesPending,
				savesLoaded	
			);
		};
		
		enumerateFiles(
			formGameDir(savepath),
			function(file) {
				if(savesSeen > 100) {
					return 'stop';
				} else {
					let filePath = splitPath(sf.name);
					let fileName = filePath[filePath.length - 1];
					let saveSlot = fileName.match(/^save(\d{2})\.sav$/i);
					let isGlobal = (fileName === (glbFileName + '.sav'));
					
					if(
						saveSlot ||
						isGlobal
					) {
						savesSeen++;
						savesPending++;
						pendingOperations.push(
							fileReaderA(file, 'text').then((saveText)=>{
								if(saveSlot) {
									saveSlot = parseInt(saveSlot[1]);
									let saveFile = parseSaveFile(saveText);
									if(saveFile) {
										saveFiles[saveSlot] = saveFile;
										updateSaveloadListEntry(
											saveSlot,
											dateToString(saveFile.date)
										);
										if(generateThumbnailsOnLoad) {
											pendingOperations.push(
												generateSaveFileThumbnail(saveFile).then((thumbDataUrl)=>{
													saveFile.image = thumbDataUrl;
													savesPending--;
													savesLoaded++;
												})
											);
										} else {
											savesPending--;
											savesLoaded++;
										}
									} else {
										savesPending--;
									}
									updateProgress();
								} else if(isGlobal) {
									let xml = (new DOMParser()).parseFromString(saveText, 'text/xml');
									let xmlBody = gblXml.querySelector('global');
									
									if(xmlBody) {
										let vars = gblXmlBody.getElementsByTagName('var');
										for(let i = 0; i < vars.length; i++) {
											let thisVar = parseSaveFileVariable(vars[i]);
											if(thisVar) {
												globalVariables[thisVar.name] = thisVar.value;
											}
										}
										reassignGlobalVariables();
									}
									
									savesPending--;
									savesLoaded++;
								} else {
									//??????
								}
							})
						);
					}
				}
			}
		)
		.then(()=>{return Promise.allResolved(pendingOperations);})
		.then(()=>{
			saveFilesReady = true;
			resolve();
		});
	});
}

//var saveFileThumbnailCanvas = makeEl('canvas').getContext('2d'),
function parseSaveFileDate(ds) {
    var dateParts = ds.match(/^(\d{2}):(\d{2}) (\d{4})\/(\d{2})\/(\d{2})$/);

    if(dateParts) {
        dateParts.splice(0,1);
        for(var i = 0; i < dateParts.length; i++) {
            dateParts[i] = parseInt(dateParts[i]);
        }
        //[0] hour, [1] minute, [2] year, [3] month, [4] day
        return new Date(Date.UTC(
            dateParts[2],
            dateParts[3] - 1,
            dateParts[4],
            dateParts[0],
            dateParts[1]
        ));
    } else {
        return null;
    }
}

function generateSaveFileThumbnail(saveFile) {
	return new Promise(function(resolve){
		//console.log('generating thumb');
		let cv = makeEl('canvas').getContext('2d');
		let saveFileThumbnailCanvasWidth = 100;

		cv.canvas.width = scaling.w;
		cv.canvas.height = scaling.h;

		cv.clearRect(
			0, 0,
			cv.canvas.width,
			cv.canvas.height
		);
		
		let imagesLoading = [];
		
		//bg
		if(saveFile.gameState.screen.background) {
			imagesLoading.push(
				getImage(
					'background',
					saveFile.gameState.screen.background
				).then((burl)=>{
					return {
						blobUrl: burl
					};
				})
			);
		}
		
		//all other sprites
		saveFile.gameState.screen.sprites.forEach((sprite)=>{
			imagesLoading.push(
				getImage(
					'sprite',
					sprite.path
				).then((burl)=>{
					return {
						originalSprite: sprite,
						blobUrl: burl
					};
				})
			);
		});
		
		Promise.all(imagesLoading).then((toDrawArray)=>{
			let currentDraw = 0;
			
			function drawNext(){
				let curDraw = toDrawArray.shift();
				if(curDraw) {
					let img = createImg(curDraw.blobUrl);
					
					img.addEventListener('error', drawNext);
					img.addEventListener('load', function(){
						let x = 0;
						let y = 0;
						let w = img.width;
						let h = img.height;
						
						if('originalSprite' in curDraw) {
							let os = curDraw.originalSprite;
							x = (os.x / baseScreenSize.w) * cv.canvas.width;
							y = (os.y / baseScreenSize.h) * cv.canvas.height;
						} else {
							let scale = canvasImgScale(cv, img);
							w *= scale;
							h *= scale;
							x = (cv.canvas.width / 2) - (w / 2);
							y = (cv.canvas.height / 2) - (h / 2);
						}
						
						cv.drawImage(
							img,
							x, y,
							w, h
						);
					});
				} else {
					//done
					let finalImg = createImg(cv.canvas.toDataURL());
					//orig width, height
					let ow = cv.canvas.width; 
					let oh = cv.canvas.height;
					//scaled width, scaled heigght
					let sw = saveFileThumbnailCanvasWidth;
					let sh = saveFileThumbnailCanvasWidth * (oh / ow);

					cv.canvas.width = sw;
					cv.canvas.height = sh;
					cv.clearRect(0, 0, sw, sh);
					finalImg.addEventListener('load', ()=>{
						cv.drawImage(
							finalImg,
							0, 0,
							sw, sh
						);
						resolve(cv.canvas.toDataURL('image/jpeg'));
					});
				}
			};
			
			drawNext();
		});
	
	});
}

function parseSaveFileVariable(cv) {
    var name = cv.getAttribute('name'),
    type = cv.getAttribute('type'),
    value = cv.getAttribute('value')
    ;

    if(name && type && value !== null) {
        switch(type) {
            case 'int':
                if(value.match(regexs.num.int)) {
                    value = parseInt(value);
                } else {
                    console.warn(`variable ${name} wasn't a valid number (int only), skipping`);
                    return;
                }
                break;

            case 'str':
                //it's already a string ;)
                break;
            
            default:
                console.warn(`variable ${name} does not have a valid type ("${type}"), skipping`);
                return;
        }
        //loadInstruction.variables[name] = value;
        return {
            name: name,
            value: value
        };
    } else {
        console.warn('a variable has one or more missing parameters, skipping.');
    }
}
function parseSaveFile(saveFile) {
    var saveFile = (new DOMParser()).parseFromString(saveFile, 'text/xml'),
    lgfe = (e)=>{console.error('loadGame: FATAL ERROR - ' + e);},
    lgwa = (w)=>{console.warn('loadGame: ' + w)},

    ftc = fileTypeConsts,
    getDirLen = (ft)=>{
        return fileTypeInfo[ft].dir.length + 1
    };

    if(saveFile.querySelector('parsererror')) {
        lgwa('the XML was malformed in some way, but we will still try to continue.');
    }

    if(saveFile.querySelector('save')) {
        var loadInstruction = formSaveObject();
    
        //get script path and position...
        var scriptInfo = saveFile.querySelector('script');
        if(scriptInfo) {
            //file path
            var fp = scriptInfo.querySelector('file');
            if(fp) {loadInstruction.script.file = fp.textContent.substr(getDirLen(ftc.script));}
    
            var pos = scriptInfo.querySelector('position');
            if(pos) {loadInstruction.script.position = pos.textContent;}
        } else {
            lgfe('script file not specified!!');
            return false;
        }
    
        //get variables
        var variablesList = saveFile.querySelector('variables');
        if(variablesList) {
            variablesList = variablesList.getElementsByTagName('var');
            for(var i = 0; i < variablesList.length; i++) {
                var tv = parseSaveFileVariable(variablesList[i]);
                if(tv !== undefined) {
                    loadInstruction.variables[tv.name] = tv.value;
                }
            }
        } else {
            lgwa('no variables list exists, it may or may not cause problems.');
        }

        //game state
        var gameState = saveFile.querySelector('state');
        if(gameState) {
            var music = gameState.querySelector('music'),
            bg = gameState.querySelector('background'),
            spriteList = gameState.querySelector('sprites');

            //music
            if(music) {
                music = music.textContent.substr(getDirLen(ftc.music));
                if(music !== '') {
                    loadInstruction.gameState.music = music;
                }
            } else {
                lgwa('<music> not exists.');
            }

            if(bg) {
                bg = bg.textContent.substr(getDirLen(ftc.background));
                if(bg !== '') {
                    loadInstruction.gameState.screen.background = bg;
                }
            } else {
                lgwa('<background> not exists.');
            }

            if(spriteList) {
                spriteList = spriteList.getElementsByTagName('sprite');
                for(var i = 0; i < spriteList.length; i++) {
                    var s = spriteList[i],
                    x = s.getAttribute('x'),
                    y = s.getAttribute('y'),
                    spath = s.getAttribute('path');
                    
                    if(x && y && spath) {
                        loadInstruction.gameState.screen.sprites.push({
                            path: spath.substr(getDirLen(ftc.sprite)),
                            x: x,
                            y: y
                        });
                    } else {
                        lgwa('a sprite has one or more missing parameters, skipping');
                    }
                }
            } else {
                lgwa('<sprites> not exists.');
            }

        } else {
            lgwa('<state> not exists.');
            return false;
        }

        //saved date
        //this is actually a string.
        var saveDate = saveFile.querySelector('date');
        if(saveDate) {
            loadInstruction.date = parseSaveFileDate(saveDate.textContent);
        }
		
		console.log('success load savefile');

        return loadInstruction;
    } else {
        lgfe('the saveFile wasn\'t wrapped in <save>, therefore this is an invalid file!');
    }   
}

function serializeSaveFile(saveFile) {
    var formDirWP = (fn, ft) =>{
        return fileTypeInfo[ft].dir + '/' + fn;
    },
    ftc = fileTypeConsts
    ;

    var sfxml = document.implementation.createDocument(null, 'save'),
    sfxmlBody = sfxml.querySelector('save');

    //script info
    var script = sfxml.createElement('script'),
    file = sfxml.createElement('file'),
    pos = sfxml.createElement('position');
    file.innerHTML = formDirWP(
        saveFile.script.file,
        ftc.script
    );
    pos.innerHTML = saveFile.script.position;
    script.appendChild(file);
    script.appendChild(pos);
    sfxmlBody.appendChild(script);

    //the date
    var dt = sfxml.createElement('date'), svdt = saveFile.date,
    hour = numpad(svdt.getUTCHours(), 2),
    min = numpad(svdt.getUTCMinutes(), 2),
    month = numpad(svdt.getUTCMonth() + 1, 2),
    day = numpad(svdt.getUTCDate(), 2);
    dt.innerHTML = `${hour}:${min} ${svdt.getUTCFullYear()}/${month}/${day}`;
    sfxmlBody.appendChild(dt);
    
    //variables
    var vars = sfxml.createElement('variables');
    Object.keys(saveFile.variables).forEach((varname)=>{
        var varSer = serializeVariable(
            sfxml,
            varname,
            saveFile.variables[varname]
        );

        if(varSer) {
            vars.appendChild(varSer);
        }
    });
    sfxmlBody.appendChild(vars);

    //gamestate
    var gamestate = sfxml.createElement('state');
    //the tunes
    var music = sfxml.createElement('music'),
    musicPath = saveFile.gameState.music;
    if(musicPath) {
        musicPath = formDirWP(
            musicPath,
            ftc.music
        );
    }
    music.innerHTML = musicPath || '';
    gamestate.appendChild(music);
    //background image
    var bg = sfxml.createElement('background'),
    bgPath = saveFile.gameState.screen.background;
    if(bgPath) {
        bgPath = formDirWP(
            bgPath,
            ftc.background
        );
    }
    bg.innerHTML = bgPath || '';
    gamestate.appendChild(bg);
    //sprites
    var sprites = sfxml.createElement('sprites');
    saveFile.gameState.screen.sprites.forEach((spriteInfo)=>{
        var ts = sfxml.createElement('sprite');
        ts.setAttribute('path', formDirWP(spriteInfo.path, ftc.sprite));
        ts.setAttribute('x', spriteInfo.x);
        ts.setAttribute('y', spriteInfo.y);
        sprites.appendChild(ts);
    });
    gamestate.appendChild(sprites);
    sfxmlBody.appendChild(gamestate);

    //at the end
    return (new XMLSerializer()).serializeToString(sfxml);
}

//saveload menu
var saveloadMenuDisplay = {
    container: eid('saveload-menu-container'),
    main: eid('saveload-menu'),
    list: eid('saveload-menu-list'),
    infoPanel: {
        img: eid('saveload-menu-infopanel-img'),
        title: eid('saveload-menu-infopanel-title'),
        text: eid('saveload-menu-infopanel-text')
    }
},
saveloadAction;

function updateSaveloadListEntry(slot, text) {
    var li = saveloadMenuDisplay.list.children[slot];
    if(li) {
        li.children[0].textContent = text;
    }
}

function saveloadMenuShow(action) {
    curpage = 2;
    hidePauseMenuToShowSubMenu();
    toggleHiddenClass(saveloadMenuDisplay.container, false);
    saveloadAction = action;

    saveloadMenuDisplay.list.children[0].focus();
    saveloadMenuUpdate();
}
function saveloadMenuUpdate() {
    if(saveFilesReady) {
        var tsf = saveFiles[actEl().tabIndex],
        thumb;
        if(tsf) {
            if(tsf.image) {
                thumb = tsf.image;
            } else {
                thumb = '/img/loadingSaveThumbnail.png';
                setTimeout(()=>{
                    generateSaveFileThumbnail(tsf, (thumbDataUrl)=>{
                        saveloadMenuUpdate();
                        tsf.image = thumbDataUrl;
                    });
                }, 250); //set timeout in order to make sure that the "now saving" message is shown.
            }
        } else {
            thumb = '/img/placeholder-thumbnail.png';
        }
        saveloadMenuDisplay.infoPanel.img.src = thumb;

        var sfIndex = actEl().tabIndex,
        curSaveFile = saveFiles[sfIndex];
        saveloadMenuDisplay.infoPanel.title.textContent = `Slot ${numpad(sfIndex, 2)}`;

        var text = 'Empty Slot';

        if(curSaveFile) {
            text = dateToString(curSaveFile.date);
        }

        saveloadMenuDisplay.infoPanel.text.textContent = text;
    }
}
function dateToString(dateObj) {
    if(dateObj instanceof Date) {
        return dateObj.toLocaleString(
            navigator.language,
            {
                timeStyle: 'short',
                dateStyle: 'short'
            }
        );
    } else {
        return '?';
    }
}
function saveloadGetActiveFile() {
    return saveFiles[actEl().tabIndex];
}
function saveloadCheckActElSlot() {
    return actEl().tabIndex in saveFiles;
}
function saveloadMenuK(k) {
    if(keyisnav(k)) {
        k.preventDefault();
        if(!saveFilesReady) {
            return;
        }
    }

    var sml = saveloadMenuDisplay.list.children, curn = actEl().tabIndex;

    switch(k.key) {
        case 'Enter':
            //save, then fall through
            if(saveFilesReady) {
                var fileExists = saveloadCheckActElSlot(),
                selSlot = actEl().tabIndex;

                var saveloadActionDone = ()=>{
                    messageBoxHide();
                    unpause();
                    updatenavbar();
                };

                switch(saveloadAction) {
                    case 0: //save
                        var commitSave = ()=>{
                            messageBox(
                                'Saving...',
                                'Do not quit the application or turn off your device.',
                                {
                                    back: messageBoxOption(emptyFn, null, true)
                                }
                            );
                            var write = ()=>{
                                setTimeout(()=>{
                                    saveGameToFile(selSlot, (suc, err)=>{
                                        if(suc) {
                                            saveloadActionDone();
                                        } else {
                                            var act = messageBoxOption(unpause, 'ok');
                                            messageBox(
                                                'Error.',
                                                'Failed to save game. ' + err,
                                                {
                                                    center: act,
                                                    back: act
                                                }
                                            );
                                        }
                                    });
                                }, 50);
                            }
                            if(pendingDelay) {
                                var pdofn = ()=>{
                                    window.removeEventListener('pendingdelayover', pdofn);
                                    write();
                                }
                                window.addEventListener('pendingdelayover', pdofn);
                            } else {
                                write();
                            }
                        };
                        if(fileExists) {
                            messageBox(
                                'Overwrite Save?',
                                'Do you want to overwrite this save file?',
                                {
                                    left: messageBoxOption(messageBoxDefaultBackCallback, 'no'),
                                    right: messageBoxOption(commitSave, 'yes', true)
                                }
                            );
                        } else {
                            commitSave();
                        }
                        break;
                    case 1: //load
                        if(fileExists) {
                            messageBox(
                                'Loading...',
                                'Please wait. Depending on your device, this may take some time.',
                                {
                                    back: messageBoxOption(emptyFn, null, true)
                                }
                            );
                            loadGameFromFile(selSlot, (suc)=>{
                                if(suc) {
                                    saveloadActionDone();
                                } else {
                                    messageBox(
                                        'Error.',
                                        'Failed to load save file.',
                                        {
                                            center: messageBoxOption(messageBoxDefaultBackCallback, 'ok'),
                                        }
                                    );
                                }
                            });
                        }
                        break;
                }
            }
            break;
        case 'Backspace':
            k.preventDefault();
            unhidePauseMenu();
            pause();
            break;
        case 'ArrowUp':   navigatelist(curn, sml,  -1); break;
        case 'ArrowDown': navigatelist(curn, sml,   1); break;
        case 'ArrowLeft': navigatelist(curn, sml, -10); break;
        case 'ArrowRight':navigatelist(curn, sml,  10); break;
    }
    saveloadMenuUpdate();
}