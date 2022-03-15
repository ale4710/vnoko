var validInstruction = [
    'text',
    'bgload',
    'setimg',
    'sound',
    'music',
    'text',
    'choice',
    'setvar',
    'gsetvar',
    'if',
    'fi',
    'jump',
    'delay',
    'random',
    'label',
    'goto',
    'cleartext'
];

function parseScript(text) {
    var textArray = text.split(scriptPatterns.newline),
    processedInstructions = [],
    labelLocations = {},
    //instructionByLineNumber = {}, //array also works it doesnt really matter honestly
    
    //below two vars are for loading and saving save files
    instructionByTextIndex = {},
    ibtiCurNum = 0,

    imagesToUse = [], //for preloading imges
    pushImageToUse = (type, path)=>{
        imagesToUse.push({
            type: type,
            path: path
        });
    },
    
    psErr = (line, reason, severity)=>{console[['warn', 'error'][severity || 0]](`parseScript: line ${line + 1}: ${reason}`);},
    
    pendingIfs = [],
    lastInstWasBranch = false //if the last instruction is a target of label or if/fi
    ;

    for(var i = 0; i < textArray.length; i++) {
        //console.log(i, textArray.length);

        var line = textArray[i];

        line = line.trim();
        if(
            line.length !== 0 &&
            line.charAt(0) !== '#'
        ) {
            var pi = {},
            inst = line.match(scriptPatterns.instruction.only);

            if(inst) {
                inst = inst[0];

                if(validInstruction.indexOf(inst) !== -1) {
                    pi.type = inst;

                    if(lastInstWasBranch) {
                        lastInstWasBranch = false;
                        pi.branchTarget = true;
                    }
    
                    var instAfter = line.match(scriptPatterns.instruction.after);
                    if(instAfter) {
                        instAfter = instAfter[1];
                        if(instAfter) {
                            instAfter = instAfter.substring(1);
                        }
                    }
                    if(!instAfter &&
                    [
                        'text',
                        'choice',
                        'bgload',
                        'setimg',
                        'sound',
                        'music',
                        'delay',
                        'random',
                        'label',
                        'goto',
                        'jump',
                        'if',
                        'setvar',
                        'gsetvar',

                    ].indexOf(inst) !== -1) {
                        psErr(i, `${inst}: parameters are required.`);
                        continue;
                    }

                    pi.lineNumber = i;
    
                    switch(inst) {
                        case 'text':
                            pi.wait = true;
                            switch(instAfter) {
                                case '~': //make blank line and autoforward
                                    pi.wait = false;
                                case '!': //make blank line, b ut dont autoforward
                                    pi.blank = true;
                                    break;
                                default:
                                    if(instAfter) {
                                        if(instAfter.charAt(0) === '@') {
                                            pi.wait = false;
                                            instAfter = instAfter.substring(1);
                                        }
                                        
                                        if(instAfter.length === 0) {
                                            psErr(i, 'malformed text line, you still need text after @ type text.');
                                            continue; //discard line...
                                        } else {
                                            pi.text = instAfter;
                                        }
                                    } else {
                                        psErr(i, 'malformed text line, it appears to have no text after "text" instruction.');
                                        continue; //discard line...
                                    }
                                    break;
                            }

                            if(pi.wait) {
                                instructionByTextIndex[ibtiCurNum] = processedInstructions.length;
                                pi.saveTextIndex = ibtiCurNum;
                            }
                            ibtiCurNum++;
                            break;
                        
                        case 'choice':
                            if(instAfter) {
                                pi.choices = instAfter.split('|');
                            } else {
                                psErr(i, 'no choices in choice command.');
                                continue;
                            }
                            break;
    
                        case 'bgload':
                            var prms = ssaws(instAfter);
                            pi.filename = prms[0];
                            pi.fadeTime = parseInt(prms[1]);

                            pushImageToUse(
                                fileTypeConsts.background,
                                pi.filename
                            );
                            break;
    
                        case 'setimg':
                            var prms = ssaws(instAfter);
                            pi.filename = prms[0];
                            pi.x = parseInt(prms[1]) || 0;
                            pi.y = parseInt(prms[2]) || 0;

                            pushImageToUse(
                                fileTypeConsts.sprite,
                                pi.filename
                            );
                            break;
    
                        case 'sound':
                            var prms = ssaws(instAfter);
                            if(prms[0] === '~') {
                                pi.stop = true;
                            } else {
                                pi.filename = prms[0];
                                pi.loops = parseInt(prms[1]);
                            }
                            break;
    
                        case 'music':
                            var prms = ssaws(instAfter);
                            if(prms[0] === '~') {
                                pi.stop = true;
                            } else {
                                pi.filename = prms[0];
                            }
                            break;
    
                        case 'delay':
                            pi.wait = parseInt(instAfter) || 0;
                            break;
    
                        case 'random':
                            var prms = ssaws(instAfter),
                            intPtrn = scriptPatterns.num.int;

                            if(
                                prms[0].match(scriptPatterns.var.justCheck) &&
                                prms[1].match(intPtrn) &&
                                prms[2].match(intPtrn)
                            ) {
                                pi.var = prms[0];
                                pi.min = parseInt(prms[1]);
                                pi.max = parseInt(prms[2]);
                            } else {
                                psErr(i, 'malformed random - max or min was not a number.');
                                continue;
                            }
                            break;
    
                        case 'cleartext':
                            var fl = false;
                            if(instAfter === '!') {
                                fl = true;
                            } else if(instAfter.charAt(0) === '$') {
                                fl = instAfter;
                            }
                            pi.fully = fl;
                            break;
    
                        case 'label':
                            labelLocations[instAfter] = processedInstructions.length;
                            continue;
    
                        case 'goto':
                            pi.name = instAfter;
                            break;
    
                        case 'jump':
                            var prms = ssaws(instAfter);
                            //console.log(instAfter,prms);
                            if(prms[0]) {
                                pi.filename = prms[0];
                                if(prms[1]) {
                                    pi.goto = prms[1];
                                }
                            } else {
                                psErr(i, 'malformed jump. ignored.');
                                continue;
                            }
                            break;
    
                        case 'if':
                        case 'setvar':
                        case 'gsetvar':
                            //see if the conditional is valid
                            var matchedConditional = instAfter.match(scriptPatterns.varOp);
                            //console.log(matchedConditional);
    
                            if(matchedConditional) {
                                //matchedConditional is...
                                //  [whole match, lefthand, operand, righthand]

                                var vlOpList;

                                switch(inst) {
                                    case 'if':
                                        vlOpList = validOperands.conditional;
                                        break;
                                    case 'gsetvar':
                                    case 'setvar':
                                        vlOpList = validOperands.operation;
                                        break;
                                }

                                var invalid = vlOpList.indexOf(matchedConditional[2]) === -1;
    
                                if(invalid) {
                                    psErr(i, 'invalid operand in ' + inst);
                                    continue;
                                } else {
                                    if(inst === 'if') {
                                        pendingIfs.push(processedInstructions.length);
                                    }
    
                                    pi.lefthand = matchedConditional[1];
                                    pi.operand = matchedConditional[2];
                                    pi.righthand = matchedConditional[3];
                                }
                            } else if(instAfter === '~ ~') {
                                pi.reset = true;
                            } else {
                                psErr(i, 'malformed ' + inst);
                                continue;
                            }
                            break;
    
                        case 'fi': //closing if
                            var lastIf = pendingIfs.pop();
                            if(!isNaN(lastIf)) {
                                processedInstructions[lastIf].end = processedInstructions.length;
                                lastInstWasFi = true;
                            } else {
                                psErr(i, 'unexpected fi.');
                            }
                            continue; //dont push to processed instruction.

                        default:
                            //invalid instruction.
                            psErr(i, `unknown instruction "${inst}"`);
                            continue;
                    }
                    processedInstructions.push(pi);
                }
            }

            
        }
    }

    if(pendingIfs.length !== 0) {
        console.warn(`there are ${pendingIfs.length} unclosed ifs if this script.`);
    }

    return {
        labelLocations: labelLocations,
        instructions: processedInstructions,
        instructionByTextIndex: instructionByTextIndex,
        imagesToUse: imagesToUse
    };
}