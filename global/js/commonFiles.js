function checkInfoFile(blob) {
	return new Promise(function(resolve) {
		fileReaderA(blob, 'text').then((title)=>{
			if(title) {
				title = title.match(/^title\=([^\r\n]*)[\r\n]*$/i);
				if(title) {
					title = title[1];
				}
			}
		
			if(!title) {
				title = null;
			}

			resolve(title);
		});
	});
}