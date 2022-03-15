var display = {
    screenContainer: eid('gamescreen'),
    screen: null,
    textbox: eid('story'),
    choicebox: eid('choices'),
    gameNavbar: eid('game-navbar')
},

baseScreenSize = {
    w: 256,
    h: 192
},
scaling = {};

function updateScaling(w,h) {
    if(w && h) {
        scaling.w = w;
        scaling.h = h;
    }

    display.screenContainer.style.setProperty(
        '--screenScale',
        imageScaleToBox(
            scaling.w,
            scaling.h,
            screen.width,
            screen.width * (3/4)
        )[0]
    );

    display.screenContainer.style.setProperty('--gameWidth', scaling.w + 'px');
    display.screenContainer.style.setProperty('--gameHeight', scaling.h + 'px');
}

updateScaling(
    baseScreenSize.w,
    baseScreenSize.h
); 

var defaultFadeTime = 16;

/* image display */
var images = {};
images[fileTypeConsts.sprite] = {};
images[fileTypeConsts.background] = {};

function startNewScreen(fadeTime, transitionEndCB) {
    transitionEndCB = transitionEndCB || emptyFn;

    var oScr = display.screen, //old screen
    nScr = makeEl('div'), //new screen
    dsc = display.screenContainer;

    
    dsc.appendChild(nScr);
    display.screen = nScr;

    nScr.style.opacity = 0;

    if(
        typeof(fadeTime) !== 'number' ||
        isNaN(fadeTime)
    ) {
        //console.log('fadetime reset', fadeTime)
        fadeTime = defaultFadeTime;
    }

    return {
        exec: ()=>{
            nScr.style.opacity = null;
            var allEnd = ()=>{
                navbarClock.reset();
            }
            if(fadeTime > 0) {
                fadeTime = fadeTime * frameLength;
                if(fadeTime >= 1000) { //more than or equal to a second
                    navbarClock.setTime(fadeTime);
                }
                var nScrAniEnd = ()=>{
                    tAnyEnd();
                    if(oScr) {oScr.remove();}
                    nScr.removeEventListener('animationend', nScrAniEnd);
                    transitionEndCB();
                },
                nScrAniInterrupt = ()=>{
                    tAnyEnd();
                    sendDelayInterruptRecieved();
                    //do not call callback
                },
                tAnyEnd = ()=>{
                    allEnd();
                    window.removeEventListener(delayInterrupt.type, nScrAniInterrupt);
                    nScr.removeEventListener('animationend', nScrAniEnd);
                };

                window.addEventListener(delayInterrupt.type, nScrAniInterrupt);
                nScr.addEventListener('animationend', nScrAniEnd);
        
                applyAnimation(
                    nScr,
                    'fade',
                    fadeTime
                );
            } else {
                if(oScr) {oScr.remove();}
                setTimeout(()=>{
                    allEnd();
                    transitionEndCB();
                });
            }
        },
        oldScreen: oScr
    };
}

function drawImage(img, x, y, origFilePath, callback) {
    callback = callback || emptyFn;
    if(typeof(img) === 'string') {
        var src = img;
        img = new Image();
        img.src = src;
    }

    if(img instanceof Image) {
        /* img.style.left = ((x / scaling.w) * 100) + '%';
        img.style.top = ((y / scaling.h) * 100) + '%'; */

        img.style.left = ((x / baseScreenSize.w) * 100) + '%';
        img.style.top = ((y / baseScreenSize.h) * 100) + '%';
        img.dataset.path = origFilePath;
        img.dataset.x = x;
        img.dataset.y = y;

        /* if(!pendingNewScreen) {
            img.addEventListener('animationend', function imgAniEnd() {
                img.removeEventListener('animationend', imgAniEnd);
                callback(true);
            });
            var fadeTime = defaultFadeTime * !skipping;
            applyAnimation(
                img,
                'fade',
                fadeTime * frameLength
            );
        } else {
            setTimeout(callback, 0, true);
        } */

        setTimeout(callback, 0, true);

        display.screen.appendChild(img);
    } else {
        setTimeout(callback, 0, false);
    }
}
function getImage(which, path, callback) {
    var eiObjUrl = images[which][path]; //existing image object url
    if(eiObjUrl) {
        if(eiObjUrl.loading) {
            eiObjUrl.callbacks.push(callback);
        } else {
            callback(images[which][path]);
        }
    } else {
        console.log('get image anew', path);
        loadingResource++;
        images[which][path] = {
            loading: true,
            callbacks: [callback]
        };
        getFile(
            which,
            path,
            (data)=>{
                loadingResource--;
                var objurl = null;
                if(data) {objurl = URL.createObjectURL(data);}
                images[which][path].callbacks.forEach((fn)=>{
                    fn(objurl);
                });
                images[which][path] = objurl;
            }
        )
        
    }
}

function setBackground(filename, duration, transitionEndCB) {
    var rtf = startNewScreen(duration, transitionEndCB);
    if(filename) {
        getImage(
            fileTypeConsts.background,
            filename,
            (url)=>{
                console.log('setbg', url);
                if(url) {
                    display.screen.dataset.bgPath = filename;
                    display.screen.style.backgroundImage = `url(${url})`;
                }
            }
        );
    }
    return rtf;
}

/* text display */
if(screen.orientation) {
    screen.orientation.addEventListener('change', ()=>{
        updateScaling();
        textboxScrollToBottom();
    });
}

var printTextNoHilightClassname = 'noHilight';
var printTextMaxOverflow = 250;
var printTextColors = {
    '30': '000',
    '31': 'f00',
    '32': '0f0',
    '33': 'ff0',
    '34': '00f',
    '35': 'f0f',
    '36': '0ff',
    '37': 'fff',
    //'39': null,
}
function printText(text, scrollInstant) {
    var thisTxt = makeEl('div'),
    textbox = display.textbox;

    if(text) {
        var clrChMatches = text.match(scriptPatterns.colorChange.splitter);
        if(clrChMatches) { //if there are colorchange commands in here
            var txtSC = text.split(scriptPatterns.colorChange.splitter);
            txtSC.forEach((textPart, index)=>{
                if(textPart !== '') { //dont bother printing empty lines - it might be more trouble than its worth
                    var textPartEl = makeEl('span');

                    textPartEl.textContent = textPart;
    
                    var clrChMatchIndex = index - 1;
    
                    if(
                        index !== 0 &&
                        clrChMatchIndex + 1 in clrChMatches
                    ) {
                        var clrPrms = clrChMatches[clrChMatchIndex].match(scriptPatterns.colorChange.match);
                        //clrPrms = [wholematch, color to change to, on/off]
                        if(clrPrms[2] === '1') {
                            if(clrPrms[1] in printTextColors) {
                                textPartEl.style.color = '#' + printTextColors[clrPrms[1]];
                            }
                        }
                    }
    
                    thisTxt.appendChild(textPartEl);
                }
            });
        } else {
            //thisTxt.innerText = text;
            thisTxt.textContent = text;
        }
    } else {
        thisTxt.innerHTML = '&nbsp;';
    }

    textbox.appendChild(thisTxt);
    textboxScrollToBottom(scrollInstant);

    return thisTxt;
}
function printSystemMessage(text, severity) {
    if(typeof(severity) !== 'number') {
        severity = 0;
    }
    severity = [
        'normal',
        'warning',
        'error'
    ][severity];
    var pt = printText(text);
    pt.classList.add(
        'systemMessage',
        printTextNoHilightClassname,
        severity
    );
    return pt;
}
function printTextCleanOverflow() {
    var tbCh = display.textbox.children; //textbox children
    while(tbCh.length > printTextMaxOverflow) {
        tbCh[0].remove();
    }
}

function blankTextBox() {
    var block = makeEl('div');
    block.classList.add('blanker');
    display.textbox.appendChild(block);
    //setTimeout(()=>{display.textbox.scrollTop += block.offsetHeight;}, 10);
    //textboxScrollToBottom(true);
}

function textboxScrollToBottom(instant) {
    if(instant) {
        printTextCleanOverflow();
        display.textbox.scrollTop = display.textbox.scrollHeight;
    } else {
        if(textboxScrollingAnimationRefNum === null) {
            textboxScrollingAnimation();
        }
    }
}
var textboxScrollingAnimationRefNum = null,
textboxScrollingAnimationBaseSpeed = 250,
textboxScrollingAnimationSpeedMult,
textboxScrollingAnimationLt = null;
function textboxScrollingAnimation() {
    var continueAnimate = true,
    now = new Date(),
    last = textboxScrollingAnimationLt;
    textboxScrollingAnimationLt = now;

    if(textboxScrollingAnimationRefNum === null) {
        //the first time
        textboxScrollingAnimationSpeedMult = 1;
        //sometimes the animation doesnt play, the below makes sure it plays.
        display.textbox.scrollTop = display.textbox.scrollTop;
    } else {
        //not the first time
        var dt = (now - last) / 1000,
        mult = 1,
        dtbox = display.textbox,
        distToBottom = distanceToScrollBottom(dtbox)
        ;

        //speeds will be active until the end of the animation
        if(distToBottom >= dtbox.offsetHeight * 3) {
            //if we are more than 3 pages away
            mult = 12; //super fast
        } else if(distToBottom >= dtbox.offsetHeight - 1) {
            //if we are more than a page from the bottom
            //-1 just in case of some weird floating point math errors
            mult = 2; //faster!!!
        }
        mult = Math.max(
            textboxScrollingAnimationSpeedMult,
            mult
        );

        dtbox.scrollTop += textboxScrollingAnimationBaseSpeed * mult * dt;

        if(distToBottom <= 0) {
            continueAnimate = false;
        }

        textboxScrollingAnimationSpeedMult = mult;
    }

    if(continueAnimate) {
        textboxScrollingAnimationRefNum = requestAnimationFrame(textboxScrollingAnimation);
    } else {
        textboxScrollingAnimationCancel();
    }
}
function textboxScrollingAnimationCancel() {
    console.log('cancel scroll anim');
    cancelAnimationFrame(textboxScrollingAnimationRefNum);
    printTextCleanOverflow();
    //textboxScrollingAnimationLt = null; //not nessessary
    textboxScrollingAnimationRefNum = null;
}

/* choices */
function clearChoices() {
    display.choicebox.innerHTML = '';
}
function printChoice(choice) {
    var choiceBtn = makeEl('div');
    choiceBtn.textContent = choice;
    choiceBtn.tabIndex = display.choicebox.children.length;
    display.choicebox.appendChild(choiceBtn);
}
function showChoices(show) {
    toggleHiddenClass(display.choicebox, !show);
    toggleHiddenClass(display.textbox, show);
}

/* loadfonts */
function loadFont(blob, fontname) {
    var stylesheet = document.getElementsByTagName('style')[0];
    if(!stylesheet) {
        stylesheet = makeEl('style');
        document.head.appendChild(stylesheet);
    }
    var fontUrl = URL.createObjectURL(blob);
    stylesheet.innerHTML += `@font-face{font-family:"${fontname}";src:url(${fontUrl})}`;
}

/* navbar clock thingy */
var navbarClock = {
    canvas: makeEl('canvas').getContext('2d'),
    startTime: null,
    targetTime: null,

    setTime: (time, absolute)=>{
        if(!absolute) {
            if(time instanceof Date) {
                time = time.getTime();
            }
            time = new Date().getTime() + time;
        }
        navbarClock.targetTime = new Date(time);
        navbarClock.startTime = new Date();
        navbarClock.draw(); //start it off
    },
    reset: ()=>{
        if(navbarClock.targetTime) {
            navbarClock.targetTime = null;
            navbarClock.startTime = null;
            navbarClock.draw(); //draw empty
        }
    },
    draw: ()=>{
        var tt = navbarClock.targetTime,
        continueDrawing = false,

        ctx = navbarClock.canvas,
        cv = ctx.canvas,
        lineWidth = 1.5,
        circleFillAmount = 1,
        fillCircle = false;

        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.lineWidth = lineWidth;

        ctx.clearRect(
            0,0,
            cv.width,
            cv.height
        );

        if(tt instanceof Date) {
            var tw = tt - navbarClock.startTime,
            tr = tt - (new Date()),
            fill = tr / tw;

            //console.log(tw, tr, fill);

            if(
                fill >= 0 &&
                fill <= 1
            ) {
                continueDrawing = true;
                circleFillAmount = 1 - fill;
                fillCircle = true;
            }
        }

        //outline
        ctx.beginPath();
        ctx.arc(
            cv.width / 2,
            cv.height / 2,
            (cv.width - lineWidth) / 2,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        //fill
        if(fillCircle) {
            ctx.beginPath();
            ctx.moveTo(
                cv.width / 2,
                cv.height / 2
            );
            var sa = Math.PI / -2;
            ctx.arc(
                cv.width / 2,
                cv.height / 2,
                cv.width / 2,
                sa,
                sa + (Math.PI * (circleFillAmount * 2))
            );
            /* ctx.moveTo(
                cv.width / 2,
                cv.height / 2
            ); */
            ctx.fill();
        }

        if(continueDrawing) {
            requestAnimationFrame(navbarClock.draw);
        }
    }
};
(()=>{
    var size = 14,
    nc = navbarClock.canvas.canvas;

    nc.width = size;
    nc.height = size;
    navbarClock.draw(); //draw empty circle
})();

var textboxHidden = false,
textboxHiddenClassName = 'hideTextBox';
function hideTextBox() {
    document.body.classList.add(textboxHiddenClassName);
    textboxHidden = true;
}
function unhideTextBox() {
    document.body.classList.remove(textboxHiddenClassName);
    textboxHidden = false;
}