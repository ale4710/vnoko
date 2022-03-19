var navbarIconNames = {
    wait: 'wait.png',
    arrowDown: 'arrowDown.png',
    select: 'select.png',
    skip: 'skip.png',
    stop: 'stop.png',
    backlog: 'backlog.png',
    choices: 'choices.png',
    load: 'load.png',
    menu: 'menu.png',

}
function createNavbarIcon(name) {
    return createImg('/img/navbar/' + name);
}

function updatenavbar() {
    if(loading) {
        return;
    }

    switch(curpage) {
        case 0: //game
            var icos = [],
            cni = createNavbarIcon,
            nin = navbarIconNames;

            console.log((locked) +
            (inChoice << 1) +
            (skipping << 2) +
            ((loadingResource !== 0) << 3))

            switch(
                (locked) +
                (inChoice << 1) +
                (skipping << 2) +
                ((loadingResource !== 0) << 3)
            ) {
                case 0: //normal.
                    icos[0] = cni(nin.skip);
                    icos[1] = cni(nin.arrowDown);
                    break;
                case 1: //locked
                    //icos[1] = cni(nin.wait);
                    icos[1] = navbarClock.canvas.canvas;
                    break;
                case 4: //skipping
                case 5: //skipping locked
                    icos[1] = cni(nin.skip);
                    break;
                case 2: //in choice
                    if(choiceTempShowingBacklog) {
                        icos[0] = cni(nin.choices);
                    } else {
                        icos[0] = cni(nin.backlog);
                        icos[1] = cni(nin.select);
                    }
                    break;
                case 9: //locked, loadingResource
                case 13: //locked, skipping, loadingResource
                    icos[1] = cni(nin.load);
                    break;
            }

            var ico2 = icos[2],
            ico2cont = makeEl('div');

            if(!(ico2 instanceof HTMLElement)) {
                ico2 = cni(nin.menu);
            }

            ico2cont.appendChild(ico2);
            ico2cont.appendChild(soundsProgressElement);
            icos[2] = ico2cont;

            outputNavbar(icos);
            break;
        case 1: //pause menu
            outputNavbar(commonNavbars.select); break;
        case 2: //saveload menu
            var ct = null;
            if(saveloadAction === 0) {
                ct = 'save';
            } else if(
                saveloadAction === 1 &&
                saveloadCheckActElSlot()
            ) {
                ct = 'load';
            }
            outputNavbar(null, ct);
            break;
        case 3: //actionMenu
            outputNavbar(commonNavbars.backSelect); 
            break;
    }
}