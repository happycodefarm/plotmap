L.Control.geolocation = L.Control.extend({
    options: {
        position: 'topleft',
        title: {
            'false': 'Start Geolocation',
            'true': 'Stop Geolocation'
        }
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-control-geolocation leaflet-bar leaflet-control');

        this.link = L.DomUtil.create('a', 'leaflet-control-geolocation-button leaflet-bar-part', container);
        this.link.href = '#';

        this._map = map;
        this._map.on('geolocationchange', this._toggleTitle, this);
        this._toggleTitle();

        L.DomEvent.on(this.link, 'click', this._click, this);

        return container;
    },

    _click: function (e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        this._map.toggleGeolocation();
    },

    _toggleTitle: function() {
        this.link.title = this.options.title[this._map.isLocating()];
    }
});

L.Map.include({
    isLocating: function () {
        return this._isLocating || false;
    },

    toggleGeolocation: function () {
        var container = this.getContainer();
        if (this.isLocating()) {
           
			console.log("locate on");
					
			map.locate({
				watch:true,
				setView:false,
				maximumAge:30000
			});
		
			map.locating = true;
				
            this.fire('fullscreenchange');
            
        } else {
            console.log("locate off");
			L.DomUtil.removeClass(this.parentElement, 'plotmap-control-on');
			controlUI.title = 'Enable Geolocation';
					
			map.stopLocate();
			map.userLoc = map.getCenter();
			map.locating = false;
            this.fire('fullscreenchange');
            
        }
    },

    _setLocating: function(locating) {
        this._isLocating = locating;
        var container = this.getContainer();
        if (locating) {
            L.DomUtil.addClass(container, 'leaflet-geolocation-on');
        } else {
            L.DomUtil.removeClass(container, 'leaflet-geolocation-on');
        }
    },

    _onLocatingChange: function (e) {
        
        if (!this._isLocating) {
            this._setLocating(true);
            this.fire('locatingchange');
        } else if (this._isFullscreen) {
            this._setLocating(false);
            this.fire('locatingchange');
        }
    }
});

L.Map.mergeOptions({
    geolocationControl: false
});

L.control.geolocation = function (options) {
    return new L.Control.Geolocation(options);
};



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
					console.log("locate off");
					//var container = this.getContainer();
					L.DomUtil.removeClass(this.parentElement, 'plotmap-control-on');
					controlUI.title = 'Enable Geolocation';
					
					map.stopLocate();
					map.userLoc = map.getCenter();
					map.locating = false;
				} else {
					console.log("locate on");
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