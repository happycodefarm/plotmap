L.Control.Attributes = L.Control.extend({

	options: {

		collapsed: false,

		position: 'bottomright'

	},



	initialize: function (attributes, options) {

		L.setOptions(this, options);
	
		this._attributes = [];
		for (attribute in attributes) {
			this._attributes.push( {
				"name": attributes[attribute],
				"state":true
			});
		}

		this._handlingClick = false;

		/*
		console.log("attributes -----------------------");
		console.log(this._attributes);
		console.log("end -----------------------");
		*/

	},



	onAdd: function (map) {
		this._initLayout();

		this._update();

// 		map
// 
// 		    .on('attributeadd', this._onAttributeChange, this)
// 
// 		    .on('attributeremove', this._onAttributeChange, this);

		return this._container;

	},


// 
// 	onRemove: function (map) {
// 		map
// 
// 		    .off('attributeadd', this._onAttributeChange, this)
// 
// 		    .off('attributeremove', this._onAttributeChange, this);
// 	},



	addAttribute: function (attribute) {
		this._attributes.push(
		
			attribute
		
		);

		this._addItem(attribute);

		return this;
	},



	removeAttribute: function (attribute) {

		var index = this._attributes.indexOf(attribute);
		this._attributes.splice(index, 1);

		this._update();

		return this;

	},
	
	getActiveAttributes: function() {
		
		var i, input,

		    inputs = this._form.getElementsByTagName('input'),

		    inputsLen = inputs.length,
		    
		    attributesArray = [];


		for (i = 0; i < inputsLen; i++) {

			input = inputs[i];
			
			var index = this._attributes.indexOf(input.attributeId);
			
			if (input.checked) {	
				attributesArray.push(this._attributes[index].name);
			}	
		}
		
		return attributesArray;
		
	},



	_initLayout: function () {

		var className = 'leaflet-control-attributes',

		    container = this._container = L.DomUtil.create('div', className);



		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released

		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {

			L.DomEvent

				.disableClickPropagation(container)

				.disableScrollPropagation(container);

		} else {

			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);

		}



		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {

			if (!L.Browser.android) {

				L.DomEvent

				    .on(container, 'mouseover', this._expand, this)

				    .on(container, 'mouseout', this._collapse, this);

			}

			var link = this._attributesLink = L.DomUtil.create('a', className + '-toggle', container);

			link.href = '#';

			link.title = 'Attributes';


			if (L.Browser.touch) {

				L.DomEvent

				    .on(link, 'click', L.DomEvent.stop)

				    .on(link, 'click', this._expand, this);

			}

			else {

				L.DomEvent.on(link, 'focus', this._expand, this);

			}

			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033

			L.DomEvent.on(form, 'click', function () {

				setTimeout(L.bind(this._onInputClick, this), 0);

			}, this);



			this._map.on('click', this._collapse, this);

			// TODO keyboard accessibility

		} else {

			this._expand();

		}

		this._attributesList = L.DomUtil.create('div', className + '-attributes', form);

		container.appendChild(form);

	},


	_update: function () {

		if (!this._container) {

			return;

		}


		this._attributesList.innerHTML = '';


		var attributesPresent = false,

		    i, obj;



		for (i in this._attributes) {
			
			//console.log(i);
			att = this._attributes[i];

			this._addItem(att);

			attributesPresent = attributesPresent || att.attribute;

		}
	},



	//  _onAttributeChange: function (e) {
// 		
// 		console.log("att changed");
// 		var obj = this._attributes[L.stamp(e.attribute)];
// 
// 
// 
// 		if (!obj) { return; }
// 
// 
// 
// 		if (!this._handlingClick) {
// 
// 			this._update();
// 
// 		}
// 
// 
// 
// 		var type = obj.attribute ?
// 
// 			(e.type === 'attributeadd' ? 'attributeadd' : 'attributeremove') :
// 
// 			(e.type === 'attributeadd' ? 'attributechange' : null);
// 
// 
// 
// 		if (type) {
// 
// 			this._map.fire(type, obj);
// 
// 		}
// 
// 	},


	_addItem: function (attribute) {

		var label = document.createElement('label'),

		input,

		checked = true;


		input = document.createElement('input');

		input.type = 'checkbox';

		input.className = 'leaflet-control-attributes-selector';

		input.defaultChecked = checked;

		

		input.attributeId = attribute; // check ?



		L.DomEvent.on(input, 'click', this._onInputClick, this);


		var name = document.createElement('span');

		name.innerHTML = ' ' + attribute.name;



		label.appendChild(input);

		label.appendChild(name);



		var container = this._attributesList;

		container.appendChild(label);

		return label;

	},



	_onInputClick: function () {

		var i, input,

		    inputs = this._form.getElementsByTagName('input'),

		    inputsLen = inputs.length;



		this._handlingClick = true;



		for (i = 0; i < inputsLen; i++) {

			input = inputs[i];
			
			var index = this._attributes.indexOf(input.attributeId);
			

			if (input.checked&&!(this._attributes[index].state==true)) {
				var o =  {"name":this._attributes[index].name};
				console.log(this._attributes[index].name + " checked");
				this._attributes[index].state = true;
				// map
				var oo = {"attributes": this.getActiveAttributes()};
 				this._map.fire('attributechange', oo);
				//this._map.fire('attributecheck', o);


			} else if (!input.checked&&(this._attributes[index].state)) {

				var o = {"name":this._attributes[index].name};
				console.log(this._attributes[index].name + " unchecked");
				this._attributes[index].state = false;
				// map
 				var oo = {"attributes": this.getActiveAttributes()};
 				this._map.fire('attributechange', oo);
				//this._map.fire('attributeuncheck', o);

			}

		}

		this._handlingClick = false;
		this._refocusOnMap();

	},



	_expand: function () {

		L.DomUtil.addClass(this._container, 'leaflet-control-attributes-expanded');

	},



	_collapse: function () {

		this._container.className = this._container.className.replace('leaflet-control-attributes-expanded', 'leaflet-control-attributes-toggle');

	}

});



L.control.attributes = function (attributes, options) {

	return new L.Control.Attributes(attributes, options);

};