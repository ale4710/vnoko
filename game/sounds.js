var sounds = {
    sfx: [],
    sfxUrls: {},
    bgm: {},
    bgmUrls: {},
    bgmCurrentlyPlaying: null
},

soundsProgressElement = makeEl('div'),

soundsNameConst = {
    sfx: 1,
    bgm: 2
};

soundsProgressElement.id = 'sounds-progress';
soundsProgressElement.classList.add('vcenter');

//sfx handler, loops and such
setInterval(()=>{
    var soundsInUse = [];
    for(var i = 0; i < sounds.sfx.length;) {
        var ts = sounds.sfx[i];

        if(ts.sound.paused) { //if it is looping forever it will never pause ;)
            if(ts.playRemain <= 0) { //it is "<=" so that stopped infinite loops will be removed.
                var rmSnd = sounds.sfx.splice(i,1)[0],
                pb = rmSnd.progbar;
                if(pb) {pb.remove()}
                continue;
            } else {
                ts.playRemain--;
                ts.sound.play();
            }
        } else {
            if(ts.loops >= 0) {
                var pb = ts.progbar;
                if(!pb) {
                    var d = makeEl('div'), di = makeEl('div');
                    d.appendChild(di);

                    //soundsProgressElement.appendChild(d); //insert at the end
                    htmlInsertTop( //insert into top
                        d,
                        soundsProgressElement
                    );
                    
                    pb = d;
                    ts.progbar = d;
                }

                var total = ts.loops * ts.sound.duration,
                passedLoops = (ts.loops - (ts.loops - ts.playRemain)) * ts.sound.duration,
                passed = passedLoops + ts.sound.currentTime,
                percent = Math.max(0, passed / total) * 100;

                //console.log(ts.sound.currentTime, ts.sound.duration);
                //console.log(ts.loops, ts.playRemain, passedLoops, passed, total, percent);

                pb.children[0].style.width = percent + '%';
            }
        }

        //it was not removed from the sfx queue, therefore it is in use
        soundsInUse.push(ts.path);

        i++;
    }

    Object.keys(sounds.sfxUrls).forEach((path)=>{
        if(soundsInUse.indexOf(path) === -1) {
            URL.revokeObjectURL(sounds.sfxUrls[path]);
            delete sounds.sfxUrls[path];
        }
    })

}, 75);


function stopSound(which) {
    switch(which) {
        case soundsNameConst.sfx:
            for(var i = 0; i < sounds.sfx.length; i++) {
                sounds.sfx[i].sound.pause();
            }
            //it will be cleared by the above setinteval code
            //sounds.sfx = [];
            break;
        case soundsNameConst.bgm:
            var sbcp = sounds.bgmCurrentlyPlaying;
            if(sbcp) {
                if(!isNaN(sbcp.sound.duration)) {
                    sbcp.sound.pause();
                    sbcp.sound.currentTime = 0;
                }
                sounds.bgmCurrentlyPlaying = null;
            }
            break;
    }
}

function stopSoundAll() {
    [
        soundsNameConst.sfx,
        soundsNameConst.bgm
    ].forEach((w)=>{
        stopSound(w);
    });
}

function playSound(path, how, loops) {
	return new Promise(function(topResolve, topReject){
		let soundGetPromise;

		if(path) {
			let urlStore;
			switch(how) {
				case soundsNameConst.bgm: urlStore = sounds.bgmUrls; break;
				case soundsNameConst.sfx: urlStore = sounds.sfxUrls; break;
			}

			let esObjUrl = urlStore[path];
			if(esObjUrl) {
				if(esObjUrl.loading) {
					soundGetPromise = (new Promise((resolve)=>{
						esObjUrl.pending.push({
							how: how,
							loops: loops,
							resolve: resolve
						});
					}));
				} else if(esObjUrl.fail) {
					topResolve();
				} else {
					soundGetPromise = Promise.resolve({
						blobUrl: esObjUrl,
						how: how,
						loops: loops
					});
				}
			} else {
				let fileType = fileTypeConsts.sound;
				
				console.log('get sound anew');
				loadingResource++;

				soundGetPromise = new Promise((resolve)=>{
					let thisSndObj = {
						loading: true,
						pending: [{
							how: how,
							loops: loops,
							resolve: resolve
						}]
					};
					
					urlStore[path] = thisSndObj;
					getFile(
						fileType, //sound and music use the same directory
						path
					).then((data)=>{
						if(how === soundsNameConst.sfx) {loadingResource--;}
						
						let objectUrl;
						
						if(data.file) {
							objectUrl = URL.createObjectURL(data.file);
							urlStore[path] = objectUrl;
						} else {
							if(how === soundsNameConst.bgm) {
								stopSound(soundsNameConst.bgm);
								loadingResource--;
								thisSndObj = {fail: true}
							}
							callback();
						}
						data = undefined; //never used again
						
						thisSndObj.pending.forEach((pendingSound)=>{
							let psResolve = pendingSound.resolve;
							if(objectUrl) {
								delete pendingSound.resolve;
								pendingSound.blobUrl = objectUrl;
								psResolve(pendingSound);
							} else {
								psResolve();
							}
						});
					});
				});
			}
			
			if(soundGetPromise instanceof Promise) {
				soundGetPromise.then((soundInfo)=>{
					if(soundInfo) {
						let loopCount = soundInfo.loops;
						
						switch(soundInfo.how) {
							case soundsNameConst.sfx:
								//sound effect
								if(
									isNaN(loopCount) ||
									!isFinite(loopCount)
								) {
									loopCount = 1;
								}

								switch(loopCount) {
									case undefined:
									case null:
										loopCount = 1;
										break;
									case 0:
										//play it... no times...?
										setTimeout(topResolve);
										return;
								}

								var audio = new Audio(soundInfo.blobUrl);
								audio.loop = (loopCount === -1);
								audio.play();

								sounds.sfx.push({
									playRemain: loopCount - 1,
									loops: loopCount,
									path: path,
									sound: audio
								});
								setTimeout(topResolve);
								break;

							case soundsNameConst.bgm:
								let bgm = sounds.bgm[path];
								let bgmPromise;
								
								if(bgm) {
									bgmPromise = Promise.resolve();
								} else {
									bgmPromise = new Promise((resolve)=>{
										bgm = new Audio(soundInfo.blobUrl);
										bgm.loop = true;
										bgm.addEventListener('canplay', resolve);
										bgm.addEventListener('error', resolve);
									});
								}
								
								bgmPromise.then(()=>{
									stopSound(soundsNameConst.bgm);
									sounds.bgmCurrentlyPlaying = {
										sound: bgm,
										path: path
									};
									sounds.bgm[path] = bgm;
									if(!isNaN(bgm.duration)) {
										bgm.play();
									}
									setTimeout(topResolve);
								});
								break;
						}
					}
				});
			}
		} else {
			topReject('path is not specified');
		}
	});
}