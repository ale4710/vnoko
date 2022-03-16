var
currentSetting = {index: 0, name: ''},
currentCategory = 'default',
settingNavigationHistory = [];

window.addEventListener('DOMContentLoaded',()=>{
    if(location.hash === '#firstboot') {
        initSettings(0, true);
        location = '/selectNovel/index.html';
    } else {
        toggleHiddenClass(
            eid('main-screen'),
            false
        );

        initSettings(0);

        if(!isClassSupported()) {
            messageBox(
                'Warning',
                'If you are seeing this message, it means that you are on a version of KaiOS that is too old to support some required features that this application uses. Settings will not work correctly.',
                {
                    center: messageBoxOption(
                        messageBoxDefaultBackCallback,
                        'ok'
                    )
                }
            );
        }

        globalUpdateNavbar();
    }
});

function initSettings(focusIndex, updateAll) {
    var sl = eid('settingsList');
    sl.innerHTML = '';
    var st = updateAll? Object.keys(settingsList) : settingsListCategories[currentCategory].settings,
    addedElements = 0;

    for(var i = 0; i < st.length; i++) {
        var csn = st[i],
        cs = settingsList[csn],
        novalue = getSettingValue(csn) === null && [4,5].indexOf(cs.type) === -1;

        if(novalue) {updateSetting(csn, cs.default, true);}
        
        if(updateAll) {continue}

        var op = [
            makeEl('div'),
            makeEl('div'),
            makeEl('div'),
            makeEl('div')
        ];

        //layer 01
        op[0].classList.add(
            'setting', 
            'selectable'
        );
        op[0].dataset.setting = csn;
        op[0].tabIndex = addedElements;

        //layer 02
        op[1].classList.add(
            'vcenter',
            'posabs'
        );

        //layer 03
        //setting name
        op[2].classList.add('setting-name');
        op[2].textContent = getSettingLabel(csn);

        //setting value
        if(!novalue) {
            op[3].classList.add('setting-value');
            op[3].textContent = getFormattedSettingValue(csn);
        }

        /* 
        <0>
            <1>
                <2>name</2>
                <3>value</3>
            </1>
        </0>
        */
        op[1].appendChild(op[2]);
        op[1].appendChild(op[3]);
        op[0].appendChild(op[1]);
        sl.appendChild(op[0]);
        addedElements++;
    }

    if(!updateAll) {
        sl.children[focusIndex].focus();
        sl.children[focusIndex].scrollIntoView(false);
        currentSetting.name = actEl().dataset.setting;
        currentSetting.index = focusIndex;
    }
}

function updateSetting(setNm,newVal,noParse) {
    if(setNm in settingsList) {
        if(!noParse && typeof(newVal) !== 'string') {newVal = JSON.stringify(newVal);}
        localStorage.setItem(getSettingKey(setNm), newVal);

        console.log('The setting', setNm, 'has been updated to', newVal);
    }
}

function updateActiveSettingDisplay() {
    ecls('setting')[currentSetting.index].getElementsByClassName('setting-value')[0].textContent = getFormattedSettingValue(currentSetting.name);
}

function getFormattedSettingValue(setNm) {
    if(setNm in settingsList) {
        var cs = settingsList[setNm],
        csv = getSettingValue(setNm);

        switch(cs.type) {
            case 0: 
                return getSettingValueLabel(setNm, csv);
            case 1:
                if(csv.length === 0) {
                    return 'None';
                } else {
                    for(var i = 0; i < csv.length; i++) {
                        csv[i] = getSettingValueLabel(setNm, csv[i]);
                    }
                    return csv.join(', ');
                }
            case 2:
            case 3:
                return csv;
        }
    }
}

var settingChangeDialog = new OptionsMenuSelectable('', 'text');
function showSettingChangeDialog() {
    curpage = 1;
    allowBack = false;

    settingChangeDialog.updateHeader(getSettingLabel(currentSetting.name));

    var cs = settingsList[currentSetting.name],
    cv = getSettingValue(currentSetting.name);

    settingChangeDialog.changeType([
        'radio',
        'checkbox',
        'tel',
        'text'
    ][cs.type]);

    if(cs.type < 2) {
        for(var i = 0; i < cs.values.length; i++) {
            var checked = false;
            switch(cs.type) {
                case 0: //radio
                    if(i === cv) {checked = true;}
                    break;
                case 1: //checkbox
                    if(cv.indexOf(i) !== -1) {checked = true;}
                    break;
            }
            settingChangeDialog.addOption(
                getSettingValueLabel(currentSetting.name, i),
                checked
            )
        }
    } else {
        settingChangeDialog.setValue(cv);
    }

    settingChangeDialog.menuViewToggle(true, 2);
}

function hideSettingChangeDialog() {
    curpage = 0;
    ecls('setting')[currentSetting.index].focus();
    settingChangeDialog.menuViewToggle(false);
    allowBack = settingNavigationHistory.length === 0;
}

manageSettingsPageHistory = {
    append: (category, index) => {
        settingNavigationHistory.push({
            category: category,
            index: index
        });

        allowBack = false;
    },

    back: () => {
        var li = settingNavigationHistory.pop();
        if(li) {
            currentCategory = li.category;
            updateHeader();
            initSettings(li.index);
        }
    }
}

function getSettingLabel(sn) {
    var cs = settingsList[sn];
    if(cs.type === 5) {
        return settingsListCategories[cs.action].label;
    } else {
        return cs.label;
    }
}
function getSettingValueLabel(sn,i) {
    return settingsList[sn].values[i];
}

function updateHeader() {
    eid('header').textContent = settingsListCategories[currentCategory].label;
}

function updatenavbar() {
    switch(curpage) {
        case 0:
            outputNavbar(
                null,
                'select'
            );
            break;
        case 1:
            outputNavbar(
                'cancel',
                settingsList[currentSetting.name].type < 2? 'select' : 'save'
            );
            break;
    }
}

function navigateSettings(dir) {
    currentSetting.index = navigatelist(
        actEl().tabIndex,
        ecls('setting'),
        dir
    );
    scrollIntoView(actEl(), dir === 1);
    currentSetting.name = actEl().dataset.setting;
    currentSetting.index = actEl().tabIndex;
}

function mainK(k) {
    switch(curpage) {
        case 0: mainScreenK(k); break;
        case 1: settingChangeK(k); break;
    }
}

function mainScreenK(k) {
    switch(k.key) {
        case 'ArrowUp':
            var u = -1;
        case 'ArrowDown': 
            navigateSettings(u || 1); 
            k.preventDefault();
            break;
        case 'Enter': 
            var cs = settingsList[currentSetting.name];
            switch(cs.type) {
                case 4: cs.action(); break;
                case 5:
                    manageSettingsPageHistory.append(
                        currentCategory,
                        currentSetting.index
                    );
                    currentCategory = cs.action;
                    updateHeader();
                    initSettings(0);
                    break;
                default: showSettingChangeDialog(); break;
            }
            break;
        case 'Backspace':
            k.preventDefault();
            if(settingNavigationHistory.length === 0) {
                location = '/selectNovel/index.html';
            } else {
                manageSettingsPageHistory.back();
            }
            break;
    }
}

function settingChangeK(k) {
    switch(k.key) {
        case 'ArrowUp': 
            var u = -1;
        case 'ArrowDown': 
            settingChangeDialog.navigate(u || 1);
            break;
        case 'SoftLeft':
            hideSettingChangeDialog();
            break;
        case 'Enter': 
            var cs = settingsList[currentSetting.name];
            switch(cs.type) {
                case 0: //radio
                    updateSetting(currentSetting.name, actEl().tabIndex);
                    hideSettingChangeDialog();
                    break;
                case 1: //checkbox
                    settingChangeDialog.selectItem(actEl().tabIndex);
                    updateSetting(
                        currentSetting.name, 
                        settingChangeDialog.getValue().value
                    );
                    break;

                case 3: //text
                case 2: //tel
                    var cn = settingChangeDialog.getSelected().value,
                    pass = false;
                    switch(cs.type) {
                        case 2:
                            if(/^\d+(?:\.\d+)?$/.test(cn)) {
                                pass = true;
                            }
                            break;
                        case 3:
                            pass = true;
                            if('check' in cs) {
                                if(!cs.check(cn)) {
                                    pass = false;
                                }
                            }
                            break;
                    }

                    if(pass) {
                        updateSetting(
                            currentSetting.name,
                            cn
                        );
                        hideSettingChangeDialog();
                    } else {
                        alertMessage('Invalid input.', 5000, 3);
                    }
                    break;
            }

            if('action' in settingsList[currentSetting.name]) {
                settingsList[currentSetting.name].action();
            }

            updateActiveSettingDisplay();

            break;

        case 'Backspace': 
            hideSettingChangeDialog();
            if(settingsList[currentSetting.name].type > 1) {
                alertMessage('Setting discarded.',5000,0);
            }
            k.preventDefault();
            break;

    }
}