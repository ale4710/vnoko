var curpage = 0;

window.addEventListener('keydown', (k)=>{
    switch(k.key) {
        case 'SoftLeft':
        case 'SoftRight':
            k.preventDefault();
            break;
    }

    switch(curpage) {
        case messageBoxPage: messageBoxK(k); break;
        default: mainK(k); break;
    }

    globalUpdateNavbar();
});

function globalUpdateNavbar() {
    switch(curpage) {
        case messageBoxPage: 
            messageBoxUpdateNavbar();
            break;
        default: 
            //we have to do this annoying thing for some reason instead of a simple (this || that)()
            var upn = emptyFn;
            if('updatenavbar' in window) {upn = updatenavbar;}
            upn();
            break;
    }
}

var commonNavbars = {
    backSelect: ['Back', 'Select'],
    select: [null, 'Select']
}