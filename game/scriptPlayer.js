var script,
loadingResource = 0,
pendingGoto = null,
pendingTextLine = null,

lastValidSave,
lastSaveEl,

skipping = false,

locked = true;



//loader.
function loadScript(filepath, callback) {
    callback = callback || emptyFn;
    console.log('loading ' + filepath);
    if(script) {
        script.unloading = true;
    }

    loadingResource++;
    updatenavbar();

    //var loadingMessage = printSystemMessage('Loading...');

    getFile(
        fileTypeConsts.script,
        filepath,
        (data/* , respType, rqObject */)=>{
            if(data === null) {
                console.error('THE DATA DOESNT EXISSSSSSSTGTTTTTTUTTHTYTYTY');
                callback(false);
            } else {
                /* if(respType === requestTypes.fs) {
                    if(rqObject.status !== 200) {
                        return;
                    }
                } */
                if(data instanceof Blob) {
                    blobToText(data, (res)=>{
                        console.log('loaded', filepath);
                        script = parseScript(res);
                        script.path = filepath;

                        var start = ()=>{
                            //loadingMessage.remove();
                            loadingResource--;
                            updatenavbar();
                            callback(true);
                        };

                        //preloading images
                        if(script.imagesToUse.length === 0) {
                            //if there are no images just call immediately
                            start();
                        } else {
                            var checkAllLoaded = ()=>{
                                if(++il == ie) {
                                    start();
                                }
                            },
                            il = 0, ie = 0; //il = img loaded, ie = img expect
                            script.imagesToUse.forEach((imgInfo)=>{
                                ie++;
                                getImage(
                                    imgInfo.type,
                                    imgInfo.path,
                                    (url)=>{
                                        if(url) {
                                            var limg = new Image(),
                                            checkedAction = ()=>{
                                                limg.remove();
                                                checkAllLoaded();
                                            };
                                            limg.src = url;
                                            limg.addEventListener('load', checkedAction);
                                            limg.addEventListener('error', checkedAction);
                                            limg.style.opacity = 0;
                                            document.body.appendChild(limg);
                                        } else {
                                            checkAllLoaded();
                                        }
    
                                    }
                                );
                            });
                        }
                    });
                }
            }
        }
    );
}

function skipToggle(targetSkip) {
    if(targetSkip === undefined) {
        targetSkip = !skipping;
    }
    skipping = !!targetSkip;
}

//main script handler.
var pendingDelay = false, 
pendingNewScreen = null,
pendingDelayOverEvent = new Event('pendingdelayover'),
delayInterruptRecieved = new Event('delayinterruptrecieved'),
pendingDelayInterrupt = false,
delayInterrupt = new Event('delayinterrupt');

function sendDelayInterruptRecieved() {
    pendingDelayInterrupt = false;
    window.dispatchEvent(delayInterruptRecieved);
    console.log('interrupt recieved by ', sendDelayInterruptRecieved.caller);
}

function continueScript() {

    if(inChoice) {return}

    var curInstNum = 0, proceed = true, delayEndCS = ()=>{
        //delay end continue script
        if(!pendingDelay) {console.log('???',delayEndCS.caller)}
        console.log('the most recent delay is over');
        pendingDelay = false;
        window.dispatchEvent(pendingDelayOverEvent);
        continueScript();
    };

    if(pendingTextLine !== null) {
        //pendingTextLine only applies when loading from a save
        //so we will also print the previous lines.
        var ptl = script.instructionByTextIndex[pendingTextLine];
        if(typeof(ptl) === 'number') {
            curInstNum = ptl;

            if(ptl > 0) {
                var actualPrint = [];
                //work backwards from this point
                histPrintFromLoad: for(var i = curInstNum - 1; i >= 0; i--) {
                    var ti = script.instructions[i];
                    if(ti) {
                        if(ti.branchTarget) {
                            break histPrintFromLoad; //that's it.
                        } else {
                            switch(ti.type) {
                                case 'text':
                                    actualPrint.unshift(ti);
                                    break;
                                case 'cleartext':
                                    if(!ti.fully) {
                                        actualPrint.unshift(ti);
                                        break;
                                    }
                                case 'choice':
                                case 'goto':
                                case 'jump':
                                    break histPrintFromLoad;
                            }
                        }

                        if(actualPrint.length > printTextMaxOverflow) {
                            //dont bother printing too much text when it will get deleted anyway
                            break histPrintFromLoad;
                        }
                    }
                }

                //collected everything, now print for real
                actualPrint.forEach((ti)=>{
                    switch(ti.type) {
                        case 'text':
                            var txt;
                            if(!ti.blank) {
                                txt = ti.text;
                            }
                            printText(txt, true).classList.add('text');
                            break;
                        case 'cleartext':
                            blankTextBox();
                            break;
                    }
                });
                textboxScrollToBottom(true);
            }
        }
        pendingTextLine = null;
    } else if(pendingGoto !== null) {
        var pgt = script.labelLocations[pendingGoto];
        if(typeof(pgt) === 'number') {
            curInstNum = pgt;
        }
        pendingGoto = null;

    } else if(script.curInst !== undefined) {
        curInstNum = script.curInst + 1;
    }

    if(pendingDelayInterrupt) {
        sendDelayInterruptRecieved();
        return;
    }

    //console.log(curInstNum)

    locked = true;

    var curInst = script.instructions[curInstNum],
    stoppedAtText = false,
    endOfFile = false;

    //console.log(curInst);


    if(curInst) {
        if(
            !pendingDelay &&
            loadingGame
        ) {
            window.dispatchEvent(okayToLoad);
            return;
        }

        if(
            [
                'text',
                'choice',
                //'goto',
                //'jump',
                'delay',
                'bgload',
                //'setimg',
                //'setvar',
                //'gsetvar'
            ].indexOf(curInst.type) !== -1
        ) {
            if(pendingDelay || pendingNewScreen) {
                console.log('waiting for a delay...');
                if(pendingNewScreen) {
                    pendingNewScreen();
                    pendingDelay = true;
                    pendingNewScreen = null;
                    console.log('^^ waiting for newscreen transition.');
                }
                updatenavbar();
                return;
            }
        }

        //console.log(curInst);

        switch(curInst.type) {
            case 'text':
                var txt;
                if(!curInst.blank) {
                    txt = replaceAllVar(curInst.text);
                }

                var tt = printText(
                    txt,
                    skipping
                );
                tt.classList.add('text');

                if(curInst.wait) {
                    proceed = false;
                    stoppedAtText = true;
                    if(skipping) {
                        setTimeout(continueScript);
                    } else {
                        locked = false;
                    }
                }
                break;

            case 'cleartext':
                if(curInst.fully) {
                    if(
                        curInst.fully === true ||
                        replaceAllVar(curInst.fully) === '!'
                    ) {
                        display.textbox.innerHTML = '';
                    }
                }
                blankTextBox();
                break;

            case 'bgload':
                var fadeTime = curInst.fadeTime;
                if(skipping) {
                    fadeTime = 0;
                } else {
                    fadeTime = rtIfVariable(fadeTime);
                }

                pendingNewScreen = setBackground(
                    replaceAllVar(curInst.filename),
                    fadeTime,
                    delayEndCS
                ).exec;

                console.log('a new screen has been queued.');

                //proceed = false;
                //pendingDelay = true;
                break;
				
			case 'setimg':
				//console.log('set image', curInst);
                if(!pendingNewScreen) {
                    var ft = defaultFadeTime * !skipping,
                    scrCh = setBackground(
                        display.screen.dataset.bgPath,
                        ft,
                        delayEndCS
                    ),
                    oScrCh = scrCh.oldScreen.children;
                    pendingNewScreen = scrCh.exec;
                    for(var i = 0; i < oScrCh.length; i++) {
                        display.screen.appendChild(
                            oScrCh[i].cloneNode()
                        );
                    }
                }
                proceed = false;
                pendingDelay = true;
                var fn = replaceAllVar(curInst.filename);
				getImage(
					fileTypeConsts.sprite,
					fn,
					(imgUrl)=>{
                        //console.log(imgUrl);
                        updatenavbar();
						if(imgUrl) {
							drawImage(
								imgUrl,
								rtIfVariable(curInst.x),
								rtIfVariable(curInst.y),
								fn,
                                delayEndCS
							);
						} else {
							console.error('failed to get image', fn);
                            setTimeout(delayEndCS);
						}
					}
				);
                console.log('waiting for setimg.');
				break;

            case 'music':
                if(curInst.stop) {
                    stopSound(soundsNameConst.bgm);
                } else {
                    proceed = false;
                    pendingDelay = true;
                    playSound(
                        delayEndCS,
                        rtIfVariable(curInst.filename),
                        soundsNameConst.bgm
                    );
                }
                break;

            case 'sound':
                if(curInst.stop) {
                    stopSound(soundsNameConst.sfx);
                } else {
                    if(!skipping) {
                        proceed = false;
                        pendingDelay = true;
                        playSound(
                            delayEndCS,
                            rtIfVariable(curInst.filename),
                            soundsNameConst.sfx,
                            curInst.loops
                        );
                    }
                }
                break;

            case 'choice':
                inChoice = true;
                locked = false;
                proceed = false;
                skipToggle(false);
                unhideTextBox();

                showChoices(true);

                clearChoices();
                curInst.choices.forEach((txt)=>{
                    printChoice(
                        replaceAllVar(txt)
                    );
                });

                choiceLastSel = 0;
                choiceTempShowingBacklog = false;
                refocusChoice();
                break;

            case 'delay':
                proceed = false;
                pendingDelay = true;
                var delayms;
                if(skipping) {
                    delayms = 0
                } else {
                    delayms = (rtIfVariable(curInst.wait) * frameLength) || 0;
                }
                console.log(
                    'delaying. (frames, ms)',
                    curInst.wait,
                    delayms
                );
                if(delayms >= 750) {
                    navbarClock.setTime(delayms);
                }
                var toref = setTimeout(
                    ()=>{
                        delIntEnd();
                        delayEndCS();
                    },
                    delayms
                ),
                delInt = ()=>{
                    delIntEnd();
                    console.log('cleaar',toref);
                    clearTimeout(toref);
                    sendDelayInterruptRecieved();
                },
                delIntEnd = ()=>{
                    //this that will happen tat the end of the delay*.
                    //*it will also happen when the delay is interrupted.
                    navbarClock.reset();
                    window.removeEventListener(delayInterrupt.type, delInt);
                };

                window.addEventListener(delayInterrupt.type, delInt);
                break;

            case 'setvar':
                if(curInst.reset) {
                    console.log('reset local variables.');
                    variables = {};
                    reassignGlobalVariables();
                    break;
                }
            case 'gsetvar':
                proceed = false;
                pendingDelay = true;
                operandsAction[curInst.operand](
                    curInst.lefthand,
                    variableNormalize(curInst.righthand),
                    delayEndCS,
                    curInst.type === 'gsetvar'
                );
                break;

            case 'random':
                var randMult = curInst.max - curInst.min,
                num = math.floor(curInst.min + (math.random() * (randMult + 1)));

                operandsAction[operands.set](
                    curInst.var,
                    num
                );

                console.log(`random number: the variable ${curInst.var} is now set to ${num}`);
                break;

            case 'if':
                /* console.log(
                    'if (var (var)), operand, (var (var)) :',
                    curInst.lefthand,
                    variables[curInst.lefthand],
                    curInst.operand,
                    curInst.righthand,
                    variableNormalize(curInst.righthand)
                ); */

                var operResult = operandsAction[curInst.operand](
                    curInst.lefthand,
                    curInst.righthand
                );

                console.log(
                    'if:',
                    curInst.lefthand,
                    '[',variables[curInst.lefthand],']',
                    curInst.operand,
                    curInst.righthand,
                    '[',variableNormalize(curInst.righthand),']',
                    'is...',
                    operResult
                );

                /* console.log('result to last if was...', operResult); */

                if(!operResult) {
                    curInstNum = curInst.end - 1; //minus one because when calling continueScript curInst is +1'd.
                }
                break;

            case 'goto':
                var gtname = replaceAllVar(curInst.name);
                curInstNum = script.labelLocations[gtname];
                if(curInstNum !== undefined) {
                    curInstNum = curInstNum - 1;
                } else {
                    console.error(`goto: the label ${gtname} does not exists`);
                }
                break;

            case 'jump':
                if(curInst.goto) {
                    pendingGoto = replaceAllVar(curInst.goto);
                }
                proceed = false;
                pendingDelay = true;
                loadScript(
                    replaceAllVar(curInst.filename),
                    (status)=>{
                        if(status) {
                            delayEndCS();
                        } else {
                            printSystemMessage(
                                'jump command: the script could not be found.',
                                2
                            );
                        }
                    }
                );
                break;

            /* default:
                if(!curInst.unknownInstruction) {
                    proceed = false;
                }
                break; */
        }
    } else {
        printSystemMessage('Reached the end of the script.', 2);
        console.error('end of file reached.');
        proceed = false;
        endOfFile = true;
    }

    script.curInst = curInstNum;

    if(proceed) {
        continueScript(); //recursive...?
    } else {
        updatenavbar();
        if(!endOfFile) {
            if(
                'saveTextIndex' in curInst &&
                stoppedAtText
            ) {
                var ts = generateSaveFile(curInstNum);
                if(ts) {
                    lastValidSave = ts;
                    
                    var txts = ecls('text');
                    if(txts.length !== 0) {
                        lastSaveEl = txts[txts.length - 1];
                    }
                }
            }
        }
    }
}