export const makeRequest = function(url:string, method:string = 'GET', headerFields:{} = {}, formFields:{} = {}):any {

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

	request.open(method || 'GET', url, true);
    for(const key in headerFields){
      request.setRequestHeader(key, headerFields[key]);
    }        
    if(method === 'GET'){
      request.send();
    }
    else if(method === 'POST'){
      const contentType:string = headerFields['Content-Type'];
      //request.setRequestHeader('Content-Type', 'multipart/form-data');
      //request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      if(!('Content-Type' in headerFields)){
        request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        request.send(JSON.stringify(formFields));
      }
      else if(contentType.startsWith('application/json')){
        request.setRequestHeader('Content-Type', contentType);
        request.send(JSON.stringify(formFields));          
      }
      else if(['multipart/form-data', 'application/x-www-form-urlencoded'].includes(contentType)){
        const formData = new FormData();
        for(const key in formFields){
          formData.append(key, formFields[key]);
        }    
        request.send(formData);  
      }      
    }	
  });
};

export const getCookie = function(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
};

export const setCookie = function(name, value, days) {
    var d = new Date;
    d.setTime(d.getTime() + 24*60*60*1000*days);
    document.cookie = name + '=' + value + ';path=/;expires=' + d.toUTCString();
};

export const deleteCookie = function(name) { 
  setCookie(name, '', -1); 
};