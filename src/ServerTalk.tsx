export const makeRequest = function(url:string, method:string = '', headerFields:{} = {}, formFields:{} = {}) {

  const request = new XMLHttpRequest();

  return new Promise(function (resolve:Function, reject:Function) {

    request.onreadystatechange = function () {
	  if(request.readyState !== 4) {
        return;
      }
	  if(request.status >= 200 && request.status < 300) {
	    resolve(request.responseText);
	  } 
      else {
	    reject({
          status: request.status,
		  statusText: request.statusText
		});
	  }    
	};
    for(const key in headerFields){
      request.setRequestHeader(key, headerFields[key]);
    }    
	request.open(method || 'GET', url, true);
    if(method === 'GET'){
      request.send();
    }
    else if(method === 'POST'){
      //request.setRequestHeader('Content-Type', 'multipart/form-data');
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      const formData = new FormData();
      for(const key in formFields){
        formData.append(key, formFields[key]);
      }
      request.send(formData);
    }	
  });
};
