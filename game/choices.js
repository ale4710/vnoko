var inChoice = false;
function selectChoice(num) {
    if(inChoice) {
        showChoices(false);
        variables['selected'] = num + 1;
        var choiceBLDisplay = printText(
            replaceAllVar(
                script.instructions[script.curInst].choices[num]
            )
        );
        choiceBLDisplay.classList.add(
            printTextNoHilightClassname,
            'choiceSelected'
        );
        inChoice = false;
        continueScript();
    }
}

var choiceLastSel = 0,
choiceTempShowingBacklog = false;
function refocusChoice() {
    if(inChoice) {
        display.choicebox.children[choiceLastSel].focus();
    }
}
function navigateChoiceK(k) {
    var curSel = actEl().tabIndex,
    cbCh = display.choicebox.children;

    if(choiceTempShowingBacklog) {
        switch(k.key) {
            case 'Enter':
            case 'SoftLeft':
                choiceTempShowingBacklog = false;
                showChoices(true);
                refocusChoice();
                break;
        }
    } else {
        if(keyisnav(k)) {k.preventDefault()}
        switch(k.key) {
            case 'ArrowDown':
                var down = 1;
            case 'ArrowUp':
                choiceLastSel = navigatelist(
                    curSel,
                    cbCh,
                    down || -1
                );
                scrollIntoView(
                    actEl(),
                    !!down
                );
                break;
            case 'Enter':
                selectChoice(curSel);
                break;
            case 'SoftLeft':
                choiceTempShowingBacklog = true;
                showChoices(false);
                gameTextboxFocus();
                break;
            default:
                shortcutKeys(k);
                break;
        }
    }

    
}