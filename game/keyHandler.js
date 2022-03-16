var curpage = 0;

function mainK(k) {
    switch(curpage) {
        case 0: //"game" screen
            switch(k.key) {
                case 'Backspace':
                case 'SoftRight':
                    k.preventDefault();
                    skipToggle(false);
                    pause();
                    break;
                default:
                    if(textboxHidden) {
                        unhideTextBox();
                    } else {
                        if(inChoice) {
                            navigateChoiceK(k);
                        } else {
                            gameK(k);
                        }
                    }
                    break;
            }
            break;
        case 1: pauseMenuK(k); break;
        case 2: saveloadMenuK(k); break;
    }
};

function gameK(k) {
    var wasSkipping = skipping;
    gameTextboxFocus();
    skipToggle(false);
    switch(k.key) {
        case 'Enter':
        case 'ArrowRight':
            if(!locked) {
                continueScript();
            }
            break;
        case 'ArrowUp':
        case 'ArrowDown':
            if(
                !inChoice &&
                textboxScrollingAnimationRefNum !== null
            ) {
                textboxScrollingAnimationCancel();
            }
            break;
        case 'SoftLeft':
            if(
                !wasSkipping &&
                !inChoice &&
                !locked
            ) {
                skipToggle(true);
                continueScript();
            }
            break;
        default:
            shortcutKeys(k);
            break;
        
    }
}
function shortcutKeys(k) {
    switch(k.key) {
        case '#':
            rotateScreen();
            break;
        case '1':
            toggleNvlMode();
            break;
        case '3': 
            hideTextBox();
            break;
    }
}
function gameTextboxFocus() {
    display.textbox.focus();
}