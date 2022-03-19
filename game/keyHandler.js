var curpage = 0;

function mainK(k) {
    //console.log(k.key, curpage);

    if([ //keys to completely ignore
        'MicrophoneToggle' //results in double hits when "OK" is pressed
    ].indexOf(k.key) !== -1) {
        return;
    }

    switch(curpage) {
        case 0: //"game" screen

            if(textboxHidden) {
                unhideTextBox();
            }

            switch(k.key) {
                case 'Backspace':
                    k.preventDefault();
                    skipToggle(false);
                    pause();
                    break;
                case 'SoftRight':
                    skipToggle(false);
                    actionMenuShow();
                    break;
                default:
                    if(inChoice) {
                       navigateChoiceK(k);
                    } else {
                        gameK(k);
                    }
                    break;
            }
            break;
        case 1: pauseMenuK(k); break;
        case 2: saveloadMenuK(k); break;
        case 3: actionMenuK(k); break;
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
            startSkipping(wasSkipping);
            break;
        default:
            shortcutKeys(k);
            break;
        
    }
}

function gameTextboxFocus() {
    display.textbox.focus();
}