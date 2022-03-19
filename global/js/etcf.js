function eid(e){return document.getElementById(e)}
function ecls(e){return document.getElementsByClassName(e)}
function actEl(){return document.activeElement}
function makeEl(tp){return document.createElement(tp)}

var navbar,
emptyFn = ()=>{},

regexs = {
    num: {
        int: /^\-?\d+$/,
        float: /^\-?\d+(?:\.\d+)?$/
    }
}
;

function outputNavbar(l,c,r) {
    var na = [
        'left',
        'center',
        'right',
    ], 
    oa;

    if(Array.isArray(l)) {
        oa = l;
    } else {
        oa = [l,c,r];
    }

    for(var i = 0; i < 3; i++) {
        var cn = navbar[na[i]];
        cn.innerHTML = '';
        if(oa[i] instanceof HTMLElement) {
            cn.appendChild(oa[i]);
        } else {
            cn.textContent = oa[i] || '';
        }
    }
}

function toggleHiddenClass(element, hide) {
    var hdCls = 'hidden';
    if(hide) {
        element.classList.add(hdCls);
    } else {
        element.classList.remove(hdCls);
    }
}

function createImg(path) {
    var i = makeEl('img');
    i.src = path;
    return i;
}

function htmlInsertTop(el, into) {
    var ifc = into.children[0];
    if(ifc) {
        into.insertBefore(el, ifc);
    } else {
        into.appendChild(el);
    }
}

function makeHeader() {
    var header = makeEl('div');
    header.classList.add('centerText','header','posrel');
    var headerCenterer = makeEl('div');
    headerCenterer.classList.add('vcenter','fillwidth','posabs');
    header.appendChild(headerCenterer);
    return {
        header: header,
        text: headerCenterer
    };
}

function distanceToScrollBottom(element) {
    return element.scrollHeight - (element.scrollTop + element.offsetHeight)
}

if(navigator.mozAudioChannelManager) {
    navigator.mozAudioChannelManager.volumeControlChannel = 'content';
}

function isClassSupported() {
    return 'classIsSupported' in window;
}

function splitPath(path) {
    return path.split('/');
}

function blobToText(blob, doneFn) {
    var fr = new FileReader();
    fr.readAsText(blob);
    fr.addEventListener('loadend', ()=>{
        doneFn(fr.result);
    });
}

function ssaws(str) { //string split at whitespace
    return str.split(' ');
}

function timeformat(input) {
    var m = Math.floor(input / 60), s = Math.floor(input % 60);

    if(m < 10) {
        m = '0' + m;
    }
    if(s < 10) {
        s = '0' + s;
    }
    return m + ':' + s;
}

function numpad(n, width, z) { //https://stackoverflow.com/a/10073788
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function selectRandomFromArray(a) {
    return a[Math.floor(Math.random() * a.length)];
}

function applyAnimation(el, animIdent, time, reverse, infinite) {
    var animSuc = false;
    if(
        typeof(animIdent) == 'string' &&
        animIdent
    ) {
        if(time && time > 0) {
            reverse = ['normal', 'reverse'][Number(reverse || 0)];
            infinite = ['1', 'infinite'][Number(infinite || 0)];
            
            el.style.animation = null;
            void(el.offsetHeight);
            el.style.animation = `${animIdent} ${time}ms ${infinite} linear ${reverse}`;

            animSuc = true;
        }
    }

    return animSuc;
}

function canvasImgScale(ctx, img) {
    return imageScaleToBox(
        ctx.canvas.width,
        ctx.canvas.height,
        img.width,
        img.height
    );
}

function imageScaleToBox(tw, th, dw, dh) {
    //tx = target's size. the thing that will be put inside the box.
    //dx = destiniaton's size. the box itself.
    var
    dAspect = dw / dh,
    tAspect = tw / th,
    
    fitWidth = dw / tw,
    fitHeight = dh / th,
    
    sizes;

    if(dAspect < tAspect) { //image is taller
        sizes = [fitWidth, fitHeight];
    } else { //default behavior or default behavior
        sizes = [fitHeight, fitWidth];
    }

    return sizes;
}

var alertMessageTO = false;
function alertMessage(message,disptime,type) {
    if(alertMessageTO !== false) {
        clearTimeout(alertMessageTO);
    }
    var ame = eid('alertMessage'), 
    bgc = null, 
    clr = null;
    switch(type) {
        case 0:
            bgc = '#2a2a2a';
            clr = '#fff';
            break;
        case 1:
            bgc = '#fff';
            clr = '#000';
            break;
        case 2:
            bgc = '#ff0';
            clr = '#000';
            break;
        case 3:
            bgc = '#f00';
            clr = null;
            break;
    }
    ame.style.color = clr;
    ame.style.backgroundColor = bgc;
    ame.textContent = message;
    
    ame.classList.add('show');
    
    if(disptime > 0) {
        alertMessageTO = setTimeout(function(){
            alertMessageTO = false;
            ame.classList.remove('show');
        },disptime);
    }
}

function navigatelist(index,list,move) { //RETURNS the current index of the thing.
    index += move;
    if(index >= list.length) {
        index = 0;
    } else if(index <= -1) {
        index = list.length - 1;
    }

    if(list[index] instanceof HTMLElement) {
        list[index].focus();
    }
    return index;
}

function elBounds(cn, el) {
    return {
        'ct': cn.scrollTop,
        'cb': cn.scrollTop + cn.clientHeight,
        'et': el.offsetTop,
        'eb': el.offsetTop + el.clientHeight
    }
}

function canseesc(cn,el) { //cn container, el,,, element
    var b = elBounds(cn, el);
    //IMPORTANT NOTE: IF USING THIS FUNCTION PLEASE MAKE SURE THAT THE PARENT IS POSITIONED
    //more info https://developer.mozilla.org/en-US/docs/Web/API/HTMLelement/offsetParent

    return ((b.eb <= b.cb) && (b.et >= b.ct)); //adapted from https://stackoverflow.com/a/488073
}

function canSeeElBounds(tp, cn, el) {
    var b = elBounds(cn, el);
    if(tp) {
        return b.et >= b.ct;
    } else {
        return b.eb <= b.cb;
    }
}

function scrollIntoView(el,dn,elpr) {
    if(elpr === undefined) {
        elpr = el.parentElement;
    }
    if(!canseesc(elpr,el)) {
        if(dn) { //going down
            el.scrollIntoView(false); //align to bottom
        } else { //going up
            el.scrollIntoView(true); //align to top
        }
    }
}

function focusInput(ip) {
    ip.focus();
    var ln = ip.value.length;
    setTimeout(()=>{
        ip.setSelectionRange(ln,ln); 
    },1);
}

function lookfor(list,obj) {
    for(var i = 0; i < list.length; i++) {
        if(list[i] === obj) {
            return i;
        }
    }
}

function keyisnav(k) { return ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].indexOf(k.key) > -1; }
