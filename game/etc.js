var scriptPatterns = {
    var: {
        wrapped: /\{\$(\w+)\}/ig, //{$whatever}
        unwrapped: /\$(\w+)/ig, //$whatever
        unwrappedWhole: /^\$(\w+)$/i, //$whatever
        justCheck: /^\w+$/i //just check, only for checking exact strings.
    },
    varOp: /([\w]+)[\s]*([=<>!+\-]{1,2})[\s]*([^\n]+)/i,
    instruction: {
        after: /^[a-z]+(.*)/i,
        only: /^[a-z]+/i
    },
    num: {
        int: /^\-?\d+$/,
        float: /^\-?\d+(?:\.\d+)?$/
    },
    string: /^"([^"\n]*)"$/,
    cssPxVal: /^(\d+)px$/,
	newline: /\r?\n/,
    colorChange: {
        match: /\\x1b\[(?:(\d{2});)?([01])m/,
        splitter: /\\x1b\[(?:\d{2};)?[01]m/g
    }
},

frameLength = 1000 / 60;

function hideAllSubMenus() {
    var submenus = ecls('overlay-menu');
    for (var i = 0; i < submenus.length; i++) {
        toggleHiddenClass(submenus[i], true);
    }
}

function isFullscreen() {
    return !!(document.fullscreenElement || document.mozFullScreenElement)
}
function fullscreenToggle(full) {
    switch(
        full + 
        (isFullscreen() << 1) +
        (!!document.body.mozRequestFullScreen << 2)
    ) {
        case 1: document.body.requestFullscreen(); break;
        case 2: document.exitFullscreen(); break;
        case 5: document.body.mozRequestFullScreen(); break;
        case 6: document.mozCancelFullScreen(); break;
    }
}