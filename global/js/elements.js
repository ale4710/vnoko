window.addEventListener('DOMContentLoaded',()=>{
    //messageBox
    msgBoxInit();

    //alertmessage
    var am = makeEl('div');
    am.id = 'alertMessage';
    document.body.appendChild(am);

    //navbar
    var nv = makeEl('div');
    nv.id = 'navbar';
    ['left','center','right'].forEach((idn)=>{
        var e = makeEl('div');
        e.id = 'navbar-' + idn;
        nv.appendChild(e)
    });
    document.body.appendChild(nv);

    navbar = {
        myself: eid('navbar'),
        left: eid('navbar-left'),
        right: eid('navbar-right'),
        center: eid('navbar-center')
    }
});