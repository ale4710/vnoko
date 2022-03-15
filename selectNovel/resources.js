(()=>{
    //scripts
    [
        'script',
        'keyHandler',
        'loader',
    ].forEach((fn)=>{
        addGlobalReference(0, fn);
    });

    //styles
    [
        'style',
    ].forEach((fn)=>{
        addGlobalReference(1, fn);
    });
})();