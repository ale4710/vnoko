var 
variables = {},
globalVariables = {},
validOperands = {
    conditional: [
        '==',  //0
        '!=', //1
        '>', //2
        '>=', //3
        '<', //4
        '<=', //5
    ],
    operation: [
        '+', //0
        '-', //1
        '=' //2
    ]
},
operands = {
    equalTo: validOperands.conditional[0],
    notEqualTo: validOperands.conditional[1],
    greaterThan: validOperands.conditional[2],
    greaterThanOrEqualTo: validOperands.conditional[3],
    lessThan: validOperands.conditional[4],
    lessThanOrEqualTo: validOperands.conditional[5],
    add: validOperands.operation[0],
    subtract: validOperands.operation[1],
    set: validOperands.operation[2]
},
operandsAction = {};

(()=>{
    var vn = variableNormalize,
    eq = (a,b)=>{
        return vn(a) == vn(b); //using fuzzy equalto.
    },
    numcomp = (a,b,cf)=>{
        a = vn(a), b = vn(b);
        if(
            typeof(a) === 'number' &&
            typeof(b) === 'number'
        ) {
            return cf(a,b);
        } else {
            return false;
        }
    },
    gt = (a,b)=>{return a > b;},
    lt = (a,b)=>{return a < b;},
    gteq = (a,b)=>{return a >= b;},
    lteq = (a,b)=>{return a <= b;},
    set = (a,b,cb,gbl)=>{
        cb = cb || emptyFn;
        console.log(
            gbl? 'global' : 'local',
            'set',a,'to',b
        );

        variables[a] = b;

        if(gbl) {
            globalVariables[a] = b;
            writeSaveFile(
                glbFileName,
                cb
            );
        } else {
            setTimeout(cb);
        }
    },
    add = (vr, val, cb, gbl)=>{

        var actvr = variables[vr];
        if(actvr === undefined) {actvr = 0;}


        console.log('add (name, value, addvalue)',vr,actvr,val);
        set(
            vr,
            actvr + vn(val),
            cb,
            gbl
        );
    };

    operandsAction[operands.equalTo] = eq;
    operandsAction[operands.notEqualTo] = (a,b)=>{return !eq(a, b);}

    operandsAction[operands.greaterThan] = (a,b)=>{return numcomp(a, b, gt);}
    operandsAction[operands.lessThan] = (a,b)=>{return numcomp(a, b, lt);}

    operandsAction[operands.greaterThanOrEqualTo] = (a,b)=>{return numcomp(a, b, gteq);}
    operandsAction[operands.lessThanOrEqualTo] = (a,b)=>{return numcomp(a, b, lteq);}

    operandsAction[operands.set] = set;
    operandsAction[operands.add] = add;
    operandsAction[operands.subtract] = (vr, val, cb, gbl)=>{
        val = vn(val);
        if(typeof(val) === 'number') {
            add(
                vr,
                val * -1,
                cb,
                gbl
            );
        } else {
            console.error('variable operation: cannot subtract when righthand is a not a number.');
        }
    };
})();

function reassignGlobalVariables() {
    Object.keys(globalVariables).forEach((gvk)=>{
        variables[gvk] = globalVariables[gvk];
    });
}


function serializeGlobalVariables() {
    var gvxml = document.implementation.createDocument(null, 'global'),
    gvxmlBody = gvxml.querySelector('global');
    
    Object.keys(globalVariables).forEach((gvk)=>{
        var gvs = serializeVariable(
            gvxml,
            gvk,
            globalVariables[gvk]
        );
        if(gvs) {
            gvxmlBody.appendChild(gvs);
        }
    });

    return (new XMLSerializer()).serializeToString(gvxml);
}

function serializeVariable(xmlRoot, varname, varval) {
    var tv = xmlRoot.createElement('var'),
    vartype;
    switch(typeof(varval)) {
        case 'number': vartype = 'int'; break;
        case 'string': vartype = 'str'; break;
        default: return;
    }
    tv.setAttribute('name', varname);
    tv.setAttribute('type', vartype);
    tv.setAttribute('value', varval);

    return tv;
}

function variableNormalize(v, noLookStored) {
    switch(typeof(v)) {
        case 'string':
            if(v.match(regexs.num.float)) { //is number
                return parseFloat(v);
            } else {
                var s = v.match(scriptPatterns.string); //is valid string
                if(s) {
                    return s[1];
                } else if(!noLookStored) {
                    //default to variable...
                    var storedv = variables[v];
                    if(storedv) {
                        return storedv;
                    }
                     //otherwise, we will go allthe way to the end of the fn and return 0
                }
            }
            break;
        case 'number':
            if(
                !isNaN(v) &&
                isFinite(v)
            ) {
                return v;
            }
            break;
    }

    return 0;
}

function rtIfVariable(str) {
    if(typeof(str) === 'string') {
        var vm = str.match(scriptPatterns.var.unwrappedWhole);
        if(vm) {
            if(vm[1] in variables) {
                return variables[vm[1]];
            }
        }
    }
    return str;
}

function replaceAllVar(str) {
    var repFn = (m, varname)=>{
        if(varname in variables) {
            return variables[varname];
        } else {
            return `[VAR:${varname}]`;
        }
    },
    
    privateCharacter = String.fromCharCode(0xe573), //a character from unicode private use area.
    repDolToPC = (s)=>{
        return s.replace('$$', privateCharacter); //$$20 -> {privateCharacter}20
    }
    ;

    str = repDolToPC(str);
    str = str.replace(scriptPatterns.var.wrapped, repFn); //{$whatever} -> whatever
    str = repDolToPC(str);
    str = str.replace(scriptPatterns.var.unwrapped, repFn); //$whatever -> whatever
    str = repDolToPC(str);
    str = str.replace(privateCharacter, '$'); //{privateCharacter} -> $

    return str;
}