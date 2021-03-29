

_e = (function () {

	var _e = {

		state: {},

		initialise: function () {

			console.log( "v2" );

			this.getData();

			//let aLonLat = [ 151, -33 ];

			//var aLeftCoord = window.ol.proj.transform( aLonLat, 'EPSG:4326', 'EPSG:3857' );

			this.createMap('map', [0,0], 3);

			//this.mapPackages[ 'map-left' ].map.on("click", this.mapClicked.bind(this));

			this.showBest();

			setTimeout( this.nextRound.bind( this ), 2000 );

		},

		nextRound: function() {

			document.getElementById( "highscore" ).style.display = "none";

			if ( !this.state.round )
				this.state.round = 1;
			else
				this.state.round++;

			if ( this.state.round > 5 )
				return this.finished();

			let aPackage = this.selectCountry();

			let aScore = "";

			//if ( this.state.total != undefined )
			//	aScore = " (CURRENT AVERAGE DISTANCE " + ( this.state.total / ( this.state.round - 1 ) ).toFixed( 0 ) + "KM )";

			document.getElementById( "info" ).innerHTML = "ROUND " + this.state.round + " of 5" + " - " + aPackage.country.toUpperCase() + aScore;

		},

		showBest: function() {

			const aElement = document.getElementById( "highscore" );
			aElement.style.display = "none";

			if ( window.localStorage ) {

				let aScore = localStorage.getItem( "score" );

				if ( aScore ) {

					aElement.innerHTML = "BEST SCORE " + aScore + "KM";
					aElement.style.display = "flex";

				}

			}

		},

		finished: function() {
			
			let aScoreVal = ( this.state.total / ( this.state.round - 1 ) ).toFixed( 0 );
			let aScore = "AVERAGE DISTANCE WAS " + aScoreVal + "KM";

			document.getElementById( "info" ).innerHTML = aScore;

			this.saveScore( aScoreVal );

			this.showBest();

		},

		saveScore: function( aScore ) {

			if ( window.localStorage ) {

				localStorage.setItem("score", aScore );

			}

		},

		selectCountry: function() {

			let someCountries = this.state.countries.getSource().getFeatures();

			let anIndex = this.getUnusedIndex( someCountries.length );

			let aCountry = someCountries[ anIndex ];

			let aName = aCountry.get( 'name' );

			var aSource = this.state.adhoc.getSource();

			aSource.forEachFeature( function( aFeature ) { aSource.removeFeature( aFeature ); } );

			aSource.addFeature( aCountry );

			this.state.country = aCountry;

			this.state.map.getView().fit( aCountry.getGeometry().getExtent(), this.state.map.getSize() );

			aSource.dispatchEvent( 'change' );

			return { country: aName };

		},

		
		validate : function() {

			let someCountries = this.state.countries.getSource().getFeatures();

			for ( let aCountry of someCountries ) {

				let aName = aCountry.get( 'name' );

				if ( aName == 'Antarctica' )
					continue;

				let aCapital = this.getCountryData( aName );

				if ( !aCapital )
					console.log( aName );

			}
		},

		getUnusedIndex : function( aMax ) {

			for ( let aCount = 0; aCount < 100; aCount++ ) {

				let anIndex = Math.trunc( Math.random() * aMax );

				if ( !this.state.usedIndex ) {

					this.state.usedIndex = [ anIndex ];
					return anIndex;

				}
				else {

					let aFound = false;

					for ( let aUsed of this.state.usedIndex ) {

						if ( anIndex == aUsed ) {
							aFound = true;
							break;

						}

					}

					if ( !aFound ) {

						this.state.usedIndex.push( anIndex );
						return anIndex;

					}

				}

			}

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

			console.log( this.state.clickCoord[ 0 ] );
			
			this.state.clickCoord[ 0 ] = this.correctLon( this.state.clickCoord[ 0 ] );


			var somePackages = [];
			
			this.state.map.forEachFeatureAtPixel( aPixel, function( feature ) {
				somePackages.push( feature );
			} );

			console.log( somePackages );

			if ( somePackages.length > 0 ) 
				this.countrySelected( somePackages[ 0 ] );

		},
		
		correctLon : function(longitude) {
			var correctedLongitude = parseFloat(longitude);
			var originalLongitude = parseFloat(longitude);
		
			if(originalLongitude > 180 || originalLongitude <= -180) {

				longitude = originalLongitude < 0 ? longitude * -1 : parseFloat(longitude);
		
			  var divisionResult = 0;
			  if((originalLongitude / 180) % 2 === -0)
				divisionResult = longitude / 180;
			  else if((originalLongitude / 180) % 2 === -1)
				divisionResult = (longitude / 180) + 1;
			  else if((longitude / 180) % 1 === 0)
				divisionResult = (longitude / 180) - 1;
			  else if(parseInt(longitude / 180) % 2 === 0)
				divisionResult = parseInt(longitude / 180);
			  else
				divisionResult = Math.ceil(longitude / 180);
		
			  if(divisionResult > 0)
				correctedLongitude = (originalLongitude < 0) ? originalLongitude + (divisionResult * 180) : originalLongitude - (divisionResult * 180);
			}
		
			return correctedLongitude;
		},

		countrySelected : function( aFeature ) {

			let aName = aFeature.get( 'name' );

			console.log( aName );

			let aPackage = this.getCountryData( aName );

			console.log( aPackage );

			if ( aPackage ) {

				var aSource = this.state.adhoc.getSource();

				let aCapitalCoord = [ aPackage[ 3 ] * 1.0, aPackage[ 2 ] * 1.0 ];

				let aDistance = ( ol.sphere.getDistance(this.state.clickCoord, aCapitalCoord) / 1000.0 );
				this.state.distance = aDistance.toFixed( 0 ) + "km";

				if ( !this.state.total )
					this.state.total = 0;

				this.state.total += aDistance;

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

				setTimeout( this.nextRound.bind( this ), 3000 );
		

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
			else {

				console.log( "drawing country" );

				return new ol.style.Style( {
					stroke: new ol.style.Stroke({
						color: '#ffcc33',
						width: 2
					  }) 

					})

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


