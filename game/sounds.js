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

function playSound(callback, path, how, loops) {
    var actuallyPlaySound = (url, h, l)=>{
        switch(h) {
            case soundsNameConst.sfx:
                //sound effect
                var caloop = false;

                if(
                    isNaN(l) ||
                    !isFinite(l)
                ) {
                    l = 1;
                }

                switch(l) {
                    case undefined:
                    case null:
                        l = 1;
                        break;
                    case 0:
                        //play it... no times...?
                        setTimeout(callback);
                        return;
                    case -1:
                        caloop = true;
                        break;
                }

                var ca = new Audio(url);
                ca.loop = caloop;
                ca.play();

                sounds.sfx.push({
                    playRemain: l - 1,
                    loops: l,
                    path: path,
                    sound: ca
                });
                setTimeout(callback);
                break;

            case soundsNameConst.bgm:
                var bgm = sounds.bgm[path],
                play = ()=>{
                    stopSound(soundsNameConst.bgm);
                    sounds.bgmCurrentlyPlaying = {
                        sound: bgm,
                        path: path
                    };
                    sounds.bgm[path] = bgm;
                    if(!isNaN(bgm.duration)) {
                        bgm.play();
                    }
                    setTimeout(callback);
                };

                if(bgm) {
                    play();
                } else {
                    bgm = new Audio(url);
                    bgm.loop = true;
                    var fplay = ()=>{
                        loadingResource--;
                        bgm.removeEventListener('canplay', fplay);
                        bgm.removeEventListener('error', err);
                        play();
                    },
                    err = (e)=>{
                        console.error(e);
                        fplay();
                    };;
                    bgm.addEventListener('canplay', fplay);
                    bgm.addEventListener('error', err);
                }
                break;
        }
    };

    var urlStore;
    switch(how) {
        case soundsNameConst.bgm: urlStore = sounds.bgmUrls; break;
        case soundsNameConst.sfx: urlStore = sounds.sfxUrls; break;
    }

    if(path) {
        var esObjUrl = urlStore[path];
        if(esObjUrl) {
            if(esObjUrl.loading) {
                esObjUrl.pending.push({
                    how: how,
                    loops: loops
                });
            } else if(esObjUrl.fail) {
                setTimeout(callback);
            } else {
                actuallyPlaySound(
                    esObjUrl,
                    how,
                    loops
                );
            }
        } else {
            var ftp = fileTypeConsts.sound; //FileTyPe
            
            console.log('get sound anew');
            loadingResource++;

            var thisSndObj = {
                loading: true,
                pending: [{
                    how: how,
                    loops: loops
                }]
            }

            urlStore[path] = thisSndObj;

            getFile(
                ftp, //sound and music use the same directory
                path,
                (data)=>{
                    if(how === soundsNameConst.sfx) {loadingResource--;}
                    if(data) {
                        var objurl = URL.createObjectURL(data);
                        thisSndObj.pending.forEach((prms)=>{
                            actuallyPlaySound(
                                objurl,
                                prms.how,
                                prms.loops
                            );
                        });
                        urlStore[path] = objurl;
                    } else {
                        if(how === soundsNameConst.bgm) {
                            stopSound(soundsNameConst.bgm);
                            loadingResource--;
                            thisSndObj = {fail: true}
                        }
                        callback();
                    }
                }
            );
        }
    }
}