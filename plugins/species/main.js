// Pull in your favorite version of jquery 
require({ 
	packages: [{ name: "jquery", location: "http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/", main: "jquery.min" }] 
});
// Bring in dojo and javascript api classes as well as config.json and content.html
define([
	"dojo/_base/declare", "framework/PluginBase", "esri/layers/FeatureLayer", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", 
	"esri/symbols/SimpleMarkerSymbol", "esri/graphic", "dojo/_base/Color", 	"dijit/layout/ContentPane", "dijit/form/HorizontalSlider", "dojo/dom", 
	"dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "dojo/dom-geometry", "dojo/_base/lang", "dojo/on", "dojo/parser", 'plugins/species/js/ConstrainedMoveable',
	"dojo/text!./config.json", "jquery", "dojo/text!./html/legend.html", "dojo/text!./html/content.html", 'plugins/species/js/jquery-ui-1.11.0/jquery-ui'
],
function ( declare, PluginBase, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Color,
	ContentPane, HorizontalSlider, dom, domClass, domStyle, domConstruct, domGeom, lang, on, parser, ConstrainedMoveable, config, $, legendContent, content, ui ) {
		return declare(PluginBase, {
			toolbarName: "Species", showServiceLayersInLegend: false, allowIdentifyWhenActive: false, rendered: false, resizable: false,
			// First function called when the user clicks the pluging icon. Defines the default JSON and plugin size
			initialize: function (frameworkParameters) {
				declare.safeMixin(this, frameworkParameters);
				domClass.add(this.container, "claro");
				this.con = dom.byId('plugins/species-0');
				this.con1 = dom.byId('plugins/species-1');
				if (this.con1 != undefined){
					domStyle.set(this.con1, "width", "245px");
					domStyle.set(this.con1, "height", "165px");
				}else{
					domStyle.set(this.con, "width", "245px");
					domStyle.set(this.con, "height", "165px");
				}	
				this.config = dojo.eval("[" + config + "]")[0];	
				this.items = [];
				this.itemsFiltered = [];
				this.atRow = [];
			},
			// Called after initialize at plugin startup (why all the tests for undefined). Also called after deactivate when user closes app by clicking X. 
			hibernate: function () {
				this.small = "yes";
				if (this.appDiv != undefined){
					$('#' + this.appDiv.id).hide();
					$('#' + this.appDiv.id + 'myTable, #' + this.appDiv.id + 'leftSide, #' + this.appDiv.id + 'rightSide').css('display', 'none');
					$('#' + this.appDiv.id + 'bottomDiv').hide();
					$('#' + this.appDiv.id + 'clickTitle').html("<p>Welcome to the CLIMAD Species app. It does all kinds of cool stuff. It is brought to you by the number 3 and the color blue.<p>" + 
																"<p style='font-weight:bold;margin-left:25px;margin-bottom:-10px;'>Click a Hexagon to Get Started</p>");
				}
				if (this.dynamicLayer != undefined)  {
					this.dynamicLayer.setVisibility(false);
					this.map.graphics.clear();
				}
				if (this.fc != undefined){
					this.fc.clear()
				}
				if (this.map != undefined){
					this.map.graphics.clear();
				}
				if (this.fcDraw != undefined){
					this.map.removeLayer(this.fcDraw);	
				}
				$('.legend').removeClass("hideLegend");
			},
			// Called after hibernate at app startup. Calls the render function which builds the plugins elements and functions.   
			activate: function () {
				// Hide framework default legend
				$('.legend').addClass("hideLegend");
				if (this.rendered == false) {
					this.rendered = true;							
					this.render();
					this.dynamicLayer.setVisibility(true);
				} else {
					if (this.dynamicLayer != undefined)  {
						this.dynamicLayer.setVisibility(true);	
					}
					if (this.fcDraw != undefined){
						this.map.addLayer(this.fcDraw);	
					}
					if (this.small == "yes"){
						this.con = dom.byId('plugins/species-0');
						this.con1 = dom.byId('plugins/species-1');
						if (this.con1 != undefined){
							domStyle.set(this.con1, "width", "245px");
							domStyle.set(this.con1, "height", "165px");
						}else{
							domStyle.set(this.con, "width", "245px");
							domStyle.set(this.con, "height", "165px");
						}
						$('#' + this.appDiv.id).css('height', '20');
						$('#' + this.appDiv.id).show();
					}	
				}
			},
			// Called when user hits the minimize '_' icon on the pluging. Also called before hibernate when users closes app by clicking 'X'.
			deactivate: function () {
				this.small = "no"
			},	
			// Called when user hits 'Save and Share' button. This creates the url that builds the app at a given state using JSON. 
			// Write anything to you config.json file you have tracked during user activity.		
			getState: function () {
				this.config.extent = this.map.geographicExtent;
				this.config.stateSet = "yes";
				// Get OBJECTIDs of filtered items
				if ( this.itemsFiltered.length > 0 ){
					$.each(this.itemsFiltered, lang.hitch(this,function(i,v){
						this.config.filteredIDs.push(v.OBJECTID)
					}));
				}	
				var state = new Object();
				state = this.config;
				return state;
			},
			// Called before activate only when plugin is started from a getState url. 
			//It's overwrites the default JSON definfed in initialize with the saved stae JSON.
			setState: function (state) {
				this.config = state;
			},
			// Resizes the plugin after a manual or programmatic plugin resize so the button pane on the bottom stays on the bottom.
			// Tweak the numbers subtracted in the if and else statements to alter the size if it's not looking good.
			resize: function(w, h) {
				cdg = domGeom.position(this.container);
				if (cdg.h == 0) { this.sph = this.height - 80; }
				else { this.sph = cdg.h - 62; }
				domStyle.set(this.appDiv.domNode, "height", this.sph + "px"); 
			},
			// Called by activate and builds the plugins elements and functions
			render: function() {
				// Info icon src
				this.info = "data:image/png;base64,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";	
				// Define Content Pane		
				this.appDiv = new ContentPane({});
				parser.parse();
				dom.byId(this.container).appendChild(this.appDiv.domNode);					
				// Get html from content.html, prepend appDiv.id to html element id's, and add to appDiv
				var idUpdate = content.replace(/id='/g, "id='" + this.appDiv.id);	
				$('#' + this.appDiv.id).html(idUpdate);
				// Custom legend
				// Get the parent element of the map for placement
				var a = $('#' + $(this.map).attr('id')).parent();
				// Use legend.html to build the elements in the ContentPane - update the ids with this.appDiv
				var legHTML = legendContent.replace(/id='/g, "id='" + this.appDiv.id);
				this.legendWin = new ContentPane({ id: this.appDiv.id + "myLegendDiv", innerHTML: legHTML	});
				// Add legend window to maps parent and add class for symbology
				dom.byId(a[0]).appendChild(this.legendWin.domNode)
				$('#' + this.appDiv.id + 'myLegendDiv').addClass('myLegendDiv');
				$('#' + this.appDiv.id + 'myLegendDiv').hide();
				// Make legend div movable
				var p = new ConstrainedMoveable( dom.byId(this.legendWin.id), {
					handle: dom.byId(this.appDiv.id + "myLegendHeader"), within: true
				});
				// Click handler to close legend
				$('#' + this.appDiv.id + 'myLegendDiv .myLegendCloser' ).on('click',lang.hitch(this,function(){
					$('#' + this.appDiv.id + 'myLegendDiv').hide();
				}));
				// Add dynamic map service
				this.dynamicLayer = new esri.layers.ArcGISDynamicMapServiceLayer(this.config.url);
				this.map.addLayer(this.dynamicLayer);
				if (this.config.visibleLayers != []){	
					this.dynamicLayer.setVisibleLayers(this.config.visibleLayers);   
				}
				this.dynamicLayer.on("load", lang.hitch(this, function () {  
					if (this.config.extent == ""){
						this.map.setExtent(this.dynamicLayer.fullExtent.expand(-1), true);  
					}else{
						var extent = new esri.geometry.Extent(this.config.extent.xmin, this.config.extent.ymin, this.config.extent.xmax, this.config.extent.ymax, new esri.SpatialReference({ wkid:4326 }))
						this.map.setExtent(extent, true);
						this.config.extent = ""; 	
					}
					this.layersArray = this.dynamicLayer.layerInfos;;
				}));				
				this.resize();
				// Create and handle transparency slider
				$('#' + this.appDiv.id + 'slider').slider({ min: 0,	max: 10 });
				$('#' + this.appDiv.id + 'slider').on( "slidechange", lang.hitch(this,function( e, ui ) {
					this.dynamicLayer.setOpacity(1 - ui.value/10);
				}));				
				// Enable jquery plugin 'tablesorter'
				require(["jquery", "plugins/species/js/jquery.tablesorter"],lang.hitch(this,function($) {
					$("#" + this.appDiv.id + "myTable").tablesorter(); 
				}));	
				// Enable jquery plugin 'chosen'
				require(["jquery", "plugins/species/js/chosen.jquery"],lang.hitch(this,function($) {
					var config = { '.chosen-select'           : {allow_single_deselect:true, width:"130px", disable_search:true},
						'.chosen-select-multiple'     : {width:"263px"} }
					for (var selector in config) { $(selector).chosen(config[selector]); }
				}));	
				// Add hex for display/mouse-over
				this.fcDraw = new FeatureLayer(this.config.url + "/0", {
					mode: FeatureLayer.MODE_SNAPSHOT,
					outFields: ["*"]
				});
				this.map.addLayer(this.fcDraw);	
				dojo.connect(this.fcDraw, "onMouseOver", lang.hitch(this,function(e){
					this.map.setMapCursor("pointer");
				}));
				dojo.connect(this.fcDraw, "onMouseOut", lang.hitch(this,function(e){
					this.map.setMapCursor("default");
				}));				
				// Add hex feature class and click events
				this.fc = new FeatureLayer(this.config.url + "/0", {
					mode: FeatureLayer.MODE_SELECTION,
					outFields: ["*"]
				});
				var hlsymbol = new SimpleFillSymbol( SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(
					SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 2 ), new Color([125,125,125,0.15])
				);
				this.fc.setSelectionSymbol(hlsymbol);
				this.fc.on("selection-complete", lang.hitch(this,function(evt){
					var features = evt.features;
					if (features.length > 0){
						this.config.selectedObId = features[0].attributes.OBJECTID_12_13;
						var relatedTopsQuery = new esri.tasks.RelationshipQuery();
						relatedTopsQuery.outFields = ["*"];
						relatedTopsQuery.relationshipId = 0;
						relatedTopsQuery.objectIds = [features[0].attributes.OBJECTID_12_13];
						this.fc.queryRelatedFeatures(relatedTopsQuery, lang.hitch(this,function(relatedRecords) {
							var fset = relatedRecords[features[0].attributes.OBJECTID_12_13];
							this.items = $.map(fset.features, function(feature) {
								return feature.attributes;
							});
							if (this.config.filter[0].value.length > 0 || this.config.filter[1].value.length > 0 || this.config.filter[2].value.length > 0 || this.config.filter[3].value.length > 0 || this.config.filter[4].value.length > 0){
								this.filterItems();
							}else{
								this.updateTable(this.items);
							}
						}));
					}
				}));
				this.map.addLayer(this.fc);				
				// If setState select feature
				if (this.config.selectedObId.length != "") {
					var q = new esri.tasks.Query()
					q.where = 'OBJECTID_12_13 = ' + this.config.selectedObId;
					this.fc.selectFeatures(q,FeatureLayer.SELECTION_NEW);
				}	
				this.map.on("click", lang.hitch(this,function(evt){
					$('#' + this.appDiv.id + 'spDetails').slideUp('slow');
					$('#' + this.appDiv.id + 'rmText').html('Show Range Map On Selection');
					this.spid = -1;
					this.config.visibleLayers = [-1];
					this.dynamicLayer.setVisibleLayers(this.config.visibleLayers); 
					this.config.detailsVis = "none";
					this.fc.clear()
					var selectionQuery = new esri.tasks.Query();
					var tol = 0;
					var x = evt.mapPoint.x;
					var y = evt.mapPoint.y;
					var queryExtent = new esri.geometry.Extent(x-tol,y-tol,x+tol,y+tol,evt.mapPoint.spatialReference);
					selectionQuery.geometry = queryExtent;
					this.fc.selectFeatures(selectionQuery,FeatureLayer.SELECTION_NEW);	
					this.mapSide = evt.currentTarget.id
				}));
				// Print and CSV clicks
				$('#' + this.appDiv.id + 'printReport').on('click',lang.hitch(this,function(e) { 
					alert("Print Report is coming soon. Brace yourself, it's going to be awesome!")
				}));
				$('#' + this.appDiv.id + 'dlCSV').on('click',lang.hitch(this,function(e) { 
					alert("CSV Download is coming soon. Brace yourself, it's going to be awesome!")
				}));
				// Table row click
				$('#' + this.appDiv.id + 'myTable').on('click','tr',lang.hitch(this,function(e) { 
					// Get text from Species cell
					this.config.speciesRow = e.currentTarget.children[0].innerHTML;
					// Find object position in items by row number
					$.each(this.items, lang.hitch(this,function(i,v){
						if ( v.Display_Name == this.config.speciesRow ){
							this.atRow = this.items[i];
							return false;
						}		
					}));
					// Figure out sepecies code and see if it's in the map service
					this.sppcode = this.atRow.sppcode;
					this.speciesName = this.atRow.Display_Name;
					$.each(this.layersArray, lang.hitch(this,function(i,v){
						if (v.name == this.sppcode){
							this.config.visibleLayers = [];
							this.spid = v.id;
							return false;
						}	
					}))
					// If it is and the checkbox is checked, show it 
					if ( $('#' + this.appDiv.id + 'rMapCb').is(":checked") ){
						this.dynamicLayer.setVisibleLayers(this.config.visibleLayers); 
						$('#' + this.appDiv.id + 'rmText').html('Click to Hide Range Map');
						this.buildLegend();
						$('#' + this.appDiv.id + 'myLegendDiv').show();
						$('#' + this.appDiv.id + 'sliderDiv').css('display', 'inline-block');
					}else{
						$('#' + this.appDiv.id + 'rmText').html('Click to Show Range Map');
					}		
					// Update Sepecies Details
					this.updateSpeciesDetails();
				}));
				// Range map check box
				$('#' + this.appDiv.id + 'rMapCb').on('change', lang.hitch(this,function() { 
					if	( $('#' + this.appDiv.id + 'rMapCb').is(':checked') ){
						this.config.visibleLayers.push(this.spid);
						$('#' + this.appDiv.id + 'rmText').html('Click to Hide Range Map');
						this.buildLegend();
						$('#' + this.appDiv.id + 'myLegendDiv').show();
						$('#' + this.appDiv.id + 'sliderDiv').css('display', 'inline-block');
					}else{
						this.config.visibleLayers = [-1];
						$('#' + this.appDiv.id + 'rmText').html('Click to Show Range Map');
						$('#' + this.appDiv.id + 'myLegendDiv').hide();
						$('#' + this.appDiv.id + 'sliderDiv').css('display', 'none');
					}	
					this.dynamicLayer.setVisibleLayers(this.config.visibleLayers); 
				}));		
				// Species Details Key Clicks
				$('#' + this.appDiv.id + 'sdkClose').on('click',lang.hitch(this,function(){
					$('#' + this.appDiv.id + 'spDetailsKey').slideUp();
				}));	
				//Use selections on chosen menus to update this.config.filter object
				require(["jquery", "plugins/species/js/chosen.jquery"],lang.hitch(this,function($) {			
					$('#' + this.appDiv.id + 'rightSide .filter').chosen().change(lang.hitch(this,function(c, p){
						// Hide species details box, update header text, and clear any selected row  
						$('#' + this.appDiv.id + 'spDetails').slideUp();
						$('#' + this.appDiv.id + 'rmText').html('Show Range Map On Selection');
						this.config.detailsVis = "none";
						$('#' + this.appDiv.id + 'spDetailsHeader').html('&#8592; Click Rows for Species Details')
						$('#' + this.appDiv.id + 'myTable tr').each(lang.hitch(this,function (i, row){
							if (row.id != ""){						
								$('#' + row.id).css("background-color", "");
							}
						}))
						// Figure out which menu was selected
						var filterField = c.currentTarget.id.split("-").pop() 
						// multiple select menu handler
						if (filterField == "Associations"){
							// Get index of the object where field equals 'Associations' in this.config.filter object
							$.each(this.config.filter, lang.hitch(this,function(i,v){
								if (filterField == v.field){ 
									this.ind = i; 
								}	
							}));
							// Add selected field to value array in object where field equals 'Associations'
							if (p.selected){
								this.config.filter[this.ind].value.push(p.selected)
							}
							// Remove selected field to value array in object where field equals 'Associations'
							else{
								var index = this.config.filter[this.ind].value.indexOf(p.deselected);
								if (index > -1) {
									this.config.filter[this.ind].value.splice(index, 1);
								}
							}			
						}
						// Single select menu handler
						else{
							// Get object where active menu id matches the field value. If option is seleceted add its value to the value property in current object.
							// If deselected, make value empty text in current object
							$.each(this.config.filter, lang.hitch(this,function(i,v){
								if (filterField == v.field){
									if (p){
										this.config.filter[i].value = p.selected;
									}else{
										this.config.filter[i].value = "";
									}	
								}	
							}))								
						}
						// No items are selected
						if (this.config.filter[0].value.length == 0 && this.config.filter[1].value.length == 0 && this.config.filter[2].value.length == 0 && this.config.filter[3].value.length == 0 && this.config.filter[4].value.length == 0){
							this.updateTable(this.items);
							this.itemsFiltered = [];
						}
						// At least one item is selected
						else{
							this.filterItems()
						}	
					
					}));
				}));
				this.rendered = true;				
			},
			// Called when this.config.filter has values for filtering
			filterItems: function (){
				// Make copy of this.items for filtering
				this.itemsFiltered = this.items.slice();	
				// Loop throuhg filter object and remove non-matches from itemsFiltered
				$.each(this.config.filter, lang.hitch(this,function(i,v){
					this.removeArray = [];
					this.keepArray = [];
					// Find non-matching item positions and add to removeArray
					// For multi-select menu
					if (v.field == "Associations"){
						if (this.config.filter[i].value.length > 0){
							$.each(this.config.filter[i].value, lang.hitch(this,function(i1,v1){
								$.each(this.itemsFiltered, lang.hitch(this,function(i2,v2){
									if (v2[v1] == 1){
										this.keepArray.push(v2.Display_Name)
									}	
								}));
							}))	
							$.each(this.itemsFiltered, lang.hitch(this,function(i,v){	
								this.remove = "yes"
								$.each(this.keepArray, lang.hitch(this,function(i1,v1){
									if (v.Display_Name == v1){
										this.remove = "no"
									}
								}));
								if (this.remove == "yes"){
									this.removeArray.push(i)
								}	
							}));						
						}	
					}
					// For single-select menu
					else{
						if (v.value != ""){
							$.each(this.itemsFiltered, lang.hitch(this,function(i2,v2){
								if (v2[v.field] != v.value){
									this.removeArray.push(i2)
								}	
							}));									
						}
					}	
					// Sort array largest to smallest
					this.removeArray = this.removeArray.sort(function (a, b) { return b - a; });
					// Remove non-matching items from itemsFiltered object	
					$.each(this.removeArray, lang.hitch(this,function(i3,v3){
						this.itemsFiltered.splice(v3, 1)
					}));	
				}));
				
				this.updateTable(this.itemsFiltered);
			},	
			// Build tabele rows based on map click or itemsFiltered objects
			updateTable: function (items){
				// Show/hide message that no results were found 
				if (items.length == 0){
					$('#' + this.appDiv.id + 'selectNone').slideDown('fast');
				}else{
					$('#' + this.appDiv.id + 'selectNone').slideUp('fast');
				}
				// Clear table rows
				$('#' + this.appDiv.id + 'myTable tbody tr').remove()
				// Sort items by Display_Name
				function compare(a,b) {
					if (a.Display_Name < b.Display_Name){
						return -1;
					}
					if (a.Display_Name > b.Display_Name){
						return 1;
					}	
					return 0;
				}
				items = items.sort(compare);
				// Add rows
				$.each(items, lang.hitch(this,function(i,v){
					var newRow ="<tr class='trclick' id='" + this.appDiv.id + "row-" + i + "'><td>" + v.Display_Name + "</td><td>" + v.TAXON + "</td></tr>" ;
					$('#' + this.appDiv.id + 'myTable tbody').append(newRow)
				}));
				// Update table
				require(["jquery", "plugins/species/js/jquery.tablesorter"],lang.hitch(this,function($) {
					$('#' + this.appDiv.id + 'myTable').trigger("update");
				}));
				console.log($('#' + this.appDiv.id + 'myTable').height())	
				$('#' + this.appDiv.id + 'clickTitle').html('Species in Selected Hexagon')
				$('#' + this.appDiv.id + 'spDetailsHeader').html('<img src="plugins/species/images/leftArrow.png" width="20" alt="left arrow">  Click Rows for Species Details')
				//Resize main container - check which side first
				if (this.mapSide == "map-1_container"){
					this.useCon = this.con1;
				}else{
					this.useCon = this.con;
				}
				if ($(this.useCon).width() < 300){
					$( this.useCon ).animate({
						width: "580",
						height: "573px"
					}, 500 , lang.hitch(this,function() {
						$('#' + this.appDiv.id + 'myTable, #' + this.appDiv.id + 'leftSide, #' + this.appDiv.id + 'rightSide').css('display', 'block');
						$('#' + this.appDiv.id + 'bottomDiv').show();
						this.resize();	
					}));
					
				}	
				if (this.config.stateSet == "yes"){
					$("#" + this.appDiv.id + "myTable tr:contains('"+ this.config.speciesRow +"')").css("background-color", "#abcfe1");		
					// check if species details was visible for setState
					if (this.config.detailsVis == "inline-block"){
						console.log(this.config.speciesRow)
						$.each(this.items, lang.hitch(this,function(i,v){
							if (v.Display_Name == this.config.speciesRow){
								this.atRow = this.items[i];
								return false;
							}	
						}));
						this.updateSpeciesDetails();
					}	
					// Update dropdown menu selections from previous session
					$("#" + this.appDiv.id + "ch-TAXON").val(this.config.filter[1].value).trigger("chosen:updated");
					$("#" + this.appDiv.id + "ch-MAX_habavail_up60").val(this.config.filter[2].value).trigger("chosen:updated");
					$("#" + this.appDiv.id + "ch-fut_rpatch_ratio_cls").val(this.config.filter[3].value).trigger("chosen:updated");
					$("#" + this.appDiv.id + "ch-Cons_spp").val(this.config.filter[4].value).trigger("chosen:updated");
					if (this.config.filter[0].value.length > 0){
						$("#" + this.appDiv.id + "ch-Associations").val(this.config.filter[0].value).trigger("chosen:updated");
					}	
					this.config.stateSet = "no";
				}
			}, 
			// add values from items row to species details table
			updateSpeciesDetails: function(){
				$('#' + this.appDiv.id + 'spDetails .spd').each(lang.hitch(this,function (i, att){
					var id = att.id.split('-')[1]
					if (this.atRow[id] === undefined) {
					  console.log("found undefined " + id )
					}else if(this.atRow[id] === null) {
						$('#' + att.id).html(' null')
					}else{
						$('#' + att.id).html(this.atRow[id])	
					}
				}));	
				$('#' + this.appDiv.id + 'spDetailsHeader').html('Selected Species Details <img id="' + this.appDiv.id + 'sdkOpen" class="sdkOpen" src="' + this.info + '" alt="Info icon">');
				$('#' + this.appDiv.id + 'spDetails').slideDown();
				this.config.detailsVis = "inline-block";
				$('#' + this.appDiv.id + 'spDetails').css('display', 'inline-block');
				//update row background color
				$('#' + this.appDiv.id + 'myTable tr').each(lang.hitch(this,function (i, row){
					if (row.id != ""){						
						$('#' + row.id).css("background-color", "");
					}	
				}))
				$("#" + this.appDiv.id + "myTable tr:contains('"+ this.config.speciesRow +"')").css("background-color", "#abcfe1");	
				$('#' + this.appDiv.id + 'sdkOpen').on('click',lang.hitch(this,function(){
					$('#' + this.appDiv.id + 'spDetailsKey').slideDown();
				}));
			},
			// Build legend from JSON request
			buildLegend: function(){
				// Refresh Legend div content and height and width
				var hmw = { height: '235px', minWidth: '150px' }	
				$('#' + this.appDiv.id + 'myLegendDiv').css(hmw);
				$('#' + this.appDiv.id + 'mySpeciesLegend').html('');
				$.getJSON( this.config.url +  "/legend?f=pjson&callback=?", lang.hitch(this,function( json ) {
					var speciesArray = [];
					//get legend pics
					$.each(json.layers, lang.hitch(this,function(i, v){
						if (v.layerName == this.sppcode){
							speciesArray.push(v)	
						}	
					}));
					console.log(json)
					// Set Title
					$('#' + this.appDiv.id + 'mySpeciesLegend').append("<div style='display:inline;text-decoration:underline;font-weight:bold;margin-top:5px;'>" + this.speciesName + "</div><br>")
					// build legend items
					$.each(speciesArray[0].legend, lang.hitch(this,function(i, v){
						$('#' + this.appDiv.id + 'mySpeciesLegend').append("<p style='display:inline;'>" + v.label + "</p><img style='margin-bottom:-5px; margin-left:5px;' src='data:image/png;base64," + v.imageData + "' alt='Legend color'><br>")		
					})) 
					// Set legend div height and width
					var h = $('#' + this.appDiv.id + 'mySpeciesLegend').height() + 60;
					var w = $('#' + this.appDiv.id + 'mySpeciesLegend').width() + 30;
					var hw = { height: h + 'px', width: w + 'px' }	
					$('#' + this.appDiv.id + 'myLegendDiv').css(hw);
				})); 	
			}	
		});
	});						   