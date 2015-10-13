// Pull in your favorite version of jquery 
require({ 
	packages: [{ name: "jquery", location: "http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/", main: "jquery.min" }] 
});
// Bring in dojo and javascript api classes as well as config.json and content.html
define([
	"dojo/_base/declare", "framework/PluginBase", "esri/layers/FeatureLayer", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", 
	"esri/symbols/SimpleMarkerSymbol", "esri/graphic", "dojo/_base/Color", 	"dijit/layout/ContentPane", "dijit/form/HorizontalSlider", "dojo/dom", 
	"dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "dojo/dom-geometry", "dojo/_base/lang", "dojo/on", "dojo/parser", 
	"dojo/text!./config.json", "jquery", "dojo/text!./html/content.html"
],
function ( declare, PluginBase, FeatureLayer, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Color,
	ContentPane, HorizontalSlider, dom, domClass, domStyle, domConstruct, domGeom, lang, on, parser, config, $, content ) {
		return declare(PluginBase, {
			toolbarName: "Species", showServiceLayersInLegend: false, allowIdentifyWhenActive: false, rendered: false, resizable: false,
			// First function called when the user clicks the pluging icon. Defines the default JSON and plugin size
			initialize: function (frameworkParameters) {
				declare.safeMixin(this, frameworkParameters);
				domClass.add(this.container, "claro");
				this.con = dom.byId('plugins/species-0');
				this.con1 = dom.byId('plugins/species-1');
				if (this.con1 != undefined){
					domStyle.set(this.con1, "width", "200px");
					domStyle.set(this.con1, "height", "70px");
				}else{
					domStyle.set(this.con, "width", "200px");
					domStyle.set(this.con, "height", "70px");
				}	
				this.config = dojo.eval("[" + config + "]")[0];	
				this.items = [];
				this.itemsFiltered = [];
				this.atRow = [];
				this.filter = [ {"field": "TAXON", "value": ""}, {"field": "MAX_habavail_up60", "value": ""}, {"field": "fut_rpatch_ratio_cls",	"value": ""},
								{"field": "Cons_spp", "value": ""}, {"field": "Associations", "value": [] }	];
			},
			// Called after initialize at plugin startup (why all the tests for undefined). Also called after deactivate when user closes app by clicking X. 
			hibernate: function () {
				this.small = "yes";
				if (this.appDiv != undefined){
					$('#' + this.appDiv.id).hide();
					$('#' + this.appDiv.id + 'leftSide, #' + this.appDiv.id + 'rightSide, #' + this.buttonpane.domNode.id).css('display', 'none');
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
				$('.legend').removeClass("hideLegend");
			},
			// Called after hibernate at app startup. Calls the render function which builds the plugins elements and functions.   
			activate: function () {
				if (this.rendered == false) {
					this.rendered = true;							
					this.render();
					this.dynamicLayer.setVisibility(true);
				} else {
					if (this.dynamicLayer != undefined)  {
						this.dynamicLayer.setVisibility(true);	
					}
					if (this.small == "yes"){
						this.con = dom.byId('plugins/species-0');
						this.con1 = dom.byId('plugins/species-1');
						if (this.con1 != undefined){
							domStyle.set(this.con1, "width", "200px");
							domStyle.set(this.con1, "height", "70px");
						}else{
							domStyle.set(this.con, "width", "200px");
							domStyle.set(this.con, "height", "70px");
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
				if (cdg.h == 0) { this.sph = this.height - 90; }
				else { this.sph = cdg.h - 72; }
				domStyle.set(this.appDiv.domNode, "height", this.sph + "px"); 
			},
			// Called by activate and builds the plugins elements and functions
			render: function() {
				// Hide framework default legend
				$('.legend').addClass("hideLegend");
				// Define Content Pane		
				this.appDiv = new ContentPane({});
				parser.parse();
				dom.byId(this.container).appendChild(this.appDiv.domNode);					
				// Bottom bar for buttons and sliders								
				this.buttonpane = new ContentPane({
				  style:"border-top-style:groove !important; height:40px !important;overflow: hidden !important;background-color:#F3F3F3 !important;" +
				  "padding-top:5px !important; display:none;"
				});
				dom.byId(this.container).appendChild(this.buttonpane.domNode);	
				// Transparency slider	
				nslidernode = domConstruct.create("div");
				this.buttonpane.domNode.appendChild(nslidernode); 
				labelsnode = domConstruct.create("ol", {
					"data-dojo-type":"dijit/form/HorizontalRuleLabels", 
					container:"bottomDecoration", 
					style:"height:0.25em;padding-top: 7px !important;color:black !important", 
					innerHTML: "<li>Opaque</li><li>Transparent</li>"
				})
				nslidernode.appendChild(labelsnode);
				slider = new HorizontalSlider({
					value: 0,
					minimum: 0,
					maximum: 1,
					showButtons:false,
					title: "Change the layer transparency",
					onChange: lang.hitch(this,function(e){
						this.dynamicLayer.setOpacity(1 - e);
					}),
					style: "width:120px; background-color:#F3F3F3 !important; margin:auto !important;"
				}, nslidernode);
				parser.parse()
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
				}));				
				this.resize();
				// Get html from content.html, append appDiv.id to id's, and add to appDiv
				var idUpdate = content.replace(/id='/g, "id='" + this.appDiv.id);
				this.structure = domConstruct.create("div", { innerHTML: idUpdate, id: "test" });
				this.appDiv.domNode.appendChild(this.structure)
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
				//add hex feature class and click events
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
						console.log(this.config.selectedObId)
						var relatedTopsQuery = new esri.tasks.RelationshipQuery();
						relatedTopsQuery.outFields = ["*"];
						relatedTopsQuery.relationshipId = 0;
						relatedTopsQuery.objectIds = [features[0].attributes.OBJECTID_12_13];
						this.fc.queryRelatedFeatures(relatedTopsQuery, lang.hitch(this,function(relatedRecords) {
							var fset = relatedRecords[features[0].attributes.OBJECTID_12_13];
							this.items = $.map(fset.features, function(feature) {
								return feature.attributes;
							});
							if (this.filter[0].value.length > 0 || this.filter[1].value.length > 0 || this.filter[2].value.length > 0 || this.filter[3].value.length > 0 || this.filter[4].value.length > 0){
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
				// Table row click
				$('#' + this.appDiv.id + 'myTable').on('click','tr',lang.hitch(this,function(e) { 
					// get row number from element id
					var i = parseInt(e.currentTarget.id.split('-')[1]);
					// find object position in items by row number
					this.atRow = this.items[i];
					// Get text from Species cell
					this.config.speciesRow = e.currentTarget.children[0].innerHTML;
					//$('#' + e.currentTarget.id).css("background-color", "#abcfe1");
					
					this.updateSpeciesDetails();
				}));
				//Use selections on chosen menus to update this.filter object
				require(["jquery", "plugins/species/js/chosen.jquery"],lang.hitch(this,function($) {			
					$('#' + this.appDiv.id + 'rightSide .filter').chosen().change(lang.hitch(this,function(c, p){
						// Hide species details box, update header text, and clear any selected row  
						$('#' + this.appDiv.id + 'spDetails').slideUp();
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
							// Get index of the object where field equals 'Associations' in this.filter object
							$.each(this.filter, lang.hitch(this,function(i,v){
								if (filterField == v.field){ 
									this.ind = i; 
								}	
							}));
							// Add selected field to value array in object where field equals 'Associations'
							if (p.selected){
								this.filter[this.ind].value.push(p.selected)
							}
							// Remove selected field to value array in object where field equals 'Associations'
							else{
								var index = this.filter[this.ind].value.indexOf(p.deselected);
								if (index > -1) {
									this.filter[this.ind].value.splice(index, 1);
								}
							}			
						}
						// Single select menu handler
						else{
							// Get object where active menu id matches the field value. If option is seleceted add its value to the value property in current object.
							// If deselected, make value empty text in current object
							$.each(this.filter, lang.hitch(this,function(i,v){
								if (filterField == v.field){
									if (p){
										this.filter[i].value = p.selected;
									}else{
										this.filter[i].value = "";
									}	
								}	
							}))								
						}
						// No items are selected
						if (this.filter[0].value.length == 0 && this.filter[1].value.length == 0 && this.filter[2].value.length == 0 && this.filter[3].value.length == 0 && this.filter[4].value.length == 0){
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
			// Called when this.filter has values for filtering
			filterItems: function (){
				// Make copy of this.items for filtering
				this.itemsFiltered = this.items.slice();	
				// Loop throuhg filter object and remove non-matches from itemsFiltered
				$.each(this.filter, lang.hitch(this,function(i,v){
					this.removeArray = [];
					// Find non-matching item positions and add to removeArray
					// For multi-select menu
					if (v.field == "Associations"){
						if (this.filter[i].value.length > 0){
							$.each(this.filter[i].value, lang.hitch(this,function(i1,v1){
								$.each(this.itemsFiltered, lang.hitch(this,function(i2,v2){
									if (v2[v1] == 0){
										this.removeArray.push(i2)
									}	
								}));
							}))	
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
				item = items.sort(compare);
				// Add rows
				$.each(items, lang.hitch(this,function(i,v){
					var newRow ="<tr class='trclick' id='" + this.appDiv.id + "row-" + i + "'><td>" + v.Display_Name + "</td><td>" + v.TAXON + "</td></tr>" ;
					$('#' + this.appDiv.id + 'myTable tbody').append(newRow)
				}));
				// Update table
				require(["jquery", "plugins/species/js/jquery.tablesorter"],lang.hitch(this,function($) {
					$('#' + this.appDiv.id + 'myTable').trigger("update");
				}));	
				$('#' + this.appDiv.id + 'clickTitle').html('Species in Selected Hexagon')
				$('#' + this.appDiv.id + 'spDetailsHeader').html('&#8592; Click Rows for Species Details')
				//Resize main container - check which side first
				if (this.mapSide == "map-1_container"){
					this.useCon = this.con1;
				}else{
					this.useCon = this.con;
				}
				if ($(this.useCon).width() < 300){
					$( this.useCon ).animate({
						width: "510",
						height: "553px"
					}, 500 , lang.hitch(this,function() {
						$('#' + this.appDiv.id + 'myTable, #' + this.appDiv.id + 'leftSide, #' + this.appDiv.id + 'rightSide, #' + this.buttonpane.domNode.id).css('display', 'block');
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
				$('#' + this.appDiv.id + 'spDetailsHeader').html('Selected Species Details');
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
			}	
		});
	});	
					   

