//stolen from bankitube again ;)
if(isClassSupported()) {
    window.OptionsMenu = class OptionsMenu {
        constructor(headerLabel) {
            this.allowBackCV = null;
    
            this.screen = makeEl('div');
            this.screen.classList.add(
                'dimmer',
                'main-screen'
            );
            toggleHiddenClass(this.screen, true); //add 'hidden' class
    
            this.container = makeEl('div');
            this.container.classList.add('option-menu-cont');
    
            var header = makeHeader();
            this.header = header.text;
            this.header.textContent = headerLabel;
    
            this.menu = makeEl('div');
            this.menu.classList.add('option-menu');
    
            
            this.screen.appendChild(this.container);
            this.container.appendChild(header.header);
            this.container.appendChild(this.menu);
            document.body.appendChild(this.screen);
        }
    
        updateHeader(headerLabel) {
            this.header.textContent = headerLabel;
        }
    
        clearMenu() {
            var mc = this.menu.children;
            while(mc.length !== 0) {mc[0].remove()}
        }
    
        navigate(d) {
            if(d === 0) {
                this.menu.children[0].focus();
            } else {
                navigatelist(
                    actEl().tabIndex,
                    this.menu.children,
                    d
                )
            }
        }
    
        menuViewToggle(v,f,fn) {
            if(v) {
                this.screen.classList.remove('hidden');
                this.allowBackCV = allowBack;
                allowBack = false;
                if(f) {
                    if(isNaN(fn)) {fn = 0;}
                    if(fn in this.menu.children) {
                        this.menu.children[fn].focus();
                    }
                }
            } else {
                this.screen.classList.add('hidden');
                if(typeof(this.allowBackCV) === 'boolean') {allowBack = this.allowBackCV;}
                this.allowBackCV = null;
            }
        }
    
        addOption(label) {
            var opt = makeEl('div');
            opt.classList.add('option-entry');
            opt.tabIndex = this.menu.children.length;
            opt.textContent = label;
            this.menu.appendChild(opt);
            return opt;
        }
    }

    var optionsMenuTakenRandGroupNames = [];
    window.OptionsMenuSelectable = class OptionsMenuSelectable extends OptionsMenu {
        constructor(headerLabel, type, groupName) {
            super(headerLabel);

            this.validTypes = [
                'radio',
                'checkbox',
                'text',
                'tel'
            ];
        
            this.textTypes = [
                'text',
                'tel'
            ];

            if(!this.changeType(type)) {
                throw TypeError(`Type "${type}" is not valid.`);
            }
            this.inputType = type;
            if(!groupName) {
                groupName = 0;
                while(optionsMenuTakenRandGroupNames.indexOf(groupName) !== -1) {
                    groupName = Math.floor(Math.random() * Math.pow(10, 20));
                }
                optionsMenuTakenRandGroupNames.push(groupName);
            }
            this.groupName = 'optionsMenuSelectable' + groupName;
        }

        selectItem(n) {
            //n = actEl() tabindex?
            if(this.textTypes.indexOf(this.inputType) === -1) { //not a text-type
                var tc = this.menu.children;
                if(n in tc) {
                    var ie = tc[n].children[0];
                    ie.checked = !ie.checked;
                }
            }
        }

        getSelected() {
            if(this.menu.children.length === 0) {return false;}

            var e,s,
            cb = ()=>{return this.menu.querySelectorAll('input:checked')};

            switch(this.inputType) {
                case 'radio':
                    e = cb()[0];
                    s = parseInt(e.tabIndex);
                    break;
                case 'checkbox':
                    e = cb();
                    s = [];
                    for(var i = 0; i < e.length; i++) {
                        s.push(parseInt(e[i].tabIndex));
                    }
                    break;
                case 'text':
                case 'tel':
                    e = this.menu.children[0];
                    s = e.value;
                    break;
            }

            return {
                value: s,
                element: e
            }
        }

        checkValidType(t) {
            return this.validTypes.indexOf(t) !== -1;
        }
        checkTextType(t) {
            return this.textTypes.indexOf(t) !== -1;
        }

        changeType(ntype) {
            if(this.checkValidType(ntype)) {
                this.clearMenu();
                this.inputType = ntype;
                if(this.checkTextType(ntype)) {
                    this.addOption('');
                }
                return true;
            } else {
                return false;
            }

        }

        menuViewToggle(v,ft,n) {
            //v = visible? (true/false)
            //ft = focus type. 0 = nah, 1 = manual focus, 2 = focus on selected (depending on type)
            //n = which one to focus to (only works when ft = 1)
            if(v) {
                if(
                    ft === 2 &&
                    this.inputType === 'radio'
                ) {
                    var selel = this.menu.querySelector('input:checked');
                    if(selel) {
                        n = selel.parentElement.tabIndex;
                    }
                }
            }

            super.menuViewToggle(v,ft,n);
        }

        addOption(label, selected) {
            var input = makeEl('input');
            input.type = this.inputType;

            if(this.checkTextType(this.inputType)) {
                if(this.menu.children.length === 0) {
                    input.tabIndex = 0;
                    this.menu.appendChild(input);
                    return input;
                } else {
                    return null;
                }
            }

            var opt = super.addOption(label);

            input.name = this.groupName;
            input.checked = !!selected;

            opt.appendChild(input);

            var inputDisp = makeEl('span');
            inputDisp.classList.add('vertical-center');
            opt.appendChild(inputDisp);
            return opt;
        }
    }

    window.Tabs = class Tabs {
        constructor(appendToBody, existingContainer) {
            if(existingContainer) {
                this.container = existingContainer;
            } else {
                this.container = makeEl('div');
            }
            this.container.classList.add('tabstrip-cont');

            this.tabStrip = makeEl('div');
            this.tabStrip.classList.add('tabstrip');

            this.container.appendChild(this.tabStrip);

            this.tabs = {
                byNumber: [],
                byId: {}
            }

            if(appendToBody) {
                document.body.appendChild(this.container);
            }

            this.errors = {
                unsupportedType: TypeError('you passed an unsupported type to removeTab(). Expected string or number.')
            }
        }

        addTab(label,id) {
            var ct = makeEl('div');
            ct.classList.add('tabstrip-tab');
            ct.textContent = label;
            if(!id) {
                var l = true;
                while(id in this.tabs.byId || l) {
                    id = Math.random().toString();
                    l = false;
                }
            }
            this.tabs.byId[id] = {
                element: ct,
                index: id
            };
            this.tabs.byNumber.push({
                element: ct,
                id: id
            });

            this.tabStrip.appendChild(ct);
        }

        removeTab(id) {
            switch(typeof(id)) {
                case 'string': 
                    if(id in this.tabs.byId) {
                        var ct = this.tabs.byId[id], 
                        ix = this.tabs.byId[id].index;
                        ct.element.remove();
                        delete this.tabs.byId[id];
                        this.removeTab(ix);
                    }
                    break;
                case 'number': 
                    if(id in this.tabs.byNumber) {
                        var ri = this.tabs.byNumber.splice(id,1)[0];
                        ri.remove();
                        this.removeTab(ri.id);
                    }
                    break;
                default: throw this.errors.unsupportedType;
            }
        }

        focusTab(id) {
            this.tabs.byNumber.forEach((t)=>{
                t.element.classList.remove('active');
            });

            var activeTab;

            switch(typeof(id)) {
                case 'string': activeTab = this.tabs.byId; break;
                case 'number': activeTab = this.tabs.byNumber; break;
                default: throw this.errors.unsupportedType;
            }

            activeTab = activeTab[id].element;
            activeTab.classList.add('active');

            this.tabStrip.scrollTo(
                activeTab.offsetLeft + (activeTab.offsetWidth / 2) - 
                (this.tabStrip.offsetWidth / 2)
            ,0);
        }
    }
}