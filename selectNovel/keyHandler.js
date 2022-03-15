function mainK(k) {
    switch(curpage) {
        case 0: navigateNovelListK(k); break;
    }
};

function navigateNovelListK(k) {
    if(!!novelProps) {
        switch(k.key) {
            case 'ArrowDown':
                var down = 1;
            case 'ArrowUp':
                k.preventDefault();
                navigatelist(
                    actEl().tabIndex,
                    novelListEl.children,
                    down || -1
                );
                scrollIntoView(
                    actEl(),
                    !!down
                );
                infoPanelUpdate();
                break;
            case 'Enter':
                //load et
                location = '/game/index.html#' + actEl().dataset.novelDir;
                break;
            case 'SoftRight':
                location = '/settings/index.html';
                break;
        }
    }
}