function rotateScreen(force) {
    if('orientation' in screen) {
        console.log('rotate');
        var rots = [
            'portrait-primary',
            'landscape-primary',
            'portrait-secondary',
            'landscape-secondary'
        ];
    
        if(force === undefined) {
            force = (rots.indexOf(screen.orientation.type) + 1) % rots.length;
        }
    
        screen.orientation.lock(
            rots[force]
        );

        textboxScrollToBottom(true);
    }
}

function toggleNvlMode(force) {
    var tr = document.body.classList.toggle('nvl');
    //tr = was it applied, BEFORE calling toggle()?
    if(
        force !== undefined &&
        tr === !force
    ) {
        toggleNvlMode();
    }
}