var loading = true;

window.addEventListener('DOMContentLoaded', ()=>{ //load the stuff.
	//some misc stuff
	if(getSettingValue('default-display-mode') === 1) {
		toggleNvlMode(true);
	}

	printTextMaxOverflow = getSettingValue('backlog-history-max-length');

	eid('textbox').style.setProperty('--fontSize', getSettingValue('font-size') + 'px')

	//ok load for real
    var updateText = (txt)=>{
		eid('loading-overlay-text').textContent = txt;
	},
	fti = fileTypeInfo, ftc = fileTypeConsts,
	archives = [
		{ //scripts
			dir: fti[ftc.script].dir,
			assignTo: [fti[ftc.script]]
		},
		{ //foreground
			dir: fti[ftc.sprite].dir,
			assignTo: [fti[ftc.sprite]]
		},
		{ //background
			dir: fti[ftc.background].dir,
			assignTo: [fti[ftc.background]]
		},
		{ //sounds
			dir: fti[ftc.sound].dir,
			assignTo: [fti[ftc.sound], fti[ftc.music]]
		}
	],
	startGame = ()=>{
		loadScript('main.scr', continueScript);
		fullscreenToggle(true);
		eid('loading-overlay').remove();
		loading = undefined;
	},
	loadSaves = ()=>{
		updateText('Scanning save file directory...');
		firstBootLoadSaves(
			()=>{
				/* if(curpage === 1) { //on saveload menu
					saveloadMenuShow(saveloadAction);
				} */
				startGame();
			},
			(sl, ss, sr)=>{
				updateText(`Loading save files... detected ${ss}, ${sr} remaining to be processed.`);
			}
		);
	},
	load = ()=>{
        var la = archives[0];
        archives.splice(0,1);
        if(la === undefined) {
			//every possible resource archive has been checked and loaded

            //get the info
            requestFile(formGameDir('info.txt'), (e)=>{
				var setTitle = (t)=>{
					pauseMenuItems.title.textContent = t;
				};

				
                var data = e.target.result;
				//console.log(e, data);
                if(data) {
					checkInfoFile(
						data,
						(title)=>{
							setTitle(title || gamedir);
						}
					);
                } else {
					setTitle(gamedir);
				}
            });

            requestFile(formGameDir('icon.png'), (e)=>{
                var imgBlob = e.target.result;
                if(imgBlob) {
                    pauseMenuItems.icon.src = URL.createObjectURL(imgBlob);
                }
            });

			if(getSettingValue('use-novel-font') === 1) {
				requestFile(formGameDir('default.ttf'), (e)=>{
					var fontblob = e.target.result;
					if(fontblob) {
						loadFont(
							fontblob,
							'novelCustomFont'
						);
					}
				});
			}

            //"directories" loaded. check img.ini
			updateText('Looking for img.ini...');
			requestFile(formGameDir('img.ini'), (e)=>{
				var imgini = e.target.result;
				if(imgini) {
					blobToText(
						imgini,
						(restxt)=>{
							var sizes = {},
							validSizes = [
								'width',
								'height'
							],
							lines = restxt.split(scriptPatterns.newline);
							lines.forEach((line)=>{
								var opt = line.split('=');
								if(opt.length === 2) {
									if(
										validSizes.indexOf(opt[0]) !== -1 &&
										opt[1].match(regexs.num.int)
									) {
										sizes[opt[0]] = parseInt(opt[1]);
									}
								}
							});
							
							if(
								validSizes[0] in sizes &&
								validSizes[1] in sizes
							) {
								updateScaling(
									sizes.width,
									sizes.height
								);
							}
							
							loadSaves();
						}
					);
				} else {
					loadSaves();
				}
			});
        } else {
			updateText(`Looking for ${la.dir} archive...`);
            var rsc = (data)=>{
                if(data) {
                    JSZip.loadAsync(data, {createFolders: true}).then((zip)=>{
                        var ap = la.dir + '/';
                        if(zip.files[ap]) {
                            la.assignTo.forEach((fo)=>{
								fo.archive = zip;
								fo.archivePrefix = ap;
							});
                        }
                        load();
                    });
                } else {
                    load();
                }
            };

            getFile(
                -1,
                `${la.dir}.zip`,
                rsc
            );
        }
    };
    load();

	blankTextBox();
});