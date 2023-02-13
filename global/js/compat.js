function checkb2gns() {
	return ('b2g' in navigator)
}

function getb2g() {
	if(checkb2gns()) {
		return navigator.b2g;
	} else {
		return navigator;
	}
}

if('b2g' in navigator) {
	//stuff
}
