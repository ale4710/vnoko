(()=>{
    //scripts
    [
        'settingsList',
        'settings'
    ].forEach((fn)=>{
        addGlobalReference(0, fn);
    });

    //styles
    [
        'style'
    ].forEach((fn)=>{
        addGlobalReference(1, fn);
    });
})();