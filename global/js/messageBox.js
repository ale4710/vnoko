var messageBoxData = {},
messageBoxPage = 100;

function msgBoxInit() {
    var scr = makeEl('div');
    messageBoxData.screen = scr;
    scr.classList.add(
        'dimmer',
        'main-screen'
    );
    toggleHiddenClass(scr, true); //add 'hidden' class

    var el = makeEl('div');
    messageBoxData.element = el;
    el.id = 'messageBox';

    var header = makeHeader();
    //title
    messageBoxData.titleElement = header.text;

    var body = makeEl('div');
    body.classList.add('body');
    body.tabIndex = -1;
    messageBoxData.bodyElement = body;

    el.appendChild(header.header);
    el.appendChild(body);
    scr.appendChild(el);
    document.body.appendChild(scr);

    msgBoxInit = undefined;
}

function messageBox(title, body, actions) {
    if(!actions) {
        actions = {};
    }

    if(!messageBoxData.active) {
        messageBoxData.last = {
            page: curpage,
            focus: actEl()
        }
    }

    if(!actions.back) {
        actions.back = messageBoxOption(messageBoxDefaultBackCallback);
    }

    messageBoxData.currentActions = actions;

    messageBoxData.titleElement.textContent = title;
    messageBoxData.bodyElement.innerHTML = body;

    toggleHiddenClass(messageBoxData.screen, false);

    messageBoxData.bodyElement.focus();

    messageBoxUpdateNavbar();
    curpage = messageBoxPage;
}

function messageBoxHide() {
    toggleHiddenClass(messageBoxData.screen, true);
    messageBoxData.currentActions = null;
    messageBoxData.last = null;
}

var messageBoxKConsts = {
    SoftLeft: 'left',
    SoftRight: 'right',
    Enter: 'center',
    Backspace: 'back'
};
function messageBoxK(k) {
    if(k.key === 'Backspace') {
        k.preventDefault();
    }

    var tmbkc = messageBoxKConsts[k.key],
    ca = messageBoxData.currentActions[tmbkc] //current action
    ;

    if(ca) {
        ca.callback(tmbkc);
        if(!ca.noHide) {
            messageBoxHide();
        }
    }
}
function messageBoxDefaultBackCallback() {
    curpage = messageBoxData.last.page;
    messageBoxData.last.focus.focus();
}
function messageBoxOption(callback, label, noHide) {
    return {
        label: label,
        callback: callback,
        noHide: !!noHide
    }
}
function messageBoxUpdateNavbar() {
    var ca = messageBoxData.currentActions,
    a = [
        ca.left,
        ca.center,
        ca.right
    ];
    for(var i = 0; i < a.length; i++) {
        if(a[i]) {
            a[i] = a[i].label;
        } else {
            a[i] = null;
        }
    }
    outputNavbar(a);
}