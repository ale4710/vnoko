/* taken from bankitube. */

var 
settingsList = {
    /* 
    'setting-name': {
        'label': string,
        //is just the label. it is different from setting-name.

        'values': ['setting value 1', 'setting value 2', 'etc'],
        //values is what will be displayed, when type is not [ 4 ], [ 2 ], or [ 3 ].

        'type': number,
        //type of setting.
        // 0 = select 1 setting only
        // 1 = select multiple
        // 2 = number input
        // 3 = text input
        // 4 = excecute function
        // 5 = go to settings page

        'action': () => {} or string,
        //when type is [ 4 ] it will excecute the function. should be function.
        //when type is [ 5 ] it will go to that setting category. should be string.
        //any other type, it will excecute the function after it changes the setting.

        'default': number or string,
        //default setting

        'check': function,
        //used for text input, to check for valid input.

        'help': string,
        //used for the "help" action. shows what the setting will do, or something.
    }
    */

    'rescan-novels': {
        label: 'Rescan Novels',
        type: 4,
        action: ()=>{
            messageBox(
                'Are you sure??',
                'Do you really want to rescan the library? If you have a lot of novels or you have one novel with a lot of resources (i.e. a fully voiced novel), it will take a long time, i\'m sure of it.',
                {
                    left: messageBoxOption(
                        messageBoxDefaultBackCallback,
                        'no'
                    ),
                    right: messageBoxOption(
                        ()=>{
                            localStorage.removeItem('novelList');
                            location = '/selectNovel/index.html'
                        },
                        'yes'
                    )
                }
            );
        }
    },
    'use-novel-font': {
        label: 'Use Novel Font',
        type: 0,
        default: 1,
        values: [
            'Don\'t Use',
            'Use'
        ]
    },
    'font-size': {
        label: 'Font Size',
        type: 2,
        default: 12
    },
    'default-display-mode': {
        label: 'Default Display Mode',
        type: 0,
        default: 0,
        values: [
            'ADV',
            'NVL'
        ]
    },

    'about': {
        label: 'About VNoko',
        type: 4,
        action: ()=>{
            messageBox(
                'VNoko ~ ver2022-03-14',
                '<center>VNoko</center>version 2022-03-14.<br>created by ale4710.<br><br>using the vnds file format.<br><br>attribution:<br><b>JSZip</b> - v3.5.0 by Stuart Knightley, licenced under MIT Licence.<br><br>that\'s it. enjoy reading!!!',
                {
                    center: messageBoxOption(messageBoxDefaultBackCallback, 'ok')
                }
            );
        }
    },

    'category-display': {
        action: 'display',
        type: 5
    },
},

settingsListCategories = {
    //label is the label of the category.
    //settings is an array with the names from above. they will be displayed in this order.

    'default': {
        label: 'Settings',
        settings: [
            'rescan-novels',
            'category-display',
            'about'
        ]
    },
    'display': {
        label: 'Display',
        settings: [
            'default-display-mode',
            'font-size',
            'use-novel-font'
        ]
    }
}
;
