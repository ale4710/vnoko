function addGlobalReference(type, filename) {
    var s = document.createElement([
        'script',
        'link'
    ][type]);

    switch(type) {
        case 0: //script
            s.src = filename + '.js';
            s.defer = true;
            s.async = false;
            break;
        case 1: //style
            s.rel = 'stylesheet';
            s.type = 'text/css';
            s.href = filename + '.css';
            break;
    }

    document.head.appendChild(s);
}

(()=>{
    var bg = '/global/';
    //scripts
    var lb = 'lib/';
    [
        //lib
        lb + 'jszip.min',
        lb + 'allsettled-polyfill',

        //normal scripts
        'etcf',
        'compat',
        'testClass',
        'classes',
        'commonFiles',
        'settings',
        'storage',
        'messageBox',
        'elements',
        'keyHandler'
    ].forEach((fn)=>{
        addGlobalReference(0, 
            bg + 'js/' + fn
        );
    });

    //styles
    [
        'style',
        'style2',
        'animation'
    ].forEach((fn)=>{
        addGlobalReference(1, 
            bg + 'css/' + fn
        );
    });
})();