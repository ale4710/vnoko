var loading = true;

window.addEventListener('DOMContentLoaded', ()=>{ //load the stuff.
	//some misc stuff
	if(getSettingValue('default-display-mode') === 1) {
		toggleNvlMode(true);
	}

	printTextMaxOverflow = getSettingValue('backlog-history-max-length');

	eid('textbox').style.setProperty('--fontSize', getSettingValue('font-size') + 'px');
	
	function updateText(txt) {
		eid('loading-overlay-text').textContent = txt;
	};
	
	let fti = fileTypeInfo;
	let ftc = fileTypeConsts;
	
	//check archives
	let archivesToLoad = [];
	[
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
	].forEach((archiveLoadInfo)=>{
		archivesToLoad.push(
			getFile(
				-1,
				archiveLoadInfo.dir + '.zip'
			).then((data)=>{
				if(data.file) {
					return JSZip.loadAsync(data.file, {createFolders: true});
				} else {
					return Promise.reject();
				}
			}).then((zip)=>{
				var ap = archiveLoadInfo.dir + '/';
				if(zip.files[ap]) {
					archiveLoadInfo.assignTo.forEach((fo)=>{
						fo.archive = zip;
						fo.archivePrefix = ap;
					});
				}
			})
		);
	});
	
	updateText('Loading archives...');
	//wait for archives. then...
	Promise.allSettled(archivesToLoad).then(()=>{
		let promises = [];
		
		//get the info
		promises.push(
			requestFile(formGameDir('info.txt')).then((data)=>{
				return new Promise((printTitle)=>{
					checkInfoFile(data).then((title)=>{
						printTitle(title || gamedir);
					});
				});
			})
			.catch(()=>{
				return Promise.resolve(gamedir);
			})
			.then((title)=>{
				pauseMenuItems.title.textContent = title;
			})
		);

		promises.push(
			requestFile(formGameDir('icon.png')).then((imgBlob)=>{
				pauseMenuItems.icon.src = URL.createObjectURL(imgBlob);
			})
		);

		if(getSettingValue('use-novel-font') === 1) {
			promises.push(
				requestFile(formGameDir('default.ttf')).then((fontblob)=>{
					loadFont(
						fontblob,
						'novelCustomFont'
					);
				})
			);
		}

		promises.push(
			requestFile(formGameDir('img.ini')).then((imginiBlob)=>{
				return fileReaderA(imginiBlob, 'text');
			}).then((imgini)=>{
				let sizes = {};
				let validSizes = [
					'width',
					'height'
				];
				let lines = restxt.split(scriptPatterns.newline);
				
				lines.forEach((line)=>{
					let opt = line.split('=');
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
				
				return firstBootLoadSaves();
			})
		);
		
		return Promise.allSettled(promises);
	}).then(()=>{
		fullscreenToggle(true);
		eid('loading-overlay').remove();
		loadScript('main.scr').then(continueScript);
		loading = undefined;
	});

	blankTextBox();
});