// Initialize a map

var plotMapSettings = {	"siteTitle":"PlotMap",
						"siteSubtitle":"-",
						"backgroundColor":"#000",
						"titleColor":"#CCC"
						};

var southWest = L.latLng(-90, -360),
    northEast = L.latLng(90, 360),
    bounds = L.latLngBounds(southWest, northEast);
    
var bounds = L.latLngBounds([
       southWest,
       northEast
]);

var map = new L.Map('plotmap-map', {
	maxZoom : 22,
	minZoom : 1,
	center : [0,0],
	zoom : 2,
	reuseTiles: true,
	fullscreenControl: true,
	worldCopyJump: true,
	contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [{
        text: 'Show coordinates',
        callback: showCoordinates
    }, {
        text: 'Center map here',
     	callback: centerMap
    }, '-', {
        text: 'Zoom in',
        icon: 'images/zoom-in.png',
        callback: zoomIn
    }, {
        text: 'Zoom out',
        icon: 'images/zoom-out.png',
        callback: zoomOut
    }]
	//crs: L.CRS.EPSG4326//,
	//maxBounds:bounds					
});

var plotgroup = L.layerGroup();
var markersAttributes = [];
var geojsonLayer = L.geoJson().addTo(map);
var pingTimeOut;

var popup = L.popup().setContent('<p>Hello world!<br />This is a nice popup.</p>'); 


// add attributesControl
var attributesControl = L.control.attributes(markersAttributes).addTo(map);	

// add layer control
var controlLayer = L.control.layers(null,null).addTo(map); //<--- bug , disable drag when show overlay
	
var pingPeriod=5000;

map.userLoc = L.latLng(0,0);
map.locating = false;


var settingsOn = false;
function showSettings(state) {
	var elements = document.getElementsByClassName('pm-display-settings');
		
	[].forEach.call(elements, function( element ) {
		element.style.display = state==1?"inline":"none";
		element.style.opacity= state==1?"1":"0";
	});
	settingsOn = state;
	
	settingsOn ? disableInteraction() : enableInteraction();
}
		
/********/

/************/

 		
function initMap() {
 	plotMapPingLogin();
 	plotMapReadSettings();
 	//loadGeoJSON();
 	
 	/*
	L.geoJson(data, {
    	style: function (feature) {
        	return {color: feature.properties.color};
    	}
	}).addTo(map);
	*/
	
	// restore map view 
	if (!map.restoreView()) {
	  map.setView([43.45341735477626, 5.4773712158203125], 11);
	}
	
	// add layer group
	plotgroup.addTo(map);
	
	getDatabaseMaps();
	getDatabaseOverlays();
	
	
	// setup attribut list
	initAttributesList();
	
	// add plotmap controls
	
	// add layer control
	var addLayerControl = L.Control.extend({
		initialize: function (foo, options) {
				L.Util.setOptions(this, options);
			},
			onAdd: function (map) {
			var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');

			var controlUI = L.DomUtil.create('a', '', controlDiv);
			controlUI.title = 'Add Layer';
			controlUI.href = '#';
			controlUI.innerHTML = "🚩";

			L.DomEvent
			.addListener(controlUI, 'click', L.DomEvent.stopPropagation)
			.addListener(controlUI, 'click', L.DomEvent.preventDefault)
			.addListener(controlUI, 'dblclick', L.DomEvent.stopPropagation)
			.addListener(controlUI, 'dblclick', L.DomEvent.preventDefault)
			
			.addListener(controlUI, 'click', function(){
				plotgroup.eachLayer(function (layer) {
				});
			});
			
			return controlDiv;
		}
	});
	
	// add marker control
	var addMarkerControl = L.Control.extend({
		initialize: function (foo, options) {
				L.Util.setOptions(this, options);
			},
			onAdd: function (map) {
			var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar plotmap-control-add-marker');

			var controlUI = L.DomUtil.create('a', '', controlDiv);
			controlUI.title = 'Add Marker';
			controlUI.href = '#';

			L.DomEvent
			.addListener(controlUI, 'click', L.DomEvent.stopPropagation)
			.addListener(controlUI, 'click', L.DomEvent.preventDefault)
			.addListener(controlUI, 'dblclick', L.DomEvent.stopPropagation)
			.addListener(controlUI, 'dblclick', L.DomEvent.preventDefault)
				
			.addListener(controlUI, 'click', function(){
				
				var marker = map.locating ? L.marker(map.userLoc) : L.marker(map.getCenter());
				
				var date = new Date();
				
				marker.id = '';
				marker.map = 'plot';
				marker.title = date.toLocaleDateString()+" "+date.toLocaleTimeString();
				marker.type = 'html';
				marker.preview = '';
				marker.content = '';
				marker.attributes = "";
				marker.locked = 0;
				marker.icon = "default";
				marker.bindLabel(marker.title, {direction: 'auto'});
				
				createMarker(marker);
				editMarker(marker);
			});
		
			return controlDiv;
		}
	});
	
	// add geoloc control
	var geoLocControl = L.Control.extend({
		initialize: function (foo, options) {
				L.Util.setOptions(this, options);
			},
			onAdd: function (map) {
			var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar plotmap-control-geoloc');

			var controlUI = L.DomUtil.create('a', '', controlDiv);
			controlUI.title = 'Enable Geolocation';
			controlUI.href = '#';
			
			L.DomEvent
			.addListener(controlUI, 'click', L.DomEvent.stopPropagation)
			.addListener(controlUI, 'click', L.DomEvent.preventDefault)
			.addListener(controlUI, 'dblclick', L.DomEvent.stopPropagation)
			.addListener(controlUI, 'dblclick', L.DomEvent.preventDefault)
			
			.addListener(controlUI, 'click', function(){
				if (map.locating==true) {
					//console.log("locate off");
					//var container = this.getContainer();
					L.DomUtil.removeClass(this.parentElement, 'plotmap-control-on');
					controlUI.title = 'Enable Geolocation';
					
					map.stopLocate();
					map.userLoc = map.getCenter();
					map.locating = false;
				} else {
					//console.log("locate on");
					//var container = this.getContainer();
					L.DomUtil.addClass(this.parentElement, 'plotmap-control-on');
					controlUI.title = 'Disable Geolocation';
					
					map.locate({
						watch:true,
						setView:false,
						maximumAge:30000
					});
					
					map.locating = true;
				}
				
			});
			
			return controlDiv;
		}
	});
	
		
	//map.addControl(new addLayerControl('bar', {position: 'topleft'}));
	map.addControl(new addMarkerControl('bar', {position: 'bottomleft'}));
	map.addControl(new geoLocControl('bar', {position: 'topleft'}));
	
	var osmGeocoder = new L.Control.OSMGeocoder();
	map.addControl(osmGeocoder);
	
	
	// geolocalisation
	map.on('locationfound', function(e) {
		//console.log("geo ok !" + e.latlng.lat + "  "+ e.latlng.lng);
		map.userLoc = e.latlng;
		
	});
	
	map.on('locationerror', function(e) {
		//console.log("geo bad !" + e.message+" - " + e.code);
    	map.userLoc = map.getCenter();
	});
	
	// install map layer restoration handler.	
	map.on('baselayerchange', function(e) {
  		//console.log(e);
  		var storage = window.localStorage || {};
  		storage['mapMap'] = JSON.stringify(e.name);
	});
	

	map.on('attributechange', function(e) {
		//console.log("att changed------------------"+e.attributes);
		
		var activeAttributes = e.attributes;
		
		plotgroup.eachLayer(function (marker) {
			
			if(marker.hasOwnProperty('attributes')) {
				marker.setOpacity(0.5); // first disable
				
				for (attributeid in marker.attributes) {
		
					if (activeAttributes.indexOf(marker.attributes[attributeid])>=0) {
						marker.setOpacity(1.0); // then enable the good ones
						//console.log("showing "+marker.title);
						break;
					}
				}
			}
		});
	});
	
	// map.on('contextmenu',function(e){
// 		popup.setLatLng(e.latlng);
//     	popup.openOn(map);
// 	});
	
	// map.on('attributecheck', function(e) {
// 
// 		
// 	});
	
	// map.on('attributeuncheck', function(e) {
// 
// 	});
	
	// get markers from db
	getDatabaseMarkers();
	
	// files drag and drop
	theMap = document.getElementById("plotmap-map");
	theMap.setAttribute("draggable",true);
	//theMap.setAttribute("ondragstart","plotMapDragFile(event);");
	theMap.setAttribute("ondragover","plotMapAllowDrop(event);");
	theMap.setAttribute("ondrop", "plotMapFileUploadSelectHandler(event)");
}

// end map init

function initAttributesList() {

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?attributes=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send();

	// get back attributes from db
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				//console.log("error json parse:"+ err);
				return;
			}
			
			markersAttributes = json.attributes;
			attributesControl.initialize(markersAttributes);
 			attributesControl._update(); 
		}
	}
}

function plotMapReadSettings() {
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?settings=true&maps=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send();
	
	xmlHttp.onreadystatechange=function() {
		if (xmlHttp.readyState == 4) {
		
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse"+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			plotMapSettings = json.settings;
			
			// UI
			document.getElementById('plotmap-title').innerHTML = plotMapSettings.siteTitle;
			document.getElementById('plotmap-subtitle').innerHTML = plotMapSettings.siteSubtitle;
			document.getElementById('plotmap-header').style.color = plotMapSettings.titleColor;
			
			document.body.style.backgroundColor = plotMapSettings.backgroundColor;
			
			// setting menu
			document.getElementById('plotmap-input-site-title').value = plotMapSettings.siteTitle;
			document.getElementById('plotmap-input-site-subtitle').value = plotMapSettings.siteSubtitle;
			document.getElementById('plotmap-input-background-color').value = plotMapSettings.backgroundColor;
			document.getElementById('plotmap-input-title-color').value = plotMapSettings.titleColor;
			
			// maps list
			//console.log("listing  maps");
			maps = json.maps;
			
			//console.log("maps are "+maps);
			
			var mapList = document.getElementById('plotmap-map-list-table')
			
			for(var i = 0; i < maps.length; i++)  {
				//console.log(maps[i]);
				var tr = document.createElement("tr");
				
				var nametd = document.createElement("td");
				var urltd = document.createElement("td");
				var urltd = document.createElement("td");
				
				var name = document.createElement("input");
				var url = document.createElement("input");
				
				name.setAttribute("type", "text");
				name.value = maps[i].name;
				url.setAttribute("type", "text");
				url.value = maps[i].url;
				
				nametd.appendChild(name);
				urltd.appendChild(url);
				
				tr.appendChild(nametd);
				tr.appendChild(urltd);
				
				mapList.appendChild(tr);
			}
			//console.log("done");
		}
	}
}

function plotMapSaveSettings() {

	plotMapSettings.siteTitle = document.getElementById('plotmap-input-site-title').value;
	plotMapSettings.siteSubtitle = document.getElementById('plotmap-input-site-subtitle').value;
	plotMapSettings.backgroundColor = document.getElementById('plotmap-input-background-color').value;
	plotMapSettings.titleColor = document.getElementById('plotmap-input-title-color').value;
	
	var JSONString = JSON.stringify(plotMapSettings);
	
	//console.log(JSONString);
		
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?settings=true&save=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);
	
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			console.log("receiving db settings");
			console.log(xmlHttp.responseText);
			//console.log("done");
			
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse"+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			plotMapSettings = json.settings;
			
			// UI
			document.getElementById('plotmap-title').innerHTML = plotMapSettings.siteTitle;
			document.getElementById('plotmap-subtitle').innerHTML = plotMapSettings.siteSubtitle;
			document.getElementById('plotmap-header').style.color = plotMapSettings.titleColor;
			
			document.body.style.backgroundColor = plotMapSettings.backgroundColor;
			
			// setting menu
			document.getElementById('plotmap-input-site-title').value = plotMapSettings.siteTitle;
			document.getElementById('plotmap-input-site-subtitle').value = plotMapSettings.siteSubtitle;
			document.getElementById('plotmap-input-background-color').value = plotMapSettings.backgroundColor;
			document.getElementById('plotmap-input-title-color').value = plotMapSettings.titleColor;
		}
	}
	return false;
}

function getDatabaseMaps() {
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?maps=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send();
	
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){

			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
				//console.log("done parsing");
			} catch (err) {
				console.log("error json parse"+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			var allmaps = json.maps;
			
			//console.log(allmaps.length);
			
			// get last map name
			var storage = window.localStorage || {};
			var lastMapName = "";
			try {
				lastMapName =  JSON.parse(storage['mapMap'] || ''); ;
				//console.log("last map is "+ lastMapName);
			} catch (err) {
				console.log("no last map");
			}
			var currentMap = null;
			
			for(var i = 0; i < allmaps.length; i++) {
				
				//console.log("adding "+allmaps[i].name);
				
				var mapLayer = L.tileLayer(allmaps[i].url, {
						attribution: allmaps[i].attribution + " | <a id='plotmap-show-settings' href='#' onclick='showSettings(!settingsOn)'>⌘</a>",
						maxZoom: allmaps[i].maxZoom,
						minZoom: allmaps[i].minZoom,
						reuseTiles:allmaps[i].reuseTiles
				});
				
				if (allmaps[i].boundsLatNorth !=null) {
					var mapBounds = new L.LatLngBounds(
              			new L.LatLng(allmaps[i].boundsLatNorth, allmaps[i].boundsLongWest),
              			new L.LatLng(allmaps[i].boundsLatSouth, allmaps[i].boundsLongEast));
              			
              			mapLayer.bounds = mapBounds;
				}
	
				// add saved or first layer to map
				if (i==0) currentMap = mapLayer;
				else if (lastMapName== allmaps[i].name) {
					//console.log("restoring map");
					currentMap = mapLayer;
				}
				
				// add layer to controlLayer
				controlLayer.addBaseLayer(mapLayer,allmaps[i].name);
				mapLayer.zIndex = 0;
			}
			
			currentMap.addTo(map);
			
			var mapLayer = L.tileLayer("blank.png", {
						attribution: 'PlotMap',
						maxZoom: 22,
						minZoom: 0,
						reuseTiles:false
			});
			
			controlLayer.addBaseLayer(mapLayer,"no map");
		}
	}
}

function getDatabaseOverlays() {
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?overlays=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send();
	
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			//console.log("receiving db overlays");
			console.log(xmlHttp.responseText);
			//console.log("done");
			
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse "+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			var overlays = json.overlays;
			
			for(var i = 0; i < overlays.length; i++) {
				
				//console.log("added "+overlays[i].name);
				
				var overlayBounds = null;
				
				if (overlays[i].boundsLatNorth !=null) {
					overlayBounds = new L.LatLngBounds(
              			new L.LatLng(overlays[i].boundsLatNorth, overlays[i].boundsLongWest),
              			new L.LatLng(overlays[i].boundsLatSouth, overlays[i].boundsLongEast));
              	}
				
				var overlayLayer = L.tileLayer(overlays[i].url, {
						attribution: overlays[i].attribution,
						maxZoom: overlays[i].maxZoom,
						minZoom: overlays[i].minZoom,
						reuseTiles:overlays[i].reuseTiles,
						bounds: overlayBounds
				});
				
				// add layer to controlLayer
				controlLayer.addOverlay(overlayLayer,overlays[i].name);
			}
		}
	}
}

function getDatabaseMarkers() {
// send JSON
	var JSONMarker = {
		map:"plot"
	}
	var JSONString = JSON.stringify(JSONMarker);

	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?fetch=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);

	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
		
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse "+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			var markers = json.markers;

			//var myIcon = L.divIcon({iconSize: [24, 24], html: "<font size='10'>🚩</font>"});
			for(var i = 0; i < markers.length; i++) {

				var marker = L.marker([markers[i].lat,markers[i].lng]);
				//var marker = L.marker([obj[i].lat,obj[i].lng],{icon:myIcon});
				marker.id = markers[i].id;
				marker.map = markers[i].map;
				marker.title = markers[i].title;
				marker.preview = markers[i].preview;
				marker.type = markers[i].type;
				marker.content = markers[i].content;
				marker.locked = markers[i].locked;
				marker.attributes = markers[i].attributes;
				marker.icon = markers[i].icon;
				
				marker.bindLabel(markers[i].title, {direction: 'auto'});
				
				placeMarker(marker);	
			}
		}
	}
}


function createMarker(marker) {

	//console.log("creating marker");
	// send JSON
	var JSONMarker = {
		id:marker.id,
		map:marker.map,
		title:marker.title,
		preview:marker.preview,
		type:marker.type,
		content:marker.content,
		lat:marker.getLatLng().lat,
		lng:marker.getLatLng().lng,
		attributes:marker.attributes,
		locked:marker.locked,
		icon:marker.icon
	}
	var JSONString = JSON.stringify(JSONMarker);
	
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?create=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);
	
	//console.log("json obj is "+ marker.icon);
	
	// get back id from db
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			
			var json = null;
		
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse "+ err);
				console.log(xmlHttp.responseText);
				return;
			}
		
			var credential = json.credential;
			var id = json.id;
			
			//console.log("crendential is "+credential + " id is "+id);
			marker.id = id;
			marker.popupContent = getMarkerPreviewContent(marker);
			
			if (credential==1) {
				placeMarker(marker);
				marker.togglePopup();
			} else {
				alert("You are not logged in");
			}
		}
	}
}

function placeMarker(marker) { 
	
	// add drag listener
	L.DomEvent
	.addListener(marker, 'dragend', function (e) {

		// update marker for z-index
		marker.update();
		// sync with db
		updateMarker(marker);
		
	});
	
	// add drag listener
	L.DomEvent
	.addListener(marker, 'dragstart', function (e) {
		
		console.log("drag start");
		
	});
	
	// add drag listener
	L.DomEvent
	.addListener(marker, 'drag', function (e) {
	
		// update marker for z-index
		marker.update();
		
	});
	
		// add drag listener
	L.DomEvent
	.addListener(marker, 'mouseover', function (e) {
	});
	
		L.DomEvent
	.addListener(marker, 'mouseout', function (e) {
	});
	
	// set popupContent on popup open event
	L.DomEvent
	.addListener(marker, 'popupopen', function (e) {
		if (marker.preview !="") {
			marker.popupContent = getMarkerPreviewContent(marker);
			e.popup.setContent(marker.popupContent);
			marker.getPopup().update();
			marker.alt = "alt title";
			marker.riseOnHover = false;
		} else {
			showMarker(marker);
			e.popup._close();
			
		}
		//ici var popupContent = getMarkerPreviewContent(marker);
		
		
	});
	
	// clear popupContent on popup close
	L.DomEvent
	.addListener(marker, 'popupclose', function (e) {
		
		// reset popup loading message
		marker.popupContent = "<i>loading..</i>";
	});
	
	
	// create & bind popup
	marker.popupContent = "<i>Loading..</i>";
	
  	marker.bindPopup(marker.popupContent);
  	
  	marker.getPopup().closeOnClick=true;
  	marker.getPopup().autoPan = true;
  	
  	marker.addTo(plotgroup);
  	
  	if (sessionStorage.getItem("logged")==1) {
  		marker.locked==false?marker.dragging.enable():marker.dragging.disable();
  	} else {
  		marker.dragging.disable();
  	}
				
}

function getMarkerPreviewContent(marker) {
	var popupContent=document.createElement("section");
	
	var popupTitle = document.createElement("div");
	popupTitle.innerHTML =  marker.title;
	popupTitle.className = "plotmap-popup-title";
	
	var popupPreview = document.createElement("div");
	popupPreview.innerHTML = marker.preview;
	popupPreview.className = "plotmap-popup-preview";

	var popupControl = document.createElement("div");
	
	var popupShow = document.createElement("a");
	popupShow.href = '#';
	popupShow.innerHTML = 'Show';
	popupShow.className = "plotmap-popup-control";
	
	// show roolover
	popupShow.onclick = function () {
        showMarker(marker);
        return false;
    }
    popupControl.appendChild(popupShow);
   
   
	if (sessionStorage.getItem("logged")==1) {
		var popupEdit = document.createElement("a");
		popupEdit.href = '#';
		popupEdit.innerHTML = 'Edit';
		popupEdit.className = "plotmap-popup-control";

		popupEdit.onclick = function () {
			editMarker(marker);
			return false;
		}
		
		 popupControl.appendChild(popupEdit);
	}
      
    
     if (sessionStorage.getItem("logged")==1)  {
     	var popupRemove;
     	
     	if (marker.locked==true) {
     		popupRemove = document.createElement("span");
     	} else {
     		popupRemove = document.createElement("a");
     		popupRemove.href = '#';
     		
     		popupRemove.onclick = function () {
				remove(marker);
				return false;	
			}
     	}
		
		popupRemove.innerHTML = 'Delete';
		popupRemove.className = "plotmap-popup-control";
		
		if (marker.locked==false) popupRemove.enable = false;
		
		
		popupControl.appendChild(popupRemove);
    }
     
    popupContent.appendChild(popupTitle);
    popupContent.appendChild(popupPreview);
    popupContent.appendChild(popupControl);
    
  	return popupContent;
}

function updateMarker(marker) {
	// send JSON
		
	var JSONMarker = {
		id:marker.id,
		map:marker.map,
		title:marker.title,
		preview:marker.preview,
		type:marker.type,
		content:marker.content,
		lat:marker.getLatLng().lat,
		lng:marker.getLatLng().lng,
		attributes:marker.attributes,
		locked:marker.locked,
		icon:marker.icon,
		login:sessionStorage.getItem("login"),
		password:sessionStorage.getItem("password")
	}
	var JSONString = JSON.stringify(JSONMarker);
	
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?update=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);

	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			//console.log("marker updated" + marker.title );
			console.log("marker updated" + xmlHttp.responseText)
			initAttributesList();
		}
	}
}

function showMarker(marker) {
	
	disableInteraction();
	var contentControl = document.createElement("span");
	contentControl.setAttribute("class", "plotmap-content-control");
	contentControl.setAttribute("id", "plotmap-content-control");
	
	// var contentClose = document.createElement("a");
// 	contentClose.href = '#';
// 	contentClose.innerHTML = 'Close';
// 	contentClose.setAttribute("class", "plotmap-content-control-element");
// 
// 	contentControl.appendChild(contentClose);
// 	
	document.getElementById('plotmap-content-wrapper').onclick = function () { // close function
	
		var elements = document.getElementsByClassName('pm-display-show');
		
		[].forEach.call(elements, function( element ) {
  			element.style.display = "none";
    		element.style.opacity="0";
		});

		
		document.getElementById('plotmap-content-wrapper').removeChild(document.getElementById('plotmap-content-control'));
		
		enableInteraction();

        return false;
    }
    
	// contentClose.onclick = function () { // close function
// 	
// 		var elements = document.getElementsByClassName('pm-display-show');
// 		
// 		[].forEach.call(elements, function( element ) {
//   			element.style.display = "none";
//     		element.style.opacity="0";
// 		});
// 
// 		
// 		document.getElementById('plotmap-content-wrapper').removeChild(document.getElementById('plotmap-content-control'));
// 		
// 		enableInteraction();
// 
//         return false;
//     }
    
	if (sessionStorage.getItem("logged")==1) {
		var markerEdit = document.createElement("a");
		markerEdit.href = '#';
		markerEdit.innerHTML = 'Edit';

		markerEdit.onclick = function () {
			editMarker(marker);
			return false;
		}
		markerEdit.setAttribute("class", "plotmap-content-control-element");

		 contentControl.appendChild(markerEdit);
	}
      
    
     if (sessionStorage.getItem("logged")==1)  {
     	var markerDelete;
     	
     	if (marker.locked==true) {
     		markerDelete = document.createElement("span");
     	} else {
     		markerDelete = document.createElement("a");
     		markerDelete.href = '#';
     		
     		markerDelete.onclick = function () {
     		
				var elements = document.getElementsByClassName('pm-display-show');
		
				[].forEach.call(elements, function( element ) {
					element.style.display = "none";
					element.style.opacity="0";
				});

		
				// remove all children from plotmap-content
				while (document.getElementById('plotmap-content').firstChild) {
					document.getElementById('plotmap-content').removeChild(document.getElementById('plotmap-content').firstChild);
				}
		
				document.getElementById('plotmap-content-wrapper').removeChild(document.getElementById('plotmap-content-control'));
		
				enableInteraction();
		
				remove(marker);
				return false;	
			}
     	}
		markerDelete.setAttribute("class", "plotmap-content-control-element");

		markerDelete.innerHTML = 'Delete';
		
		if (marker.locked==false) markerDelete.enable = false;
		
		
		contentControl.appendChild(markerDelete);
    }
    
	
    document.getElementById('plotmap-content').innerHTML = marker.content;
    
    document.getElementById('plotmap-content-wrapper').appendChild(contentControl);
    
    var elements = document.getElementsByClassName('pm-display-show');
		
		[].forEach.call(elements, function( element ) {
  			element.style.display = "block";
    		element.style.opacity="1";
		});

}

function editMarker(marker) {
	// set values
	document.getElementById('plotmap-marker-input-lat').value = marker.getLatLng().lat;
	document.getElementById('plotmap-marker-input-lng').value = marker.getLatLng().lng;

	document.getElementById('plotmap-marker-input-title').value = marker.title;
	document.getElementById('plotmap-marker-input-preview').value = marker.preview;
	document.getElementById('plotmap-marker-input-type').value = marker.type;

	document.getElementById('plotmap-marker-input-content').value = marker.content;
	document.getElementById('plotmap-marker-input-attributes').value = marker.attributes;
	
	document.getElementById('plotmap-marker-input-locked').checked = marker.locked;
	
	// show edit form
	 var elements = document.getElementsByClassName('pm-display-edit');
		
		[].forEach.call(elements, function( element ) {
  			element.style.display = "block";
    		element.style.opacity="1";
		});


	disableInteraction();
	
	// on validate form
	document.getElementById('plotmap-marker-edit-form').onsubmit = function() {
		marker.title = document.getElementById('plotmap-marker-input-title').value;
		marker.preview = document.getElementById('plotmap-marker-input-preview').value;
		marker.type = document.getElementById('plotmap-marker-input-type').value;
		marker.setLatLng([document.getElementById('plotmap-marker-input-lat').value,document.getElementById('plotmap-marker-input-lng').value]);
		marker.content = document.getElementById('plotmap-marker-input-content').value;
		marker.attributes = document.getElementById('plotmap-marker-input-attributes').value;
		marker.locked = document.getElementById('plotmap-marker-input-locked').checked;
		
		marker.bindLabel(marker.title, {direction: 'auto'});
				
		var elements = document.getElementsByClassName('pm-display-edit');
		
		[].forEach.call(elements, function( element ) {
  			element.style.display="none";
    		element.style.opacity="0";
		});

		marker.closePopup();
		
		// sync with db
		updateMarker(marker);
			
		var popupContent = getMarkerPreviewContent(marker);
  		marker.popupContent = popupContent;
  		marker.openPopup(); 
  		
  		marker.locked==false?marker.dragging.enable():marker.dragging.disable();
 		
 		enableInteraction();
		return false;
	}
	
	document.getElementById('plotmap-marker-edit-form').onreset = function() {
	
	 var elements = document.getElementsByClassName('pm-display-edit');
		
		[].forEach.call(elements, function( element ) {
  			element.style.display = "none";
    		element.style.opacity="0";
		});

		enableInteraction();	
	}
		
}

function remove(marker) {
	
	if (!confirm("Do You Really Want To Delete This Marker ?")) {
       	return;
	}
	// send JSON
	var JSONMarker = {
		id:marker.id,
		login:sessionStorage.getItem("login"),
		password:sessionStorage.getItem("password")
	}
	var JSONString = JSON.stringify(JSONMarker);
	
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?remove=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);

	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			//console.log("marker removed");
			marker.getPopup()._isOpen = true;
			marker.closePopup();
			
			map.removeLayer(marker);
			initAttributesList();
		}
	}

}

function showCoordinates (e) {
    alert(e.latlng);
}

function centerMap (e) {
    map.panTo(e.latlng);
}

function zoomIn (e) {
    map.zoomIn();
}

function zoomOut (e) {
    map.zoomOut();
}

function plotmapLogout() {
	
	// send JSON
	
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?logout=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send();
	
	// disable markers dragging
	plotgroup.eachLayer(function (marker) {
		
		marker.dragging.disable();
	});
	sessionStorage.setItem("logged",0);
	plotMapPingLogin.lastCredential = 0;
				
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			
			//console.log(xmlHttp.responseText);
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse "+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			var credential = json.credential;
			
			 var elements = document.getElementsByClassName('pm-display-credential');
		
			[].forEach.call(elements, function( element ) {
  				element.style.display = credential==1?"inline":"none";
    			element.style.opacity= credential==1?"1":"0";
			});
		
			//document.getElementById("plotmap-settings").style.display = credential==1?"inline":"none";
			sessionStorage.setItem("logged",credential);

		}
	}
	
	return false;
}

function plotmapLogin() {

	var JSONMarker = {
		login:document.getElementById("plotmap-input-login").value,
		password:document.getElementById("plotmap-input-password").value
	}

	var JSONString = JSON.stringify(JSONMarker);
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?login=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send(JSONString);

	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
	
			var json = null;
			
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse "+ err);
				console.log(xmlHttp.responseText);
				return;
			}
			
			var credential = json.credential;
			var elements = document.getElementsByClassName('pm-display-credential');
		
			[].forEach.call(elements, function( element ) {
  				element.style.display = credential==1?"inline":"none";
    			element.style.opacity= credential==1?"1":"0";
			});
		
			sessionStorage.setItem("logged",credential);
			
			if (!credential) {
				alert("Wrong login or password!");
			} else {
			
				//----
				
				plotgroup.eachLayer(function (marker) {
					marker.locked==false?marker.dragging.enable():marker.dragging.disable();
				});
		
				//----
			}
		}
	}
	
	document.getElementById("plotmap-input-login").value = "";
	document.getElementById("plotmap-input-password").value = "";
	return false;
}

function loadGeoJSON() {

	var xmlHttp = null;
	xmlHttp = getHTTPObject();
	xmlHttp.open("GET","plotmap.php?geojson=true",true);
    xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
	xmlHttp.setRequestHeader("Cache-Control", "no-cache");
    xmlHttp.send(null);
	
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			//console.log("geojson loaded");
			//console.log(xmlHttp.responseText);
			geojson = JSON.parse(xmlHttp.responseText);
			
			geojsonLayer.addData(geojson);
			
		}
	}
}

function enableInteraction() {
	map.dragging.enable();
	map.touchZoom.enable();
	map.doubleClickZoom.enable();
	map.scrollWheelZoom.enable();
	map.boxZoom.enable();
	map.keyboard.enable();
}

function disableInteraction() {
	map.dragging.disable();
	map.touchZoom.disable();
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.disable();
	map.boxZoom.disable();
	map.keyboard.disable();
}

function ArrayIntersect(a, b) {
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}


// file uploader events
function plotMapFileUploadSelectHandler(e) {
	//console.log("dropped");
	e.preventDefault();

 	// fetch FileList object
 	var files = e.target.files || e.dataTransfer.files;
 	// get drop location 	
 	
 	var latLng = map.mouseEventToLatLng(e);
 	
 	plotMapUploadFiles(files, latLng);
	/*		
 	// process all File objects
 	 for (var i = 0; i < files.length; ++i) {
 	 	var id = "_"+i;
  		plotMapUploadFile(files[i],latLng,id);
	}
 	*/
	
}

function plotMapAllowDrop(e) {
    e.preventDefault();
}

function plotMapUploadFiles(files, latLng) {
	
	var formData = new FormData();
	//formData.append('name','<?php echo ini_get("session.upload_progress.name"); ?>');
	for(var i = 0; i < files.length; ++i){
		formData.append('plotmap_uploaded_files[]',files[i], files[i].name);
		console.log("uploading "+files[i].name);
	}
	
	var xmlHttp = new XMLHttpRequest();
	
	var progressWrapper = $id("plotmap-upload-progress-wrapper");
	var progress = progressWrapper.appendChild(document.createElement("div"));
		
	xmlHttp.upload.onprogress = function(event) {
		var pc = parseInt((event.loaded / event.total * 100));
		progress.style.width = pc + "%";
		progress.innerHTML = "uploading "+ files.length+" files: " + pc + "%";
	}
	progress.className = "plotmap-uploader-progress";
	
	xmlHttp.upload.onloadend = function(event) {
		console.log("upload is done");
		progressWrapper.removeChild(progress);
	}
	
	xmlHttp.upload.onerror = function(event) {
		console.log("upload error");
		progressWrapper.removeChild(progress);
	}
	
	// response handeling
	xmlHttp.onreadystatechange = function(event) {
		
		if (xmlHttp.readyState == 4) {
			//progress.className = (xmlHttp.status == 200 ? "success" : "failure");
			//progress.className = (xmlHttp.status == 200 ? "success" : "failure");
			
			if (xmlHttp.status == 200) {
				//console.log("response type is  "+xmlHttp.responseType);
				//console.log("response content is  "+xmlHttp.responseText);
				uploadedFiles = JSON.parse(xmlHttp.responseText);
				console.log(uploadedFiles);
				// create a new marker at drop location
				var marker = L.marker(latLng);
			
				var date = new Date();
				//var options = {timeZone: "UTC", timeZoneName: "short"};
				
				marker.id = '';
				marker.map = 'plot';
				marker.title = date.toString();
				marker.type = 'html';
				marker.preview = '';
				marker.content = '';
				marker.locked = 0;
				marker.icon = "default";
				
				for(var i = 0; i < uploadedFiles.length; ++i){
					//afile = {"name":uploadedFiles.name[i], "error":x, "type":uploadedFiles.type[i]};
					if (uploadedFiles[i].error == 0) {
						marker.content += fileToEmbedCode(uploadedFiles[i]);
					} else {
						console.log("error uploading :"+uploadedFiles[i].name);
					}
				}
			
				marker.attributes = "";
				marker.locked = 0;
			
				createMarker(marker);
			}
		}
	};
		

    // start upload
	xmlHttp.open("POST", $id("plotmap-file-uploader-form").action, true);
	xmlHttp.setRequestHeader('Cache-Control','no-cache');
    
	//xmlHttp.setRequestHeader("X-FILENAME", encodeURI(files[0].name));
	//xmlHttp.setRequestHeader('X-File-Size', files[0].size);
	//xmlHttp.setRequestHeader('X-FILETYPE', files[0].type)
	//xmlHttp.setRequestHeader("X-FILEPATH", encodeURI(path));
	
	xmlHttp.send(formData);
	
}

function plotMapUploadFile(file, latLng, id) {
	//console.log("upload "+file.name+" at "+latLng);
	
	xmlHttp = getHTTPObject();
	if (xmlHttp.upload) {
		var o = $id("plotmap-file-uploader-progress");
		var progress = o.appendChild(document.createElement("p"));
		progress.innerHTML = "uploading " + file.name;//appendChild(document.createTextNode("uploading " + file.name));
		xmlHttp.upload.addEventListener("progress", function(e) {
			var pc = parseInt((e.loaded / e.total * 100));
			//progress.style.backgroundPosition = pc + "% 0";
			progress.innerHTML = "uploading " + file.name + " : " + pc + "%";
		}, false);
		progress.className = "uploading";
		
		// file received/failed
		xmlHttp.onreadystatechange = function(e) {
			if (xmlHttp.readyState == 4) {
				progress.className = (xmlHttp.status == 200 ? "success" : "failure");
				console.log(xmlHttp.status == 200 ? "success" : "failure");
				//console.log(xmlHttp.responseText);
				if (xmlHttp.status == 200) {
					console.log("uploaded "+file.name);
					arr = xmlHttp.responseText;
					console.log(file.type);
					// create a new marker at drop location
					var marker = L.marker(latLng);
				
					//var date = new Date();
					//var options = {timeZone: "UTC", timeZoneName: "short"};
					marker.id = '';
					marker.map = 'plot';
					marker.title = file.name;
					marker.type = 'html';
					marker.preview = '';
					marker.content = fileToEmbedCode(file);
					marker.attributes = "";
					marker.locked = 0;
				
					placeMarker(marker);
					o.removeChild(progress);
				} else {
					o.removeChild(progress);
					window.alert("Failled to upload "+file.name);
				}
			}
		};

		// start upload
		xmlHttp.open("POST", $id("plotmap-file-uploader-form").action, true);
		xmlHttp.setRequestHeader("X-FILENAME", encodeURI(file.name));
		xmlHttp.setRequestHeader('X-File-Size', file.size);
		xmlHttp.setRequestHeader('Content-Type', file.type)
		//xmlHttp.setRequestHeader("X-FILEPATH", encodeURI(path));
		xmlHttp.send(file);
	}
}

function plotMapAppendTemplate(kind) {
	//console.log("template");
	var textArea = $id("plotmap-marker-input-content");
	switch (kind) {
  		case "image":
   			textArea.value +="\n<img src='files/IMAGE.XXX' class='plotmap-image-resize-fit-center'>\n";
   			break;
   		case "video":
  			textArea.value +="\n<video controls width='100%' height='100%'>\n <source src='files/VIDEO_FILE_NAME'>\n</video>";
			break;
		case "audio":
   			textArea.value +="\n<audio controls width='100%'>\n <source src='files/AUDIO_FILE_NAME'>\n</audio>";
   			break;
  		case "vimeo":
  			textArea.value +="\n<iframe\n class='vimeoiframe'\n  src='http://player.vimeo.com/video/VIDEO_ID?autoplay=1'\n  width='100%' height='100%'\n  frameborder='0'\n  webkitallowfullscreen\n  mozallowfullscreen\n  allowfullscreen>\n</iframe>";
   			break;
	} 
}


function plotMapPingLogin(){
	var xmlHttp = null;

	xmlHttp = getHTTPObject();
	xmlHttp.open("POST",'plotmap.php?timeout=true', true);
	xmlHttp.setRequestHeader("Content-type", "application/json"); // json header
	xmlHttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"); // IE Cache Hack
	xmlHttp.setRequestHeader("Cache-Control", "no-cache"); // idem
	xmlHttp.send();
	
	// get back id from db
	xmlHttp.onreadystatechange=function() {
		if(xmlHttp.readyState == 4){
			
			if ( typeof plotMapPingLogin.lastCredential == 'undefined' ) {
        		// It has not... perform the initialization
				plotMapPingLogin.lastCredential = 0;
    		}
    
			var json = null;
		
			try {
				json = JSON.parse(xmlHttp.responseText);
			} catch (err) {
				console.log("error json parse "+ err);
				console.log(xmlHttp.responseText);
				return;
			}
		
			var credential = json.credential;
			
			sessionStorage.setItem("logged",credential);

			//document.getElementById("plotmap-settings").style.display = credential==1?"inline":"none";
			
			var elements = document.getElementsByClassName('pm-display-credential');
		
			[].forEach.call(elements, function( element ) {
  				element.style.display = credential==1?"inline":"none";
    			element.style.opacity= credential==1?"1":"0";
			});
			
			if (credential == 0 && plotMapPingLogin.lastCredential==1) {
				// disable markers dragging
				plotgroup.eachLayer(function (marker) {
		
					marker.dragging.disable();
				});
				alert("Session timed out");
			}
			plotMapPingLogin.lastCredential = credential;
		}
	}
	
	pingTimeOut = setTimeout("plotMapPingLogin()", pingPeriod);
}

// helpers
function $id(id) {
	return document.getElementById(id);
}

function clone(o){
    var n=Object.create(
        Object.getPrototypeOf(o),
        Object.getOwnPropertyNames(o).reduce(
            function(prev,cur){
                prev[cur]=Object.getOwnPropertyDescriptor(o,cur);
                return prev;
            },
            {}
        )
    );
    if(!Object.isExtensible(o)){Object.preventExtensions(n);}
    if(Object.isSealed(o)){Object.seal(n);}
    if(Object.isFrozen(o)){Object.freeze(n);}

    return n;
}

function fileToEmbedCode(file) {
	type = unescape(file.type);
	//console.log("the type is "+type+"...");
 	if (type.search("(image/*)") != -1) {
    	//console.log("file is an image");
    	return "<img src='files/"+encodeURI(file.name)+"' class='plotmap-image-resize-fit-center'>\n";
	} else if (type.search("(video/*)") != -1) {
    	return "<video controls width='100%' height='100%'>\n <source src='files/"+encodeURI(file.name)+"' type='"+type+"'>\n</video>\n";
	} else if (type.search("(audio/*)") != -1) {
    	return "<audio controls>\n <source src='files/"+encodeURI(file.name)+"' type='"+type+"'>\n</audio>\n";
	} else {
		return "<a class='plot-file-link' href='files/"+encodeURI(file.name)+"'>"+file.name+"</a>";
		//return "<object data='files/"+file.name+"' type='"+file.type+"' width='100%' height='100%'></object>\n";
	}
}

// GET HTTP
function getHTTPObject() {
	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
    }

    try {
		return new ActiveXObject("MSXML2.XMLHTTP.3.0");
	}
	catch (error) {
		console.log("Neither XHR or ActiveX are supported!");
		alert("Neither XHR or ActiveX are supported!", "error");
		return null;
    }
}