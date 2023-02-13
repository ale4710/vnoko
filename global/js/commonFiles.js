function checkInfoFile(blob, callback) {
	return new Promise(function(resolve) {
		blobToText(blob, (title)=>{
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