var RestoreMap = {
    restoreMap: function () {
        var storage = window.localStorage || {};
        if (!this.__initRestore) {
            this.on('moveend', function (e) {
                if (!this._loaded)
                    return;  // Never access map bounds if view is not set.

                var view = {
                    lat: this.getCenter().lat,
                    lng: this.getCenter().lng,
                    zoom: this.getZoom()
                };
                storage['mapMap'] = JSON.stringify(view);
            }, this);
            this.__initRestore = true;
        }

        var view = storage['mapMap'];
        try {
            view = JSON.parse(view || '');
            this.setView(L.latLng(view.lat, view.lng), view.zoom, true);
            return true;
        }
        catch (err) {
            return false;
        }
    }
};

L.Map.include(RestoreMap);
