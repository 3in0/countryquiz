

_e = (function () {

	var _e = {

		state: {},

		initialise: function () {

			this.getData();

			//let aLonLat = [ 151, -33 ];

			//var aLeftCoord = window.ol.proj.transform( aLonLat, 'EPSG:4326', 'EPSG:3857' );

			this.createMap('map', [0,0], 4);

			//this.mapPackages[ 'map-left' ].map.on("click", this.mapClicked.bind(this));

		},

		getData: function() {

			var xmlhttp = new XMLHttpRequest();
			
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
				   if (xmlhttp.status == 200) {
					   _e.processCapitals( xmlhttp.responseText );
				   }
				   else if (xmlhttp.status == 400) {
					  alert('There was an error 400');
				   }
				   else {
					   alert('something else other than 200 was returned');
				   }
				}
			};
			
			xmlhttp.open("GET", "capitals.csv", true);
			xmlhttp.send();
			

		},

		processCapitals: function( someData ) {

			this.state.capitals_raw = someData;
			this.state.capitals = [];

			for ( let aLine of someData.split( '\n' ) ) {
				this.state.capitals.push( aLine.split( ',' ) );

			}

		},

		mapClicked: function( anEvent ) {

			var aPixel = anEvent.pixel;

			console.log( aPixel );

			var aMapCoord = this.state.map.getCoordinateFromPixel( aPixel );
			this.state.clickCoord = ol.proj.transform( aMapCoord, 'EPSG:3857', 'EPSG:4326' );	



			var somePackages = [];
			
			this.state.map.forEachFeatureAtPixel( aPixel, function( feature ) {
				somePackages.push( feature );
			} );

			console.log( somePackages );

			if ( somePackages.length > 0 ) 
				this.countrySelected( somePackages[ 0 ] );

		},

		countrySelected : function( aFeature ) {

			let aName = aFeature.get( 'name' );

			console.log( aName );

			let aPackage = this.getCountryData( aName );

			console.log( aPackage );

			if ( aPackage ) {

				var aSource = this.state.adhoc.getSource();

				aSource.forEachFeature( function( aFeature ) { aSource.removeFeature( aFeature ); } );

				let aCapitalCoord = [ aPackage[ 3 ] * 1.0, aPackage[ 2 ] * 1.0 ];
				this.state.distance = ( ol.sphere.getDistance(this.state.clickCoord, aCapitalCoord) / 1000.0 ).toFixed( 0 ) + "km";

				var aFeatureJsonLine = {
					"type": "Feature",
					"id": "2",
					"properties": {
						"type": "line"
					},
					"geometry": {
						"type": "LineString",
						"coordinates": [ this.state.clickCoord, aCapitalCoord ]
					}
				};

				var aFeatureJson = {
					"type": "Feature",
					"id": "1",
					"properties": { "type": "capital", "name" : aPackage[ 1 ] },
					"geometry": {
						"type": "Point",
						"coordinates": aCapitalCoord
					}
				};
		
				var aFormat = new ol.format.GeoJSON();
		
				var someOptions = { 
							dataProjection:'EPSG:4326',
							featureProjection:'EPSG:3857'
				};
		
				var aFeatureLine = aFormat.readFeature( aFeatureJsonLine, someOptions );
		
				var aFeature = aFormat.readFeature( aFeatureJson, someOptions );
		
		
				aSource.addFeature( aFeatureLine );

				aSource.addFeature( aFeature );

				aSource.dispatchEvent( 'change' );
		

			}
		},

		featureSelection : function( someFeatures ) {

			console.log( someFeatures );

		},

		currentLongLat: function() {

			let aCoord = this.mapPackages[ 'map-left' ].map.getView().getCenter();

			return window.ol.proj.transform( aCoord, 'EPSG:3857', 'EPSG:4326' );

		},

		adHocStyleFunction: function( aFeature ) {

			if ( aFeature.get( 'type' ) == 'capital' ) {

				return new ol.style.Style( {
					image: new ol.style.Circle({
						radius: 7,
						fill: new ol.style.Fill({
						color: '#ffcc33'
						})
					}),

					text: new ol.style.Text( {

						textAlign: 'center',
						textBaseline: 'hanging',
						font: 'normal 12px Verdana',
						text: aFeature.get( 'name' ),
						fill: new ol.style.Fill( {
							color: '#ffcc33'
						}),
						stroke: new ol.style.Stroke( {
							color: "black",
							width: 5
						}),
						offsetX: 0,
						offsetY: 25,
						rotatation: 0

					})

				} );

			}
			else if ( aFeature.get( 'type' ) == 'line' ) {

				return new ol.style.Style( {
					stroke: new ol.style.Stroke({
						color: '#ffcc33',
						width: 2
					  }),

					text: new ol.style.Text( {

						textAlign: 'center',
						font: 'normal 8px Verdana',
						text: "" + this.state.distance,
						fill: new ol.style.Fill( {
							color: '#ffcc33'
						}),
						stroke: new ol.style.Stroke( {
							color: "black",
							width: 5
						}),
						offsetX: 0,
						offsetY: -25,
						rotatation: 0

					})

				} )
			}

		},

		getCountryData : function( aName ) {

			for ( let aPackage of this.state.capitals ) {

				if ( aPackage[ 0 ] == aName )
					return aPackage;

			}

		},

		createMap: function (aName, aCenter, aZoom, aVector) {

			aStamenLayer = new ol.layer.Tile({
				source: new ol.source.Stamen({
					layer: 'toner'
					//layer: 'terrain'
				})
			});

			aStamenLayer.set('name', 'stamen');

			var someLayers = [];

			//someLayers.push(aStamenLayer);
			
			var vectorLayer = new ol.layer.Vector({
				source: new ol.source.Vector({
				  url:
					'countries.json',
				  format: new ol.format.GeoJSON(),
				})
				
			  });

			someLayers.push( vectorLayer );

			this.state.countries = vectorLayer;

			var aAdHocLayer = new ol.layer.Vector({
				source: new ol.source.Vector({
					crossOrigin: 'anonymous',
				  projection: 'EPSG:4326',
				}),
				style: this.adHocStyleFunction.bind( this )
			  });
  
  
		  	aAdHocLayer.set( 'name', 'adhoc' );
  
		  	aAdHocLayer.setVisible( true );

			someLayers.push( aAdHocLayer );
			  
			this.state.adhoc = aAdHocLayer;

			// Map..

			var aMap = new ol.Map({

				controls: [],
				layers: someLayers,

				target: aName,

				view: new ol.View({

					center: aCenter,

					zoom: aZoom,
					minZoom: 1,
					maxZoom: 22

				}),

				moveTolerance: 10

			});

			aMap.on( 'click', this.mapClicked.bind( this ) );

			this.state.map = aMap;

		},

		launchHook: function () {

			this.launchHookCallback( {} );

		},

		launchHookCallback: function (someData) {

			this.initialise();

		}

	}

	return _e;

}());

document.addEventListener("DOMContentLoaded", function(event) { 

	this.launchHook();

}.bind( _e ) );


