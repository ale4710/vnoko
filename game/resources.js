(()=>{
    //scripts
    [
        'etc',
        'actions',
        'variables',
        'saveload',
        'pauseMenu',
        'scriptParse',
        'load',
        'choices',
        'scriptPlayer',
        'sounds',
        'display',
        'actionMenu',
        'navbar',
        'keyHandler',
        'firstboot'
    ].forEach((fn)=>{
        addGlobalReference(0, fn);
    });

    //styles
    [
        'style',
        'legacy',
        'pause',
        'saveload'
    ].forEach((fn)=>{
        addGlobalReference(1, fn);
    });
})();