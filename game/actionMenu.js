var actionMenu = new OptionsMenu('Quick Menu'),
actionMenuData = {
    page: 3
},
actionMenuActions = [
    //[label, fn, norefocus]
    ['Skip', startSkipping],
    ['Adjust Volume', ()=>{navigator.volumeManager.requestShow()}],
    ['Hide Textbox', hideTextBox],
    ['Rotate Screen', rotateScreen],
    ['Toggle NVL Mode', toggleNvlMode],
    ['System Menu', pause, true]
];

actionMenuActions.forEach((a)=>{
    actionMenu.addOption(a[0]);
});

function shortcutKeys(k) {
    var ka = '12345'.indexOf(k.key);
    if(ka in actionMenuActions) {
        var fn = actionMenuActions[ka][1];
        switch(ka) {
            case 0: //skip
                fn(skipping);
                break;
            default:
                fn();
                break;
        }
    }
}

function actionMenuShow() {
    if(curpage !== actionMenuData.page) {
        actionMenuData.lastpage = curpage;
        actionMenuData.lastfocus = actEl();

        curpage = actionMenuData.page;
        actionMenu.menuViewToggle(true, true);
    }
}

function actionMenuDone(refocus) {
    actionMenu.menuViewToggle(false);
    if(refocus) {
        curpage = actionMenuData.lastpage;
        actionMenuData.lastfocus.focus();
    }
    delete actionMenuData.lastpage;
    delete actionMenuData.lastfocus;
}

function actionMenuK(k) {
    switch(k.key) {
        case 'ArrowUp':
            var u = -1;
        case 'ArrowDown':
            actionMenu.navigate(u || 1);
            break;
        case 'Enter':
            var ca = actionMenuActions[actEl().tabIndex];    
            ca[1]();
            actionMenuDone(!ca[2]);
            break;
        case 'Backspace':
            k.preventDefault();
        case 'SoftLeft':
            actionMenuDone(true);
            break;

    }
}