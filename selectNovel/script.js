var novelProps,
novelListEl = eid('novelList');

function updatenavbar() {
    if(!!novelProps) {
        outputNavbar(
            null,
            'select',
            'settings'
        );
    }
}

function updateInfoPanelImage(newBgUrl) {
    [
        eid('novelInfoBg'),
        eid('novelInfoThumbnail')
    ].forEach((el)=>{
        el.src = newBgUrl;
    });
}

var currentThumbnailObjUrl = null;
function infoPanelUpdate() {
    var curNovel = novelProps[actEl().dataset.novelDir];

    //update text
    eid('novelInfoTitle').textContent = curNovel.title;

    //update thumbnail
    var thumb = curNovel.thumbnail;
    if(thumb) {
        thumb = URL.createObjectURL(thumb);
    } else {
        thumb = '/img/placeholder-thumbnail.png';
    }

    if(currentThumbnailObjUrl) {
        URL.revokeObjectURL(currentThumbnailObjUrl);
        currentThumbnailObjUrl = null;
    }

    updateInfoPanelImage(thumb);
}

function printNovels() {
    cdKeys = Object.keys(novelProps); //get the keys again without the ones removed
    cdKeys.sort((a,b)=>{
        return novelProps[a].title > novelProps[b].title;
    });

    //finally, print everytinh
    cdKeys.forEach((novKey, i)=>{
        var novEntry = makeEl('div'),
        curNov = novelProps[novKey];

        novEntry.tabIndex = i;
        novEntry.classList.add('selectable');
        novEntry.dataset.novelDir = novKey;

        //title
        var title = makeEl('div');
        title.textContent = curNov.title;
        title.classList.add(
            'novelTitle',
            'vcenter'
        );
        novEntry.appendChild(title);

        //icon
        var icon = curNov.icon;
        if(icon) {
            icon = URL.createObjectURL(icon);
        } else {
            icon = '/img/placeholder-icon.png';
        }
        icon = createImg(icon);
        icon.classList.add('novelIcon');
        novEntry.appendChild(icon);

        novelListEl.appendChild(novEntry);
    });

    eid('loading').remove();
    if(novelListEl.children.length !== 0) {
        novelListEl.children[0].focus();
        infoPanelUpdate();
    }
    updatenavbar();

    printNovels = null;
}