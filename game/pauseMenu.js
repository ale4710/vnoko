var pauseMenu = eid('pm-options'),
pauseMenuCont = eid('pause-menu'),
pauseMenuItems = {
    title: eid('pm-nowplaying'),
    icon: eid('pm-nowplaying-icon')
};

(()=>{
    //AddPMOpt
    var addpmopt = (txt, actId)=>{
        var opt = makeEl('div');
        opt.tabIndex = pauseMenu.children.length;
        opt.textContent = txt;
        opt.dataset.action = actId;

        pauseMenu.appendChild(opt);
    }

    [
        ['Resume', 'resume'],
        ['Save', 'save'],
        ['Load', 'load'],
        ['Volume', 'volume'],
        ['Reset', 'reset'],
        ['Exit', 'returnToList']
    ].forEach((optArr)=>{
        addpmopt(
            optArr[0],
            optArr[1]
        );
    });
})();

function pause() {
    curpage = 1;
    fullscreenToggle(false);
    pauseMenu.children[0].focus();
}
function unpause() {
    curpage = 0;
    fullscreenToggle(true);
    unhidePauseMenu();
    refocusChoice(); //only "works" when inChoice is true
}
function unhidePauseMenu() {
    hideAllSubMenus();
    toggleHiddenClass(pauseMenuCont, false);
}
function hidePauseMenuToShowSubMenu() {
    toggleHiddenClass(pauseMenuCont, true);
}
document.addEventListener('fullscreenchange', ()=>{
    if(isFullscreen()) {
        gameTextboxFocus();
    } else {
        switch(curpage) {
            case 0: //unfullscreen from game
                pause();
                break;
        }
    }
});

function pauseMenuK(k) {
    var pmc = pauseMenu.children, al = actEl();
    switch(k.key) {
        case 'ArrowDown':
            var down = 1;
        case 'ArrowUp':
            navigatelist(
                al.tabIndex,
                pmc,
                down || -1
            );
            break;
        case 'Enter':
            switch(al.dataset.action) {
                case 'resume': unpause(); break;
                case 'reset': location.reload(); break;
                //case 'quit': window.close(); break;
                case 'returnToList': 
                    rotateScreen(0);
                    location = '/selectNovel/index.html'; 
                    break;
                case 'volume': navigator.volumeManager.requestShow(); break;
                case 'save': saveloadMenuShow(0); break;
                case 'load': saveloadMenuShow(1); break;
            }
            break;
        case 'Backspace':
            k.preventDefault();
            break;
    }
}
