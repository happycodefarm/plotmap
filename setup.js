// helpers
function $id(id) {
	return document.getElementById(id);
}

function getHTTPObject() {
	var xmlhttp;
	xmlhttp = false;
    // branch for native XMLHttpRequest object
    if(window.XMLHttpRequest && !(window.ActiveXObject)) {
    	try {
			xmlhttp = new XMLHttpRequest();
        } catch(e) {
			xmlhttp = false;
        }
		// branch for IE/Windows ActiveX version
    } else if(window.ActiveXObject) {
    
        try {
          	xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch(e) {
			alert ("Ajax not supported");
          	xmlhttp = false;
        }
    }
	return xmlhttp;
}

function plot_build_setup_form() {
	var login_form = document.createElement("form");
	login_form.noValidate = true;
	login_form.setAttribute('action',"#");
	login_form.setAttribute('onsubmit',"return plot_setup()");
	login_form.setAttribute("id", "plot--setup-form");
	
	var login_input = document.createElement("input");
	login_input.setAttribute("type","text");
	login_input.setAttribute("novalidate", "true");
	login_input.setAttribute("id", "plot--setup-input-login");
	login_input.setAttribute("placeholder", "login");
	
	var password_input = document.createElement("input");
	password_input.setAttribute("type","password");
	password_input.setAttribute("novalidate", "true");
	password_input.setAttribute("id", "plot--setup-input-password");
	password_input.setAttribute("placeholder", "password");
	password_input.setAttribute("required", "true");
	
	var login_submit = document.createElement("input");
	login_submit.setAttribute("type","submit");
	login_submit.setAttribute("value", "setup");
	login_submit.setAttribute("novalidate", "true");
	login_submit.setAttribute("required", "true");
	
	login_form.appendChild(login_input);
	login_form.appendChild(password_input);
	login_form.appendChild(login_submit);
	
	document.body.appendChild(login_form);
}

function plot_setup() {

	var JSONMarker = {
		login:$id("plot--setup-input-login").value,
		password:$id("plot--setup-input-password").value
	}

	var JSONString = JSON.stringify(JSONMarker);
	console.log(JSONString);
	
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'setup.php', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);
	
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			try {
				obj = JSON.parse(xmlHttp.responseText);
				if (obj.success == true) {
					alert("ok");
					window.location = "index.html";
				} else {
					alert("an error occurred while setting up plotmap");
				}
			} catch (e) {
				console.log("plot setup error: " + e.message + xmlHttp.responseText);
			}
		}
	}
}