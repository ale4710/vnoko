function getSettingKey(setNm) {
    return 'setting-' + setNm;
}

function getSettingValue(sn) {
    var sn = localStorage.getItem(getSettingKey(sn));
    if(sn === null) {
        return null;
    } else {
        try {
            return JSON.parse(sn);
        } catch(e) {
            return sn;
        }
    }
}