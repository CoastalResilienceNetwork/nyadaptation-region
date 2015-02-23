//Module CoastalDefense.js

define([
	    "dojo/_base/declare",
		"use!underscore", 	
	    "dojo/json", 
		"use!tv4", 
		"dojo/store/Memory",
		"dojo/store/Observable",
		"dijit/form/ComboBox", 
		"jquery", 
		"jquery_ui",
		"dijit/form/Button",
		"dijit/form/DropDownButton",
		"dijit/form/ComboButton", 
		"dijit/DropDownMenu", 
		"dijit/MenuItem",
		"dijit/Menu",
		"dijit/layout/ContentPane",
		"dijit/layout/TabContainer",
		"dijit/Tooltip",
		"dijit/TooltipDialog",
		"dijit/Dialog",
		"dijit/popup",
		"dojo/on",
		"dojo/_base/array",
		"dojo/query",
		"dojo/_base/lang",
		"dojo/dom",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/_base/window",
		"dojo/dom-construct",
		"dojo/dom-geometry",
		"dijit/form/RadioButton",
		"dojo/parser",
		"dijit/form/NumberTextBox",
		"dijit/form/NumberSpinner",
		"dijit/registry",
		"dijit/layout/BorderContainer",
		"dijit/layout/AccordionContainer",
		"dojox/layout/TableContainer",
		"dijit/TitlePane",
		"dijit/form/CheckBox",
		"dijit/form/HorizontalSlider",
		"dojox/form/RangeSlider",
	   	"dojox/charting/Chart",
		"dojox/charting/axis2d/Default",
		"dojox/charting/plot2d/Lines",
		"dojox/charting/plot2d/StackedLines",
		"dojox/charting/plot2d/StackedAreas",
		"dojox/charting/plot2d/Areas",
		"dojox/charting/widget/Legend",
	    "dojox/charting/themes/Claro",
		"dojox/charting/StoreSeries",
		"dojox/charting/plot2d/Grid",
		"dojo/fx/easing",
		"dojo/number",
		"dijit/ProgressBar",
		

		//"esri/request",
		"esri/layers/FeatureLayer",
		"esri/layers/ArcGISDynamicMapServiceLayer"
		], 


	function (declare,
			_, 
			//Ext,
			JSON, 
			tv4, 
			Memory, 
			Observable,
			ComboBox, 
			$, 
			ui,
			Button,
			DropDownButton,
			ComboButton,
			DropDownMenu, 
			MenuItem,
			Menu,
			ContentPane,
			TabContainer,
			Tooltip,
			TooltipDialog,
			Dialog,
			popup,
			on,
			array,
			query,
			lang,
			dom,
			domClass,
			domStyle,
			win,
			domConstruct,
			domGeom,
			RadioButton,
			parser,
			NumberTextBox,
			NumberSpinner,
			registry,
			BorderContainer,
			AccordionContainer,
			TableContainer,
			TitlePane,
			CheckBox,
			HorizontalSlider,
			RangeSlider,
			Chart,
			Default,
			Lines,
			StackedLines,
			StackedAreas,
			Areas,
			Legend,
			theme,
			StoreSeries,
			Grid,
			easing,
			number,
			ProgressBar,
			
			//ESRIRequest,
			FeatureLayer,
			ArcGISDynamicMapServiceLayer
		  ) 
		
		{

		var cdTool = function(plugin, configFile, interfaceConfigFile){
			this._map = plugin.map;
			this._app = plugin.app;
			this._container = plugin.container;
			
			var self = this;
			this.parameters = {};
			this.pluginDirectory = plugin.pluginDirectory;
			this.utilities = {};
			this.toolUnits = {
				feet: {	
					multiplier: 3.2808,
					unitText: '(ft)',
					unitTextFull: 'Feet',
					conversionFactor: 0.3048
				},
				meters: {	
					multiplier: 1,
					unitText: '(m)',
					unitTextFull: 'Meters',
					conversionFactor: 3.2808
				}
			};
			this.parameters.windowOpen = false;
			
			this.initialize = function(){
				this._data = this.parseConfigData(configFile);
				this.parameters.regionIndex = 0;
				this.parameters.region = this._data[0].location;
				this._interface = JSON.parse(interfaceConfigFile);
				this.parameters.debug = this._interface.debug;				
				this.parameters.layersLoaded = false;
				this.gpFindProfileUrl = this._interface.gpServiceUrl.findProfile;
				this.gpRunWaveModelUrl = this._interface.gpServiceUrl.runWaveModel;
				this.loadInterface(this);
				dojo.connect(dojo.query('#' + this._container.parentNode.parentNode.id + ' .plugin-container-header')[0], 'onmousedown', function() {
					popup.close(self.chooseRegionButtonTooltip);
					popup.close(self.chooseProfileButtonTooltip);
					popup.close(self.chooseHabitatButtonTooltip);
				});
				
				dojo.connect(dojo.query('#' + this._container.parentNode.parentNode.id + ' .plugin-container-header')[0], 'onmouseup', function() {
					if (self.tabInputs.selected) {
						if ( dojo.byId('regionButton_dropdown') && dijit.byId('chooseProfileButton').get('disabled') ) {
							popup.open({
								popup: self.chooseRegionButtonTooltip,
								around: dojo.byId('regionButton'),
								orient: ["after"]
							});
							self.adjustInterfaceTooltip("chooseRegionButtonTooltip", 15, 10, 15);
						}
						
						if ( dojo.byId('chooseProfileButton_dropdown') && dijit.byId('habitatScenarioButton').get('disabled') ) {
							popup.open({
								popup: self.chooseProfileButtonTooltip,
								around: dojo.byId('chooseProfileButton'),
								orient: ["after"]
							});
							self.adjustInterfaceTooltip("chooseProfileButtonTooltip", 15, 10, 15);
						}
						
						if ( dojo.byId('habitatScenarioButton_dropdown') && dijit.byId('runScenarioButton').get('disabled') ) {
							popup.open({
								popup: self.chooseHabitatButtonTooltip,
								around: dojo.byId('habitatScenarioButton'),
								orient: ["after"]
							});
							self.adjustInterfaceTooltip("chooseHabitatButtonTooltip", 15, 10, 15);
						}
					}
				});
			}
			
			this.showIntro = function(){
				var self = this; 
					
			}; //end showIntro
			
			this.loadInterface = function() {
				var self = this;
				domStyle.set(this._container, "overflow", "hidden");				
				this.tc = new TabContainer({
						id: "cd-tc",
						isLayoutContainer: true,
						style: "height: 100%; width: 100%;",
						resize: function(){
					},
						useMenu: false,
						useSlider: false,
				    }, "tc1-prog");
					domClass.add(this.tc.domNode, "claro");
				this.tc.startup();
				this.tc.resize();
				
				//HELP PANE
				this.tabHelp = new ContentPane({
			         title: "Overview",
					 id: "cd-tc-Help",
					 style: "position:relative;width:823px;height:553px;overflow:hidden;",
					 isLayoutContainer: true,
					 onShow: function() {
						popup.close(self.chooseRegionButtonTooltip);
						popup.close(self.chooseProfileButtonTooltip);
						popup.close(self.chooseHabitatButtonTooltip);
					 }
			    });
				this.tabHelp.startup();
				//append help tab to main tabContainer
			    this.tc.addChild(this.tabHelp);
				
				var cpOverview = new ContentPane({
					id: "cd-overview",
					style: "position:relative; width:100%; height:100%;",
					content: ""
					//content: self._interface.overview
			    });
			    cpOverview.startup();
			    this.tabHelp.addChild(cpOverview);
				//request the overview.html template and populate the pane's content
				cpOverview.set("href", self.pluginDirectory + "/overview.html");
				
				//THE INPUTS PANEL
			    this.tabInputs = new ContentPane({
			         title: "Inputs",
					 id: "cd-tc-Inputs",
					 style: "position:relative;width:823px;height:553px;overflow:hidden;",
			         isLayoutContainer: true,
					 onShow: function() {
						self.resizeProfileChart();
						if( dijit.byId('chooseProfileButton').get('disabled') ){
							popup.open({
								popup: self.chooseRegionButtonTooltip,
								around: dojo.byId('regionButton'),
								orient: ["after"]
							});
							self.adjustInterfaceTooltip("chooseRegionButtonTooltip", 15, 10, 15);
						}
					 }
			    });
			    this.tabInputs.startup();
				//add inputs tab to main tabContainer
			    this.tc.addChild(this.tabInputs);
				
				//THE RESULTS PANEL
			    this.tabResults = new ContentPane({
			         title: "Results",
					 id: "cd-tc-Results",
					 style: "position:relative;width:823px;height:553px;overflow:hidden;",
					 isLayoutContainer: true,
					 onShow: function() {
						self.resizeResultsChart();
						popup.close(self.chooseRegionButtonTooltip);
						popup.close(self.chooseProfileButtonTooltip);
						popup.close(self.chooseHabitatButtonTooltip);
						/* self.coralReefCheckBoxTooltip.hide()
						self.mangroveReefCheckBoxTooltip.hide()
						self.underwaterStructureCheckBoxTooltip.hide(); */
					 }
			    });
				this.tabResults.startup();
				//append results tab to main tabContainer
			    this.tc.addChild(this.tabResults);
				
				//THE WAVE MODEL DEBUG PANEL
				if (this.parameters.debug) {
					this.tabDebug = new ContentPane({
						 title: "Server Messages",
						 id: "cd-tc-Debug",
						 style: "position:relative;width:823px;height:553px;",
						 isLayoutContainer: true,
						 onShow: function() {
							popup.close(self.chooseRegionButtonTooltip);
							popup.close(self.chooseProfileButtonTooltip);
							popup.close(self.chooseHabitatButtonTooltip);
						 }
					});
					this.tabDebug.startup();
					//append results tab to main tabContainer
					this.tc.addChild(this.tabDebug);
					
					this.debugServerMessagePane = new ContentPane({
						id: 'debugServerMessageContent'
					});
					this.debugServerMessagePane.startup();
					this.tabDebug.addChild(this.debugServerMessagePane);
				}

			    //empty layout containers
			    var cpTop = new ContentPane({
					id: 'cd-top-pane'
			    });
			    cpTop.startup();
				
				var cpBottom = new ContentPane({
					id: 'cd-bottom-pane'
			    });
			    cpBottom.startup();
				
				//add elements as children of inputs tab
			    this.tabInputs.addChild(cpTop);
				this.tabInputs.addChild(cpBottom);
				
				var habitatTitlePaneDiv = new ContentPane({
					id: 'habitatTitlePaneDiv',
					style: "position:relative",
					"class": 'claro dijitTitlePaneTitle'
			    });
				cpBottom.addChild(habitatTitlePaneDiv)

			    var cpLeading = new ContentPane({
			    	id: "cd-leading-pane"
			    });
				cpLeading.startup();

			    var cpMain = new ContentPane({
			    	id: 'cd-main-pane'
			    });
			    cpMain.startup();
				
				//add elements as children of bottom pane
			    cpBottom.addChild(cpLeading);
			    cpBottom.addChild(cpMain);

			    //add container to DOM
			    dom.byId(this._container).appendChild(this.tc.domNode);
				
				//create panel for region, units, and profile
			    var regionUnitsDiv = this.createRegionUnitsPanel(this);
				
			    //create panel for wave parameters
			    var wavePanelDiv = this.createWavePanel(this);
			  	
			  	//create panel for water
			  	var waterPanelDiv = this.createWaterPanel(this);
				
				var habitatContentDiv = this.createHabitatContentPanel(this);
				
				var mainContentDiv = this.createMainContentPanel(this);
				
				var resultsContentDiv = this.createResultsContentPanel(this);

				if (!dojo.byId("profilePolygonTooltipDiv")) {
					var profilePolygonTooltipDiv = domConstruct.create("div", { id:"profilePolygonTooltipDiv", innerHTML: "Click to set a profile for analysis"});
					dojo.byId(this._map.id).appendChild(profilePolygonTooltipDiv);
				}
				
				dojo.query("#cd-tc .dijitTabContainerTop-tabs").style("width", "100%");
			}

			this.showTool = function(){
				if (!this.profileChart) {
					this.addInterfaceTooltips();

					var blankData = []
					var range = 2000 
					for (var i = 0; i <= range; i++) {
						blankData.push ({ "x": i-(range/2), "y": -100 });
					}
					this.createProfileChart(blankData, this);
					this.createProfileChartSlider(blankData,this);
					
					this.createResultsChart(blankData, this);
					
					this.parameters.windowOpen = true;
					
					//hack to force panel to select coral reef by selecting another child then coral reef again
					dijit.byId('habitatPane').selectChild('mangrovePanel');
					dijit.byId('habitatPane').selectChild('coralReefPanel');
					dijit.byId('habitatPane').resize({h:370})
				}

			} //end this.showTool

			this.createRegionUnitsPanel = function () {

				   var cpTop = dijit.byId("cd-top-pane");
				   var regionUnitsPanel = new TitlePane({
				    	title: 'Geographic Parameters',
				    	id: 'regionUnitsPanel',
				    	toggleable: false
				    });
					cpTop.addChild(regionUnitsPanel);
					
					var regionUnitsContentDiv = domConstruct.create("div", { id:"regionUnitsContentDiv", style:"position:relative;" });
					regionUnitsPanel.set('content', regionUnitsContentDiv);

					var regionLabel = domConstruct.create("div", {innerHTML: "Choose Region:", id:"regionLabel"});
					regionUnitsContentDiv.appendChild(regionLabel);
					
					var regionDiv = domConstruct.create("div", { id:"regionDiv" });
					regionUnitsContentDiv.appendChild(regionDiv);
					
				    //Add Button to select region
					var regionMenu = new DropDownMenu({ style: "display: none;"});
					domClass.add(regionMenu.domNode, "claro");
					
					_.each(this._data[this.parameters.regionIndex].extents.subRegions, function(value, key){
						self.key = key;
						var menuItem = new MenuItem({
							label: value.name,
							onClick: function(){
								self.regionButton.set("label", this.label);
								self.regionSelect(this.label, key, self);
							}
						});
						regionMenu.addChild(menuItem);
					});	

					this.regionButton = new ComboButton({
						label: "Region",
						name: "regionButton",
						dropDown: regionMenu,
						id: "regionButton"
					});
					
					regionDiv.appendChild(this.regionButton.domNode);
					
					var unitsContentDiv = domConstruct.create("div", {id:"unitsContentDiv", style:"display:none;"});
					regionUnitsContentDiv.appendChild(unitsContentDiv);
					
					var unitsTypeLabel = domConstruct.create("div", {innerHTML: "Choose Units:", id:"unitsTypeLabel"});
					unitsContentDiv.appendChild(unitsTypeLabel);

					var unitsDiv = domConstruct.create("div", {id:"unitsDiv"});
					var unitsMenu = new DropDownMenu({ style: "display: none;"});
					domClass.add(unitsMenu.domNode, "claro");
					
					var units = ["Meters","Feet"]
					_.each(units, function(value){
						var menuItem = new MenuItem({
							label: value,
							onClick: function(){ 
								self.unitsButton.set("label", this.label);
								self.updateInterfaceWithNewUnits(this.label.toLowerCase());
							}
						});
						unitsMenu.addChild(menuItem);
					});	

					this.unitsButton = new ComboButton({
						label: "Meters",
						name: "unitsButton",
						dropDown: unitsMenu,
						id: "unitsButton",
						disabled: true
					});
					
					unitsDiv.appendChild(this.unitsButton.domNode);
					
					unitsContentDiv.appendChild(unitsDiv); 
					
					dojo.addClass(dojo.body(), 'claro');
					var chooseProfileButtonDiv = domConstruct.create("div", {id:"chooseProfileButtonDiv"});
					regionUnitsContentDiv.appendChild(chooseProfileButtonDiv);
				
					this.chooseProfileButton = new Button({
				        label: "Click to Set Profile Location",
						id: "chooseProfileButton",
						disabled: true,
				        onClick: function(){ 
							self.setClickLocation(self._container.parentNode.parentNode.id);
						}
				    });
					chooseProfileButtonDiv.appendChild(this.chooseProfileButton.domNode);
					
					//Get Units Choice
					this.currentUnits = (this.unitsButton.get("label") == "Meters") ? this.toolUnits.meters : this.toolUnits.feet;
					
				}

			this.createWavePanel = function() {
				var self = this;
				var cpTop = dijit.byId("cd-top-pane");

				var wavePanel = new TitlePane({
					title: 'Wave Parameters',
					id: 'wavePanel',
					toggleable: false 
				});
				cpTop.addChild(wavePanel);
			  
				var windWaveContentDiv = domConstruct.create("div", { id:"windWaveContentDiv", style:"position: relative;"});
				
				var waveTypeLabel = domConstruct.create("div", {innerHTML: "Wave Conditions:", id:"waveTypeLabel"});
				windWaveContentDiv.appendChild(waveTypeLabel);	
				var waveTypeDiv = domConstruct.create("div", { id:"waveTypeDiv" });
				windWaveContentDiv.appendChild(waveTypeDiv);	
				
				var windWaveMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(windWaveMenu.domNode, "claro");
			
				_.each(this._interface.waveType, function(value, key){
						var menuItem = new MenuItem({
							label: value.name,
							onClick: function(){
								//this.parameters.windWaveBtnLabel = this.label;
								self.windWaveButton.set("label", this.label);
								
								switch (this.label) {
									case "Direct":
										dojo.style("windContentDiv", "display", "none");
										dojo.style("waveContentDiv", "display", "block");
										dojo.style("hurricaneContentDiv", "display", "none");
										break;
									case "Oceanic":
										dojo.style("windContentDiv", "display", "none");
										dojo.style("waveContentDiv", "display", "block");
										dojo.style("hurricaneContentDiv", "display", "none");
										break;
									case "Wind-Wave":
										dojo.style("windContentDiv", "display", "block");
										dojo.style("waveContentDiv", "display", "none");
										dojo.style("hurricaneContentDiv", "display", "none");
										break;
									case "Hurricane":
										dojo.style("windContentDiv", "display", "none");
										dojo.style("waveContentDiv", "display", "none");
										dojo.style("hurricaneContentDiv", "display", "block");
										break;
								}
							}
						});
					windWaveMenu.addChild(menuItem);
				});

				this.windWaveButton = new ComboButton({
					label: "Oceanic",
					name: "windWaveButton",
					dropDown: windWaveMenu,
					id: "windWaveButton",
					disabled: true
				});

				waveTypeDiv.appendChild(this.windWaveButton.domNode);
				
				/* var waveTypeHelpDiv = domConstruct.create("div", {innerHTML: "<span>?</span>", id:"waveTypeHelp", style: "position:absolute; width: 20px; height: 20px; font-size: 14px; right: 20px; top: 0px;" });
				windWaveContentDiv.appendChild(waveTypeHelpDiv); */

				var waveContentDiv = domConstruct.create("div", {id:"waveContentDiv", style: "position: relative;"});
				windWaveContentDiv.appendChild(waveContentDiv);
				
				var directInputLabel = domConstruct.create("div", {innerHTML: "Enter Wave Conditions:", id:"directInputLabel", style: "display: none;" });
				waveContentDiv.appendChild(directInputLabel);

				//Add Text Boxes
				var inputWidth = "width: 50px;";
				var inputHeight = "height: 34px;";
				var inputMargin = "margin: 2px;";

				var waveValue = 6;
				var periodValue = 10;
				
				var waveHeightBoxLabel = domConstruct.create("div", {innerHTML: "Height:", id:"waveHeightBoxLabel", style: "display: none;" });
				waveContentDiv.appendChild(waveHeightBoxLabel);
				
				this.waveHeightBox = new NumberSpinner({
					  name: "waveHeight",
					  id: "waveHeight",
					  label:  "Height:",
					  value: waveValue,
					  required: true,
					  style: inputWidth + inputHeight + inputMargin + "display: none;",
					  disabled: true,
					 //class: textInput
					  //constraints: {pattern: "0.######"}
				}, "waveHeight");
				waveContentDiv.appendChild(this.waveHeightBox.domNode);				

				var wavePeriodBoxLabel = domConstruct.create("div", {innerHTML: "Period(s):", id:"wavePeriodBoxLabel", style: "display: none;" });
				waveContentDiv.appendChild(wavePeriodBoxLabel);
				
				this.wavePeriodBox = new NumberSpinner({
					  name: "wavePeriod",
					  id: "wavePeriod",
					  label:  "Period (s):",
					  value: periodValue,
					  required: true,
					  style: inputWidth + inputHeight + inputMargin + "display: none;",
					  disabled: true,
					  //class: textInput
					  //constraints: {pattern: "0.######"}
				}, "wavePeriod");
				waveContentDiv.appendChild(this.wavePeriodBox.domNode);

				var waveComboLabel = domConstruct.create("div", {innerHTML: "Wave Strength:", id:"waveComboLabel"});
				waveContentDiv.appendChild(waveComboLabel);	

				var waveMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(waveMenu.domNode, "claro");
				_.each(this._interface.waves, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							self.waveButton.set("label", this.label);
							self.waveHeightBox.set("value", self.parameters.wave[this.label].height);
							self.wavePeriodBox.set("value", self.parameters.wave[this.label].period);
						}
					});
				
					waveMenu.addChild(menuItem);
				});
				
				this.waveButton = new ComboButton({
					label: "Storm",
					name: "waveButton",
					dropDown: waveMenu,
					id: "waveButton",
					disabled: true
				});
			
				waveContentDiv.appendChild(this.waveButton.domNode);

				var windContentDiv = domConstruct.create("div", { id:"windContentDiv", style:"display:none;"});
				windWaveContentDiv.appendChild(windContentDiv);	

				var windComboLabel = domConstruct.create("div", {innerHTML: "Wind Strength:", id:"windComboLabel"});
				windContentDiv.appendChild(windComboLabel);	

				var windMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(windMenu.domNode, "claro");
				_.each(this._interface.winds, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							/*self.updateWaveBtn(this.label)*/
							self.windButton.set("label", this.label);
						}
					});
				
					windMenu.addChild(menuItem);
				});
				
				this.windButton = new ComboButton({
					label: "Strong Storm",
					name: "windButton",
					dropDown: windMenu,
					id: "windButton",
					disabled: true
				});
			
				windContentDiv.appendChild(this.windButton.domNode);
				
				var hurricaneContentDiv = domConstruct.create("div", { id:"hurricaneContentDiv", style:"display:none;"});
				windWaveContentDiv.appendChild(hurricaneContentDiv);

				var hurricaneComboLabel = domConstruct.create("div", {innerHTML: "Hurricane Category:", id:"hurricaneComboLabel"});
				hurricaneContentDiv.appendChild(hurricaneComboLabel);	

				var hurricaneMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(windMenu.domNode, "claro");
				_.each(this._interface.hurricane, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							/*self.updateWaveBtn(this.label)*/
							self.hurricaneButton.set("label", this.label);
						}
					});
					hurricaneMenu.addChild(menuItem);
				});
				
				this.hurricaneButton = new ComboButton({
					label: "Category 1",
					name: "hurricaneButton",
					dropDown: hurricaneMenu,
					id: "hurricaneButton",
					disabled: true
				});
			
				hurricaneContentDiv.appendChild(this.hurricaneButton.domNode);				
				
				wavePanel.set('content', windWaveContentDiv);	
				//END ADD WAVE PANEL CONTENT
			}

			this.createWaterPanel = function() {	
				var self = this;
				var cpTop = dijit.byId("cd-top-pane");

				var waterPanel = new TitlePane({
					title: 'Water Parameters',
					id: 'waterPanel',
					toggleable:false 
				});
				cpTop.addChild(waterPanel);
			   
				var waterContentDiv = domConstruct.create("div", { id:"waterContentDiv", style:"position: relative;"});
				
				var waterTypeLabel = domConstruct.create("div", {innerHTML: "Sea Level Increase Type:", id:"waterTypeLabel"});
				waterContentDiv.appendChild(waterTypeLabel);	
				var waterTypeDiv = domConstruct.create("div", { id:"waterTypeDiv" });
				waterContentDiv.appendChild(waterTypeDiv);	
				
				var waterTypeMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(waterTypeMenu.domNode, "claro");
			
				_.each(this._interface.waterType, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							self.waterTypeButtonOnChange(this.label);
						}
					});
					waterTypeMenu.addChild(menuItem);
				});

				this.waterTypeButton = new ComboButton({
					label: "Tide",
					name: "waterTypeButton",
					dropDown: waterTypeMenu,
					id: "waterTypeButton",
					disabled: true
				});

				waterTypeDiv.appendChild(this.waterTypeButton.domNode);

				var seaLevelRiseContentDiv = domConstruct.create("div", {id:"seaLevelRiseContentDiv", style: "display: none;"});
				waterContentDiv.appendChild(seaLevelRiseContentDiv);
				
				var seaLevelRiseComboLabel = domConstruct.create("div", {innerHTML: "Sea Level Rise Scenario:", id:"seaLevelRiseComboLabel", class:"btnLabels"});
				seaLevelRiseContentDiv.appendChild(seaLevelRiseComboLabel);	

				var seaLevelRiseMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(seaLevelRiseMenu.domNode, "claro");
			
				_.each(this._interface.seaLevel, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							self.seaLevelRiseButton.set("label", this.label);
						}
					});
					seaLevelRiseMenu.addChild(menuItem);
				});

				this.seaLevelRiseButton = new ComboButton({
					label: "Moderate",
					name: "seaLevelRiseButton",
					dropDown: seaLevelRiseMenu,
					id: "seaLevelRiseButton",
					disabled: true
				});

				//this.parameters.waterLevelKey = 3;  //Pre-set mhhw as the default and assign key - may want to include default values in json file at some point
				
				seaLevelRiseContentDiv.appendChild(this.seaLevelRiseButton.domNode);

				//Create Stormsurge Drop down button
				
				var tideLevelContentDiv = domConstruct.create("div", {id:"tideLevelContentDiv", style: "display: block;"});
				waterContentDiv.appendChild(tideLevelContentDiv);
				
				var tideLevelComboLabel = domConstruct.create("div", {innerHTML: "Tide Level:", id:"tideLevelComboLabel", class:"btnLabels"});
				tideLevelContentDiv.appendChild(tideLevelComboLabel);	

				var tideLevelMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(tideLevelMenu.domNode, "claro");
			
				_.each(this._interface.tideLevel, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							self.tideLevelButton.set("label", this.label);
							if (this.label == 'Mean Lower Low Water' || this.label == 'Mean Sea Level') {
								self.mangroveCheckBox.set("checked", false);
								if (self.profileChart.getSeries("Mangrove (future)")) {
									self.onHabitatCheckboxChange('mangrove', self.mangroveCheckBox);
								}
								self.mangroveCheckBox.set("disabled", true);
								self.mangroveCheckBoxTooltip.set("label", "(Disabled) Mangrove habitat must be submerged to modify - set tide level to Mean Higher High Water or above.");
							} else {
								self.mangroveCheckBox.set("disabled", false);
								self.mangroveCheckBoxTooltip.set("label", "Check to set a mangrove restoration scenario. Uncheck to run under current conditions.");
							}
						}
					});
					tideLevelMenu.addChild(menuItem);
				});

				this.tideLevelButton = new ComboButton({
					label: "Mean Sea Level",
					name: "tideLevelButton",
					dropDown: tideLevelMenu,
					id: "tideLevelButton",
					disabled: true
				});
				
				//this.parameters.surgeLevelKey = 0;  //Pre-set mhhw as the default and assign key - may want to include default values in json file at some point
			
				tideLevelContentDiv.appendChild(this.tideLevelButton.domNode);
				
				waterPanel.set('content', waterContentDiv);
			}
			
			this.waterTypeButtonOnChange = function(label) {
				this.waterTypeButton.set("label", label);
							
				switch (label) {
					case "Sea-Level Rise":
						dojo.style("seaLevelRiseContentDiv", "display", "block");
						dojo.style("tideLevelContentDiv", "display", "none");
						if (this.coralReefCheckBox.checked) { 
							this.reefResponseTypeButton.set('disabled', false);
							if (this.reefResponseTypeButton.label == "Degrade") {
								this.reefResponseDegradationBox.set('disabled', false);
							}
						}
						if ((this.currentHabitatData.mangrove) && (this.currentHabitatData.mangrove.length > 0)) {
							this.mangroveCheckBox.set("disabled", false);
							this.mangroveCheckBoxTooltip.set("label", "Check to set a mangrove restoration scenario. Uncheck to run under current conditions.");
						}
						break;
					case "Tide":
						dojo.style("seaLevelRiseContentDiv", "display", "none");
						dojo.style("tideLevelContentDiv", "display", "block");
						if (this.coralReefCheckBox.checked) { 
							this.reefResponseTypeButton.set('disabled', true);
							if (this.reefResponseTypeButton.label == "Degrade") {
								this.reefResponseDegradationBox.set('disabled', true);
							}
						}
						if (this.tideLevelButton.get('label') == 'Mean Lower Low Water' || this.tideLevelButton.get('label') == 'Mean Sea Level') {
							this.mangroveCheckBox.set("checked", false);
							if (this.profileChart.getSeries("Mangrove (future)")) {
								this.onHabitatCheckboxChange('mangrove', this.mangroveCheckBox);
							}
							this.mangroveCheckBox.set("disabled", true);
							this.mangroveCheckBoxTooltip.set("label", "(Disabled) Mangrove habitat must be submerged to modify - set tide level to Mean Higher High Water or above.");
						} else {
							this.mangroveCheckBox.set("disabled", false);
							this.mangroveCheckBoxTooltip.set("label", "Check to set a mangrove restoration scenario. Uncheck to run under current conditions.");
						}
						break;
				}
			}
			
			this.createHabitatContentPanel = function() {
				var cpLeading = dijit.byId("cd-leading-pane");
				var habitatTitlePaneDiv = dijit.byId("habitatTitlePaneDiv");

				var habitatScenarioMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(habitatScenarioMenu.domNode, "claro");
			
				_.each(this._interface.habitatScenario, function(value, key){
					var menuItem = new MenuItem({
						label: value.name,
						onClick: function(){
							//self.habitatScenarioButton.set("label", "Habitat Parameters");
							self.habitatScenarioTitleDiv.innerHTML = this.label;
							self.updateInterfaceInputs(this.label);
						}
					});
					habitatScenarioMenu.addChild(menuItem);
				});

				this.habitatScenarioButton = new DropDownButton({
					label: "Habitat Parameters",
					name: "habitatScenarioButton",
					dropDown: habitatScenarioMenu,
					id: "habitatScenarioButton",
					style: "position: relative; left: -6px; top: -2px;",
					disabled: true
				});
				habitatTitlePaneDiv.domNode.appendChild(this.habitatScenarioButton.domNode);
				
				
				this.habitatScenarioTitleDiv = domConstruct.create("div", {
					id:"habitatScenarioTitleDiv",
					style: "position: absolute; width: 470px; height: 24px; top:0px; right: 10px; text-align: center; line-height: 24px;font-size: 16px; font-weight: bolder;"
				});
				habitatTitlePaneDiv.domNode.appendChild(this.habitatScenarioTitleDiv);
				
				var habitatPane = new AccordionContainer({
					id: 'habitatPane'
				});
				
				habitatPane.addChild(new ContentPane({
					id:"coralReefPanel",
					title: "<input id=\'coralReefCheckBox\' type=\'checkbox\'/><span class='habitatTitleText'>Live Coral Reef</span>",
					content: "",
					style:"width:100%;"
				}));
				habitatPane.addChild(new ContentPane({
					id:"mangrovePanel",
					title: "<input id=\'mangroveCheckBox\' type=\'checkbox\'/><span class='habitatTitleText'>Mangrove</span>",
					content: ""
				}));
				habitatPane.addChild(new ContentPane({
					id:"marshPanel",
					title: "<input id=\'marshCheckBox\' type=\'checkbox\'/><span class='habitatTitleText'>Marsh</span>",
					content: ""
				}));
				habitatPane.addChild(new ContentPane({
					id:"seaGrassPanel",
					title: "<input id=\'seaGrassCheckBox\' type=\'checkbox\'/><span class='habitatTitleText'>Sea Grass</span>",
					content: ""
				}));
				habitatPane.addChild(new ContentPane({
					id:"underwaterStructurePanel",
					title: "<input id=\'underwaterStructureCheckBox\' type=\'checkbox\'/><span class='habitatTitleText'>Artificial Reef Structure</span>",
					content: ""
				}));
				habitatPane.addChild(new ContentPane({
					id:"structurePanel",
					title: "<input id=\'structureCheckBox\' type=\'checkbox\'/><span class='habitatTitleText'>Structure</span>",
					content: ""
				}));
				habitatPane.addChild(new ContentPane({
					id:"beachPanel",
					title: "<input id=\'beachCheckBox\' type=\'checkbox\'/> <span class='habitatTitleText'>Beach</span>",
					content: ""
				}));
				cpLeading.addChild(habitatPane);
				habitatPane.startup();
			   
				//add content to coral reef panel in accordion
				var coralReefDiv = this.createCoralReefPanel(this);

				//add content to mangrove panel in accordion
				var mangroveDiv = this.createMangrovePanel(this);

				//add content to underwater structure panel in accordion
				var underwaterStructureDiv = this.createUnderwaterStructurePanel(this);
				
				//add content to underwater structure panel in accordion
				var structureDiv = this.createStructurePanel(this);
				
				//hide accordion panels that aren't being used for now
				domStyle.set(dijit.byId("seaGrassPanel").getParent().id, "display","none");
				domStyle.set(dijit.byId("marshPanel").getParent().id, "display","none");
				domStyle.set(dijit.byId("structurePanel").getParent().id, "display","none");
				domStyle.set(dijit.byId("beachPanel").getParent().id, "display","none");
			}

			this.createCoralReefPanel = function() {
				
				var crPanel = dijit.byId("coralReefPanel");
				dojo.connect(crPanel, "onSelected", function() {
					if (self.coralReefCheckBox.checked) {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "block");
						self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
						self.setProfileSliderText('coral', true);
					} else  {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
						self.setProfileSliderText('coral', false);
					}
				});
				
				//Checkbox Widget
				this.coralReefCheckBox = new CheckBox({
				    id: "coralReefCheckBox",
				    checked: false,
					disabled: true,
				    value: "coral reef",
				    name: "coralReefCheckBox",
					onClick: function(){
						self.onHabitatCheckboxChange('coral', this);
					}
				}, "coralReefCheckBox");
				
				var reefLocationPanel = new TitlePane({
				    	title: 'Restored Area',
				    	id: 'reefLocationPanel',
				    	toggleable: false
				    });
				crPanel.addChild(reefLocationPanel);
				
				//Create Table Div for text boxes
				var coralReefDiv = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_reefTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_reefTable"));
				
				//Add Text Boxes
				var inputWidth = "width: 60px;";
				var inputHeight = "height: 34px;";
				var inputMargin = "margin: 2px;";

				this.reefShoreEdgeBox = new NumberSpinner({
					  name: "cd_reefShoreEdgeBox",
					  id: "cd_reefShoreEdgeBox",
					  label:  "Shore Edge " + this.currentUnits.unitText + ":",
					  value: 0,
					  required: true,
					  intermediateChanges:false,
					  smallDelta:1,
					  disabled: true,
					  style: "width: 70px;" + inputHeight + inputMargin,
					  onChange: function() {
						var value = this.get('value');
						self.parameters.futureReefShoreEdge = value;
						self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
					  },
					  onKeyUp: function(e) {
						if (e.key == "Enter") {
							var value = this.get('value');
							self.parameters.futureReefShoreEdge = value;
							self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
						}
					  },
				      constraints: {pattern: "##,###"}
				}, "cd_reefShoreEdgeBox");	

				this.reefSeaEdgeBox = new NumberSpinner({
					  name: "cd_reefSeaEdgeBox",
					  id: "cd_reefSeaEdgeBox",
					  label:  "Sea Edge " + this.currentUnits.unitText + ":",
					  value: 0,
					  required: true,
					  intermediateChanges:false,
					  smallDelta:1,
					  disabled: true,
					  style: "width: 70px;" + inputHeight + inputMargin,
					  onChange: function() {
						var value = this.get('value');
						self.parameters.futureReefSeaEdge = value;
						self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
					  },
					  onKeyUp: function(e) {
						if (e.key == "Enter") {
							var value = this.get('value');
							self.parameters.futureReefSeaEdge = value;
							self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
						}
					  },
				      constraints: {pattern: "##,###"}
				}, "cd_reefSeaEdgeBox");
				
				coralReefDiv.addChild(this.reefSeaEdgeBox);
				coralReefDiv.addChild(this.reefShoreEdgeBox);
				coralReefDiv.startup();
				reefLocationPanel.addChild(coralReefDiv);
				
				dojo.connect(this.reefSeaEdgeBox.upArrowNode, 'onclick', function(){
					var value = dijit.byId('cd_reefSeaEdgeBox').get('value');
					self.parameters.futureReefSeaEdge = value;
					self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
				});
				
				dojo.connect(this.reefShoreEdgeBox.downArrowNode, 'onclick', function(){
					var value = dijit.byId('cd_reefShoreEdgeBox').get('value');
					self.parameters.futureReefShoreEdge = value;
					self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
				});
				
				var reefFrictionPanel = new TitlePane({
				    	title: 'Friction Coefficient',
				    	id: 'reefFrictionPanel',
						style: 'display: none;',
				    	toggleable: false
				    });
				crPanel.addChild(reefFrictionPanel);

				//Create Table Div for text boxes
				var reefFrictionDiv = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_reefFrictionTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_reefFrictionTable"));
				
				this.frictionCoefficientLiveCoralBox = new NumberSpinner({
					  name: "cd_frictionCoefficientLiveCoralBox",
					  id: "cd_frictionCoefficientLiveCoralBox",
					  label:  "Live Coral:",
					  value: 0.20,
					  required: false,
					  smallDelta:0.01,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "0.00"}
				}, "cd_frictionCoefficientLiveCoralBox");	

				this.frictionCoefficientReefFrameworkBox = new NumberSpinner({
					  name: "cd_frictionCoefficientReefFrameworkBox",
					  id: "cd_frictionCoefficientReefFrameworkBox",
					  label:  "Reef Framework:",
					  value: 0.10,
					  required: false,
					  smallDelta:0.01,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "0.00"}
				}, "cd_frictionCoefficientReefFrameworkBox");
				
				reefFrictionDiv.addChild(this.frictionCoefficientLiveCoralBox);
				reefFrictionDiv.addChild(this.frictionCoefficientReefFrameworkBox);
				reefFrictionDiv.startup();
				reefFrictionPanel.addChild(reefFrictionDiv);
				
				var reefResponsePanel = new TitlePane({
				    	title: 'Reef Response to SLR',
				    	id: 'reefResponsePanel',
						style: 'display: none;',
				    	toggleable: false
				    });
				crPanel.addChild(reefResponsePanel);

				//Create Table Div for text boxes
				var reefResponseDiv = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_reefResponseTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_reefResponseTable"));
				
				var reefResponseMenu = new DropDownMenu({ style: "display: none;"});
				domClass.add(reefResponseMenu.domNode, "claro");
				
				var reefResponse = ["Keep Up", "Degrade"]
				_.each(reefResponse, function(value){
					var menuItem = new MenuItem({
						label: value,
						onClick: function(){ 
							self.reefResponseTypeButton.set("label", this.label);
							if (this.label == "Degrade") {
								self.reefResponseDegradationBox.set('disabled', false);
							 } else {
								self.reefResponseDegradationBox.set('disabled', true);
							}
						}
					});
					reefResponseMenu.addChild(menuItem);
				});	

				this.reefResponseTypeButton = new ComboButton({
					label: "Response:",
					name: "reefResponseTypeButton",
					dropDown: reefResponseMenu,
					id: "reefResponseTypeButton",
					disabled: true
				});

				this.reefResponseDegradationBox = new NumberSpinner({
					  name: "cd_reefResponseDegradationBox",
					  id: "cd_reefResponseDegradationBox",
					  label:  "Degradation (%):",
					  value: 0,
					  required: false,
					  smallDelta:1,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "###"}
				}, "cd_reefResponseDegradationBox");
				
				reefResponseDiv.addChild(this.reefResponseTypeButton);
				reefResponseDiv.addChild(this.reefResponseDegradationBox);
				reefResponseDiv.startup();
				reefResponsePanel.addChild(reefResponseDiv);
				this.reefResponseTypeButton.set('label', 'Keep Up');

			},

			this.createMangrovePanel = function() {
				var mangrovePanel = dijit.byId("mangrovePanel");
				dojo.connect(mangrovePanel, "onSelected", function() {
					if (self.mangroveCheckBox.checked) {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "block");
						self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
						self.setProfileSliderText('mangrove', true);
					} else  {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
						self.setProfileSliderText('mangrove', false);
					}
				});
				
				//Checkbox Widget
				this.mangroveCheckBox = new CheckBox({
				    id: "mangroveCheckBox",
				    checked: false,
					disabled: true,
				    value: "mangrove",
				    name: "mangroveCheckBox",
					onClick: function(){
						self.onHabitatCheckboxChange('mangrove', this);
					}
				}, "mangroveCheckBox");
				
				var mangroveLocationPanel = new TitlePane({
				    	title: 'Restored/Degraded Area',
				    	id: 'mangroveLocationPanel',
				    	toggleable: false
				    });
				mangrovePanel.addChild(mangroveLocationPanel);
				
				//Create Table Div for text boxes
				var mangroveLocationDiv = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_mangroveTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_mangroveTable"));
				
				//Add Text Boxes
				var inputWidth = "width: 60px;";
				var inputHeight = "height: 34px;";
				var inputMargin = "margin: 2px;";

				this.mangroveShoreEdgeBox = new NumberSpinner({
					  name: "cd_mangroveShoreEdgeBox",
					  id: "cd_mangroveShoreEdgeBox",
					  label:  "Shore Edge " + this.currentUnits.unitText + ":",
					  value: 0,
					  required: true,
					  disabled: true,
					  style: "width: 70px;" + inputHeight + inputMargin,
					  onChange: function() {
						var value = this.get('value');
						self.parameters.futureMangroveShoreEdge = value;
						self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
					  },
					  onKeyUp: function(e) {
						if (e.key == "Enter") {
							var value = this.get('value');
							self.parameters.futureMangroveShoreEdge = value;
							self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
						}
					  },
				      constraints: {pattern: "##,###"}
				}, "cd_mangroveShoreEdgeBox");	

				this.mangroveSeaEdgeBox = new NumberSpinner({
					  name: "cd_mangroveSeaEdgeBox",
					  id: "cd_mangroveSeaEdgeBox",
					  label:  "Sea Edge " + this.currentUnits.unitText + ":",
					  value: 0,
					  required: true,
					  disabled: true,
					  style: "width: 70px;" + inputHeight + inputMargin,
					  onChange: function() {
						var value = this.get('value');
						self.parameters.futureMangroveSeaEdge = value;
						self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
					  },
					  onKeyUp: function(e) {
						if (e.key == "Enter") {
							var value = this.get('value');
							self.parameters.futureMangroveSeaEdge = value;
							self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
						}
					  },
				      constraints: {pattern: "##,###"}
				}, "cd_mangroveSeaEdgeBox");
				
				//add children, startup and append to domNode
				mangroveLocationDiv.addChild(this.mangroveShoreEdgeBox);
				mangroveLocationDiv.addChild(this.mangroveSeaEdgeBox);
				mangroveLocationDiv.startup();
				mangroveLocationPanel.addChild(mangroveLocationDiv);
				
				dojo.connect(this.mangroveSeaEdgeBox.upArrowNode, 'onclick', function(){
					var value = dijit.byId('cd_mangroveSeaEdgeBox').get('value');
					self.parameters.futureMangroveSeaEdge = value;
					self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
				});
				
				dojo.connect(this.mangroveShoreEdgeBox.downArrowNode, 'onclick', function(){
					var value = dijit.byId('cd_mangroveShoreEdgeBox').get('value');
					self.parameters.futureMangroveShoreEdge = value;
					self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
				});
				
				var mangroveDensityPanel = new TitlePane({
				    	title: 'Mangrove Characteristics',
				    	id: 'mangroveDensityPanel',
						style: 'display: none;',
				    	toggleable: false
				    });
				mangrovePanel.addChild(mangroveDensityPanel);
				
				//Create Table Div for text boxes
				var mangroveDensityDiv = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_mangroveDensityTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_mangroveDensityTable"));
				
				this.mangroveDensityBox = new NumberSpinner({
					  name: "cd_mangroveDensityBox",
					  id: "cd_mangroveDensityBox",
					  label:  "Initial Tree Density: ",
					  value: 1.2,
					  required: false,
					  smallDelta:0.01,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "0.00"}
				}, "cd_mangroveDensityBox");

				this.mangroveDensityReductionBox = new NumberSpinner({
					  name: "cd_mangroveDensityReductionBox",
					  id: "cd_mangroveDensityReductionBox",
					  label:  "Future Density Reduction (%): ",
					  value: 0,
					  required: false,
					  smallDelta:1,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "###"}
				}, "cd_mangroveDensityReductionBox");
				
				this.mangroveMudDensityBox = new NumberSpinner({
					  name: "cd_mangroveMudDensityBox",
					  id: "cd_mangroveMudDensityBox",
					  label:  "Mud Density: ",
					  value: 70,
					  required: false,
					  smallDelta:1,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "###"}
				}, "cd_mangroveMudDensityBox");
				
				this.mangroveSurgeAttenuationBox = new NumberSpinner({
					  name: "cd_mangroveSurgeAttenuationBox",
					  id: "cd_mangroveSurgeAttenuationBox",
					  label:  "Surge Attenuation:",
					  value: 40,
					  required: false,
					  smallDelta:1,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
				      constraints: {pattern: "###"}
				}, "surgeAttenuation");
				
				//add children, startup and append to domNode
				mangroveDensityDiv.addChild(this.mangroveDensityBox);
				mangroveDensityDiv.addChild(this.mangroveDensityReductionBox);
				mangroveDensityDiv.addChild(this.mangroveMudDensityBox);
				mangroveDensityDiv.addChild(this.mangroveSurgeAttenuationBox);
				mangroveDensityDiv.startup();
				mangroveDensityPanel.addChild(mangroveDensityDiv);

			}

			this.createUnderwaterStructurePanel = function() {
				//creat div to hold all the content for underwaterStructures
				var underwaterStructurePanel = dijit.byId("underwaterStructurePanel")
				dojo.connect(underwaterStructurePanel, "onSelected", function() {
					if (self.underwaterStructureCheckBox.checked) {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
						self.habitatRangeSlider.set('value', [self.parameters.futureUnderwaterStructureSeaEdge, self.parameters.futureUnderwaterStructureShoreEdge]);
						self.setProfileSliderText('underwaterStructure', true);
					} else  {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
						self.setProfileSliderText('underwaterStructure', false);
					}
				});
				
				//Checkbox Widget
				this.underwaterStructureCheckBox = new CheckBox({
				    id: "underwaterStructureCheckBox",
				    checked: false,
					disabled: true,
				    value: "reefPresent",
				    name: "underwaterStructureCheckBox",
				    onClick: function(){
						self.onHabitatCheckboxChange('underwaterStructure', this);
					}
				}, "underwaterStructureCheckBox");

				var underwaterStructureLocationPanel = new TitlePane({
				    	title: 'Reef Location',
				    	id: 'underwaterStructureLocationPanel',
				    	toggleable: false
				    });
				underwaterStructurePanel.addChild(underwaterStructureLocationPanel);
				
				//Add Text Boxes
				var inputWidth = "width: 60px;";
				var inputHeight = "height: 34px;";
				var inputMargin = "margin: 2px;";

				//Create Table Div for text boxes
				var underwaterStructureTable = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_underwaterStructureTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_underwaterStructureTable"));

				this.underwaterStructureLocationBox = new NumberSpinner({
					  name: "cd_underwaterStructureLocationBox",
					  id: "cd_underwaterStructureLocationBox",
					  label:  "Distance from Shore: ",
					  value: 0,
					  required: true,
					  disabled: true,
					  style: "width:70px;" + inputHeight + inputMargin,
					 //class: textInput
				      //constraints: {pattern: "0.######"}
				}, "cd_underwaterStructureLocationBox");

				//add children, startup and append to domNode
				underwaterStructureTable.addChild(this.underwaterStructureLocationBox);
				underwaterStructureTable.startup();
				underwaterStructureLocationPanel.addChild(underwaterStructureTable);
				
				dojo.connect(this.underwaterStructureLocationBox.upArrowNode, 'onclick', function(){
					var value = dijit.byId('cd_underwaterStructureLocationBox').get('value');
					self.parameters.futureUnderwaterStructureSeaEdge = value;
					self.habitatRangeSlider.set('value', [self.parameters.futureUnderwaterStructureSeaEdge, self.parameters.futureUnderwaterStructureShoreEdge]);
				});

				var underwaterStructureHeightPanel = new TitlePane({
				    	title: 'Structure Characteristics',
				    	id: 'underwaterStructureHeightPanel',
						style: 'margin-top: 10px;',
				    	toggleable: false
				    });
				underwaterStructurePanel.addChild(underwaterStructureHeightPanel);

				//Create Table Div for text boxes
				var underwaterStructureCharsTable = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_underwaterStructureCharsTable",
				  customClass:"labelsAndValues"
				});

				var underwaterStructureType = new DropDownMenu({ style: "display: none;"});
					domClass.add(underwaterStructureType.domNode, "claro");
				
				var menuItem1 = new MenuItem({
					label: "Reef Dome",
					onClick: function(){
						self.underwaterStructureTypeButtonOnChange(this.label);
					}
				});
				underwaterStructureType.addChild(menuItem1);
				
				var menuItem2 = new MenuItem({
					label: "Trapezoidal",
					onClick: function(){
						self.underwaterStructureTypeButtonOnChange(this.label);
					}
				});
				underwaterStructureType.addChild(menuItem2);

				this.underwaterStructureTypeButton = new ComboButton({
					label: "Structure Type",
					name: "underwaterStructureTypeButton",
					dropDown: underwaterStructureType,
					id: "underwaterStructureTypeButton",
					disabled: true
				});
				
				this.underwaterStructureHeightBox = new NumberSpinner({
					  name: "cd_underwaterStructureHeightBox",
					  id: "cd_underwaterStructureHeightBox",
					  label:  "Height: ",
					  value: 1,
					  required: false,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin
				      //constraints: {pattern: "0.######"}
				}, "cd_underwaterStructureHeightBox");

				this.underwaterStructureBaseWidthBox = new NumberSpinner({
					  name: "cd_underwaterStructureBaseWidthBox",
					  id: "cd_underwaterStructureBaseWidthBox",
					  label:  "Base Width: ",
					  value: 3,
					  required: false,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin
				      //constraints: {pattern: "0.######"}
				}, "cd_underwaterStructureBaseWidthBox");
				
				this.underwaterStructureCrestWidthBox = new NumberSpinner({
					  name: "cd_underwaterStructureCrestWidthBox",
					  id: "cd_underwaterStructureCrestWidthBox",
					  label:  "Crest Width: ",
					  value: 0,
					  required: false,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin
				      //constraints: {pattern: "0.######"}
				}, "cd_underwaterStructureCrestWidthBox");

				//add children, startup and append to domNode
				underwaterStructureCharsTable.addChild(this.underwaterStructureTypeButton);
				underwaterStructureCharsTable.addChild(this.underwaterStructureHeightBox);
				underwaterStructureCharsTable.addChild(this.underwaterStructureBaseWidthBox);
				underwaterStructureCharsTable.addChild(this.underwaterStructureCrestWidthBox);
				//underwaterStructureCharsTable.addChild(this.underwaterStructureReefPresentButton);
				underwaterStructureCharsTable.startup();
				underwaterStructureHeightPanel.addChild(underwaterStructureCharsTable);
				//this.underwaterStructureReefPresentButton.set('label', 'No');
				this.underwaterStructureTypeButton.set('label', 'Reef Dome');
				dojo.style('widget_cd_underwaterStructureCrestWidthBox', 'display', 'none');
				dojo.query("label[for=cd_underwaterStructureCrestWidthBox]").style('display', 'none');				
							
			}
			
			this.underwaterStructureTypeButtonOnChange = function(label) {
				this.underwaterStructureTypeButton.set("label", label);
				if (label == 'Trapezoidal') {
					this.underwaterStructureCrestWidthBox.set('disabled', false);
					dojo.style('widget_cd_underwaterStructureCrestWidthBox', 'display', 'inline-block');
					dojo.query("label[for=cd_underwaterStructureCrestWidthBox]").style('display', 'block');
				} else {
					this.underwaterStructureCrestWidthBox.set('disabled', true);
					dojo.style('widget_cd_underwaterStructureCrestWidthBox', 'display', 'none');
					dojo.query("label[for=cd_underwaterStructureCrestWidthBox]").style('display', 'none');
				}
			}
			
			this.createStructurePanel =  function() {
				var structurePanel = dijit.byId("structurePanel")
				dojo.connect(structurePanel, "onSelected", function() {
					if (self.underwaterStructureCheckBox.checked) {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
						//self.habitatRangeSlider.set('value', [self.parameters.futureUnderwaterStructureSeaEdge, self.parameters.futureUnderwaterStructureShoreEdge]);
					} else  {
						domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
						domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
					}
				});
				
				//Checkbox Widget
				this.structureCheckbox = new CheckBox({
				    id: "structureCheckBox",
				    checked: false,
					disabled: false,
				    value: "structurePresent",
				    name: "structureCheckBox",
				    onChange: function(){
						self.onHabitatCheckboxChange('underwaterStructure', this);
					}
				}, "structureCheckBox");

				var structureLocationPanel = new TitlePane({
				    	title: 'Structure Location',
				    	id: 'structureLocationPanel',
				    	toggleable: false
				    });
				structurePanel.addChild(structureLocationPanel);

				//Add Text Boxes
				var inputWidth = "width: 60px;";
				var inputHeight = "height: 34px;";
				var inputMargin = "margin: 2px;";

				//Create Table Div for text boxes
				var structureTable = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_structureTable",
				  customClass:"labelsAndValues"
				}, dojo.byId("cd_structureTable"));

				this.structureLocationBox = new NumberSpinner({
					  name: "cd_structureLocationBox",
					  id: "cd_structureLocationBox",
					  label:  "Location: ",
					  value: 0,
					  required: true,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin,
					 //class: textInput
				      //constraints: {pattern: "0.######"}
				}, "cd_structureLocationBox");

				//add children, startup and append to domNode
				structureTable.addChild(this.structureLocationBox);
				structureTable.startup();
				structureLocationPanel.addChild(structureTable);
				
				dojo.connect(this.structureLocationBox.upArrowNode, 'onclick', function(){
					var value = dijit.byId('cd_structureLocationBox').get('value');
					//self.parameters.futureUnderwaterStructureSeaEdge = value;
					//self.habitatRangeSlider.set('value', [self.parameters.futureUnderwaterStructureSeaEdge, self.parameters.futureUnderwaterStructureShoreEdge]);
				});

				var structureHeightPanel = new TitlePane({
				    	title: 'Structure Characteristics',
				    	id: 'structureHeightPanel',
				    	toggleable: false
				    });
				structurePanel.addChild(structureHeightPanel);

				//Create Table Div for text boxes
				var structureCharsTable = new dojox.layout.TableContainer({
				  cols: 1,
				  id: "cd_structureCharsTable",
				  customClass:"labelsAndValues"
				});
				
				var structureType = new DropDownMenu({ style: "display: none;"});
					domClass.add(structureType.domNode, "claro");
				
				var menuItem1 = new MenuItem({
						label: "Levee",
						onClick: function(){
							//this.parameters.windWaveBtnLabel = this.label;
							self.structureTypeButton.set("label", this.label);
							self.structureSlopeBox.set('disabled', false);
						}
					});
					structureType.addChild(menuItem1);
				var menuItem2 = new MenuItem({
						label: "Seawall",
						onClick: function(){
							//this.parameters.windWaveBtnLabel = this.label;
							self.structureTypeButton.set("label", this.label);
							self.structureSlopeBox.set('disabled', true);
						}
					});
					structureType.addChild(menuItem2);

				this.structureTypeButton = new ComboButton({
					label: "Structure Type",
					name: "structureTypeButton",
					dropDown: structureType,
					id: "structureTypeButton",
					disabled: true
				});
				
				this.structureHeightBox = new NumberSpinner({
					  name: "cd_structureHeightBox",
					  id: "cd_structureHeightBox",
					  label:  "Height: ",
					  value: 8,
					  required: false,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin
				      //constraints: {pattern: "0.######"}
				}, "cd_structureHeightBox");

				this.structureSlopeBox = new NumberSpinner({
					  name: "cd_structureSlopeBox",
					  id: "cd_structureSlopeBox",
					  label:  "Slope: ",
					  value: 12,
					  required: false,
					  disabled: true,
					  style: inputWidth + inputHeight + inputMargin
				      //constraints: {pattern: "0.######"}
				}, "cd_structureSlopeBox");


				//add children, startup and append to domNode
				structureCharsTable.addChild(this.structureTypeButton);
				structureCharsTable.addChild(this.structureHeightBox);
				structureCharsTable.addChild(this.structureSlopeBox);
				structureCharsTable.startup();
				structureHeightPanel.addChild(structureCharsTable);
				this.structureTypeButton.set('label', 'Levee');
				
			}

			this.createMainContentPanel = function(){
				var self = this;
				var cpMain = dijit.byId("cd-main-pane");
				
				var profileDataLoadingDiv  = domConstruct.create("div", {id:"cd_dataLoadingDiv", style:"position: absolute; width:475px; height: 180px; top:55px; left:62px; z-index:1000; background: #ffffff; display:block;"});
				cpMain.domNode.appendChild(profileDataLoadingDiv);
				
				var profileDataLoadingContentDiv  = domConstruct.create("div", {id:"cd_dataLoadingContentDiv", style:"position: relative; width:175px; height: 100px; top: 50px; left: 145px; display:none"});
				var profileDataLoadingTextDiv  = domConstruct.create("div", {id:"cd_dataLoadingTextDiv", innerHTML: "Please wait a moment for the profile data to load...", style:"position: relative; width:100%; margin: 0px 0px 10px 0px;; color: #444; font-size: 17px; font-weight: bolder;"});
				profileDataLoadingContentDiv.appendChild(profileDataLoadingTextDiv);
				var findProfileProgressBarDiv  = domConstruct.create("div", {id:"findProfileProgressBar", style:"position: relative; width:100%; height:20px; text-align: center;"});
				profileDataLoadingContentDiv.appendChild(findProfileProgressBarDiv);
				profileDataLoadingDiv.appendChild(profileDataLoadingContentDiv);
				
				this.findProfileProgressBar = new ProgressBar({
					id: "findProfileProgressBar",
					maximum: 12,
					style: "width: 175px"
				}, "findProfileProgressBar");
				
				var profileNoDataHtml = "<center><img src='" + self.pluginDirectory + "/images/graph.png' class='errorImage'>Habitat Profile Graph</center>"
				var profileNoDataHtmlContentDiv  = domConstruct.create("div", {id:"cd_noDataHtmlContentDiv", innerHTML: profileNoDataHtml, style:"position: relative; width:190px; height: 40px; top:60px; left: 135px; display: block; color: #99999A; font-size: 17px; font-weight: bolder;"});
				profileDataLoadingDiv.appendChild(profileNoDataHtmlContentDiv);
				
				var sliderHTML = '<div id="cd_sliderInputText"> <b> * Use the sliders to set the area where <span id="habitatSliderText">habitat is to be modified</span> * </b> <div>'
				var sliderHelpDiv = domConstruct.create("div", {id:"cd_sliderHelp", innerHTML: sliderHTML, style:'position: relative; width: 455px; left: 50px; color: #E0E0E0; '});
				cpMain.domNode.appendChild(sliderHelpDiv);
				
				var profileSliderDiv  = domConstruct.create("div", {id:"cd_sliderDiv", style:"position: relative;"});
				cpMain.domNode.appendChild(profileSliderDiv);
				
				var habitatSliderOuterDiv = domConstruct.create("div", {id:"habitatSliderOuterDiv", style:"position:relative; width:100%; display:block;"});
				profileSliderDiv.appendChild(habitatSliderOuterDiv);
				var habitatSliderDiv  = domConstruct.create("div", {id:"cd_habitatSliderDiv"});
				habitatSliderOuterDiv.appendChild(habitatSliderDiv);
				
				var plotWidth = 525;
				var plotHeight = 250;
							  
				var plotDivHTML = "<div id='cd_plotDiv' style='position: relative; height: " + plotHeight + "px; width:" + plotWidth + "px;'></div>"
				    plotDivHTML += "<div id = 'cd_legendParent'>";
					plotDivHTML += "<div id='cd_legendDiv' class='cd_legend'></div>";
					plotDivHTML += "</div>";
				var plotDiv = domConstruct.create("div", {
						id:"cd_chartDiv",
						innerHTML: plotDivHTML,
						style:"position: relative; height: 100%; width:100%"
					});
				cpMain.domNode.appendChild(plotDiv);

				var scenarioButtonDiv  = domConstruct.create("div", {id:"cd_scenarioButtonDiv"});
				cpMain.domNode.appendChild(scenarioButtonDiv);			

			    this.runScenarioButton = new Button({
			        label: "Run Scenario",
					id: "runScenarioButton",
					disabled: true,
			        onClick: function(){
						// hack to prevent the slider from being hidden, weird layout jumping on click in Chrome
						/* if (domStyle.get("cd-main-pane", "overflow") == "hidden") {
							domStyle.set("cd-main-pane", "overflow", "visible");
						} */
						self.setWaveModelParameters();
						this.set("disabled", true);

						self.tc.selectChild(self.tabResults);
						self.resetResultsPane();
						
						domStyle.set("cd_resultsDataLoadingDiv", "display", "block");
						domStyle.set("cd_noResultsDataHtmlContentDiv", "display", "none");
						domStyle.set("cd_resultsDataLoadingContentDiv", "display", "block");
						if (self.parameters.debug) {
							self.debugServerMessagePane.set("content", "");
						}
						self.runWaveModel();
						
					}
			    });
				scenarioButtonDiv.appendChild(this.runScenarioButton.domNode);
			}
			
			this.createResultsContentPanel = function(){
				
				var self = this;
				
				this.resultsContentPanel = new ContentPane({
			    	id: 'cd-results-pane',
					style: 'overflow:hidden;'
			    });
			    this.resultsContentPanel.startup();
			    this.tabResults.addChild(this.resultsContentPanel);
				
				var resultsTitleDiv  = domConstruct.create("div", {id:"cd_resultsTitleDiv", innerHTML: "Modeled Wave Heights", style:"position: absolute;  left: 95px; top: 10px; width: 650px; color: #444; font-size: 16.5pt; font-weight:bolder; text-align: center; z-index: 10;"});
				this.resultsContentPanel.domNode.appendChild(resultsTitleDiv);
				
				var resultsSubTitleDiv  = domConstruct.create("div", {id:"cd_resultsSubTitleDiv", innerHTML: "", style:"position: absolute; left: 125px; top: 40px; width: 520px; color: #444; font-size: 11pt; text-align: center; z-index: 10;"});
				this.resultsContentPanel.domNode.appendChild(resultsSubTitleDiv);
				
				var resultsChartTypeContentDiv = domConstruct.create("div", { id:"resultsChartTypeContentDiv", style:"position:absolute; width: 200px; right: 35px; top: 12px; display:block; z-index: 10;"});
				this.resultsContentPanel.domNode.appendChild(resultsChartTypeContentDiv);	

				var resultsChartTypeComboLabel = domConstruct.create("div", {innerHTML: "Habitat:", id:"resultsChartTypeComboLabel", style: "position: relative; left: 55px; width: 75px; line-height: 18px;"});
				resultsChartTypeContentDiv.appendChild(resultsChartTypeComboLabel);
				
				var resultsChartType = new DropDownMenu({ style: "display: none;"});
				domClass.add(resultsChartType.domNode, "claro");
				
				var menuItem = new MenuItem({
					label: "Coral Reef",
					onClick: function(){
						self.resultsChartTypeButton.set("label", this.label);
					}
				});
				resultsChartType.addChild(menuItem);

				this.resultsChartTypeButton = new ComboButton({
					label: "Coral Reef",
					value: "coral",
					name: "resultsChartTypeButton",
					dropDown: resultsChartType,
					id: "resultsChartTypeButton",
					disabled: true
				});
				var resultsChartTypeDiv = domConstruct.create("div", { id:"resultsChartTypeDiv", style:"position: absolute; left: 100px; top: -7px;" });
				resultsChartTypeDiv.appendChild(this.resultsChartTypeButton.domNode);	
				resultsChartTypeContentDiv.appendChild(resultsChartTypeDiv);
				
				var resultsHabitatMessage = domConstruct.create("div", { id:"resultsHabitatMessage", style:"position: absolute;top: 40px; right: 40px; width: 155px; z-index: 15; text-align: right; color: #444;"  });
				this.resultsContentPanel.domNode.appendChild(resultsHabitatMessage);
				
				var resultsDataLoadingDiv  = domConstruct.create("div", {id:"cd_resultsDataLoadingDiv", style:"position: absolute; width:710px; height: 400px; top:22px; left: 77px; z-index:5; background: #ffffff; display:block;"});
				this.resultsContentPanel.domNode.appendChild(resultsDataLoadingDiv);
				
				var resultsDataLoadingContentDiv  = domConstruct.create("div", {id:"cd_resultsDataLoadingContentDiv", style:"position: relative; width:175px; height: 100px; top: 165px; left: 245px; display:none; text-align:center"});
				
				var resultsDataLoadingTextDiv  = domConstruct.create("div", {id:"cd_resultsDataLoadingTextDiv", innerHTML: "Please wait while the wave model runs...", style:"position: relative; width:100%; margin: 0px 0px 10px 0px;; color: #444; font-size: 17px; font-weight: bolder;"});
				resultsDataLoadingContentDiv.appendChild(resultsDataLoadingTextDiv);
				
				var waveModelProgressBarDiv  = domConstruct.create("div", {id:"waveModelProgressBar", style:"position: relative; width:100%; height:20px; text-align: center margin-top:10px"});
				resultsDataLoadingContentDiv.appendChild(waveModelProgressBarDiv);
				resultsDataLoadingDiv.appendChild(resultsDataLoadingContentDiv);
				
				this.waveModelProgressBar = new ProgressBar({
					id: "waveModelProgressBar",
					maximum: 45,
					style: "width: 175px, margin: 10px"
				}, "waveModelProgressBar");
				
				var resultsDataNoDataHtml = "<center><img src='" + self.pluginDirectory + "/images/graph.png' class='errorImage'>Results Graph</center>";
				var resultsDataNoDataHtmlContentDiv  = domConstruct.create("div", {id:"cd_noResultsDataHtmlContentDiv", innerHTML: resultsDataNoDataHtml, style:"position: relative; width:200px; height: 40px; top:170px; left:230px; display: block; color: #99999A; font-size: 17px; font-weight: bolder;"});
				resultsDataLoadingDiv.appendChild(resultsDataNoDataHtmlContentDiv);
				
				var plotWidth = 775;
				var plotHeight = 285; //originally 375px
							  
				var plotDivHTML = "<div id='cd_resultsPlotDiv' style='position: relative; height: " + plotHeight + "px; width:" + plotWidth + "px;'></div>"
				var plotDiv = domConstruct.create("div", {
						id:"cd_resultsChartDiv",
						innerHTML: plotDivHTML,
						style:"position: absolute; height: " + plotHeight + "px; width:100%; top: 35px;"
					});
				this.resultsContentPanel.domNode.appendChild(plotDiv);
				
				var plotDivHTML = "<div id='cd_resultsHabitatPlotDiv' style='position: relative; height: 175px; width:" + plotWidth + "px;'></div>"
 				    plotDivHTML += "<div id = 'cd_resultsHabitatLegendParent'>";
					plotDivHTML += "<div id='cd_resultsHabitatLegendDiv'></div>";
					plotDivHTML += "</div>";
				var plotDiv = domConstruct.create("div", {
						id:"cd_resultsHabitatChartDiv",
						innerHTML: plotDivHTML,
						style:"position: absolute; height:225px; width:100%; top:325px; left:18px"
					});
				this.resultsContentPanel.domNode.appendChild(plotDiv);
				
				var plotTextDiv = domConstruct.create("div", {
						id:"cd_resultsChartTextDiv",
						innerHTML: "The plot above shows modeled wave heights for present (grey) and future (dashed) habitat scenarios. Shaded regions show either a decrease (green) or increase (red) in wave heights under the future scenario.  The extent of each habitat is displayed in the plot below for reference. <b><i>Note:</i></b>  both plots share the same x-axis.",
						style:"position: absolute; height: 50px; top: 292px; width: 700px; left:77px; text-align:center"
				});
				this.resultsContentPanel.domNode.appendChild(plotTextDiv);
				
			}
			
			this.createResultsChart = function(data) {
				//Set Some Basic Plotting Parameters
				var xTitle = 'Distance from Shore ' + this.currentUnits.unitText;
				var yTitle = 'Wave Height ' + this.currentUnits.unitText;
				var axisFonts = '8pt';

				//Create Plot
				this.resultsChart = new Chart("cd_resultsPlotDiv");
				this.resultsChart.addPlot("futureWaveHeight", {type: Lines, tension: "S" });
				this.resultsChart.addPlot("presentWaveHeight", {type: Lines, tension: "S"});
				
				this.resultsChart.addPlot("grid", {
					type: Grid,
					hMajorLines: true,
					hMinorLines: false,
					vMajorLines: true,
					vMinorLines: true,
					majorHLine: { color: "#eeeeee", width: 1 },
					majorVLine: { color: "#eeeeee", width: 1 },
					minorHLine: { color: "#eeeeee", width: 1 },
					minorVLine: { color: "#eeeeee", width: 1 }
				});
				
				this.resultsChart.addPlot("waveHeightMin", {type: Areas, tension: "S"});
				this.resultsChart.addPlot("futureWaveHeightBetter", {type: Areas, tension: "S"});
				this.resultsChart.addPlot("futureWaveHeightWorse", {type: Areas, tension: "S"});
				
			    this.resultsChart.addAxis("x", {vertical: false, title: xTitle, font:'3pt', fontColor: "rgba(255,255,255,0.0)", titleFontColor: "white", titleGap: 0, min: _.first(data).x, max:_.last(data).x, titleOrientation: 'away', majorLabels: false, minorTicks: true, minorLabels: false, microTicks: false, majorTick: {color: "white", length: 0}, minorTick: {stroke: "white", length: 0}  });
			    this.resultsChart.addAxis("y", {vertical: true, title: yTitle, font:axisFonts, titleGap: 10, min: 0, max: 10, majorTickStep: 1, minorTickStep:0.5, minorLabels: false, microTicks: false, minorTick: {stroke: "white", length: 0} });
				
				this.resultsChart.addSeries("Present", data, {
					plot: "presentWaveHeight", 
					stroke: { color:"rgba(150,150,150,1)", width: 4 }
				});
				
				/* this.resultsChart.addSeries("Future", data, {
					plot: "futureWaveHeight", 
					stroke: {color:"rgba(207,66,60,1)", width: 2 },
					fill: "rgba(207,66,60,0.25)"
				}); */
				
				this.resultsChart.addSeries("Future", data, {
					plot: "futureWaveHeight", 
					stroke: { color:"rgba(75,75,75,1)", width: 0, style:"Dash" },
					outline: null
				});
				
				this.resultsChart.addSeries("waveHeightMin", data, {
					plot: "waveHeightMin", 
					stroke: {color:"rgba(182,211,137,1)", width: 2, style:"Dash" },
					fill: "rgba(255,255,255,1)",
					outline: null
				});
				
				this.resultsChart.addSeries("futureWaveHeightBetter", data, {
					plot: "futureWaveHeightBetter", 
					stroke: {color:"rgba(182,211,137,1)", width: 0, style:"Dash" },
					fill: "rgba(79,140,83,0.25)",
					outline: null
				});
				
				this.resultsChart.addSeries("futureWaveHeightWorse", data, {
					plot: "futureWaveHeightWorse", 
					stroke: {color:"rgba(211,156,137,1)", width: 2, style:"Dash" },
					fill: "rgba(211,156,137,0.5)",
					outline: null
				});

				this.resultsChart.render();
				
				this.resultsHabitatChart = new Chart("cd_resultsHabitatPlotDiv");			
				this.resultsHabitatChart.addPlot("presentHabitat", {type: Lines, tension: "S"});
				this.resultsHabitatChart.addPlot("elevation", {type: Areas, tension: "S"});
				this.resultsHabitatChart.addPlot("futureHabitat", {type: Areas});
				this.resultsHabitatChart.addPlot("underwaterStructure", {type: Areas});
				this.resultsHabitatChart.addPlot("waveHeight", {type: Lines, tension: "S"});
				this.resultsHabitatChart.addPlot("water", {type: Areas});
			    this.resultsHabitatChart.addAxis("x", {vertical: false, title: xTitle, font:axisFonts, titleGap: 2, min: _.first(data).x, max:_.last(data).x, titleOrientation: 'away',  });
			    this.resultsHabitatChart.addAxis("y", {vertical: true, title: yTitle, font:axisFonts, titleFontColor: "white", titleGap: 5, min: -40, max: 10, minorTicks: false, minorLabels: false, microTicks: false, majorTickStep: 10, minorTickStep: 2 });
				
				this.resultsHabitatChart.addSeries("Present", data, {
					plot: "waveHeight", 
					stroke: { color:"rgba(150,150,150,1)", width: 4 }
				});
				
				this.resultsHabitatChart.addSeries("Future", data, {
					plot: "waveHeight", 
					stroke: { color:"rgba(100,100,100,1)", width: 2, style:"Dash" },
					outline: null
				});
				
				this.resultsHabitatChart.addSeries("Reef (present)", [ {x:-100, y:-100}, {x:-101, y:-100} ], { 
					plot: "presentHabitat", 
					stroke: { color: "#1C4A85", width: 5, cap: "round"  }
				});
				
				this.resultsHabitatChart.addSeries("Reef (future)", [ {x:-100, y:-100}, {x:-101, y:-100} ], { 
					plot: "futureHabitat", 
					stroke: { color: "rgba(28, 74, 133, 0.35)", width: 0 }, 
					fill: "rgba(28, 74, 133, 0.35)"
				});
				
				this.resultsHabitatChart.addSeries("Mangrove (present)", [ {x:-100, y:-100}, {x:-101, y:-100} ], { 
					plot: "presentHabitat", 
					stroke: { color: "rgba(75, 96, 78, 1.0)", width: 5, cap: "round" }
					
				});
				
				this.resultsHabitatChart.addSeries("Mangrove (future)", [ {x:-100, y:-100}, {x:-101, y:-100} ], { 
					plot: "futureHabitat", 
					stroke: { color: "rgba(55, 128, 84, 0.5)", width: 0 }, 
					fill: "rgba(192, 201, 165, 0.5)" 
				});
				
				this.resultsHabitatChart.addSeries("Structure", [ {x:-100, y:-100}, {x:-101, y:-100} ], {
					plot: "underwaterStructure", 
					stroke: { color:"rgba(76, 86, 87, 0.5)", width: 0 }, 
					fill: "rgba(76, 86, 87, 0.5)"
				});
				
				this.resultsHabitatChart.render();
				
				this.resultsHabitatChartLegend = new Legend({ id: "cd_resultsHabitatLegend", "class": "cd_resultsLegend", chart: this.resultsHabitatChart, layoutAlign: "center"}, "cd_resultsHabitatLegendDiv");
				/* 
				this.resultsHabitatChart.removeSeries("Present");
				this.resultsHabitatChart.removeSeries("Future");
				this.resultsHabitatChart.removePlot("waveHeight");
				 */
				this.resultsHabitatChart.addSeries("Elevation", data, {
					plot: "elevation",
					stroke: {color:"#BFBF99", width: 1 }, 
					fill: "#fafad4"
				});
				
				this.resultsHabitatChart.addSeries("Water", data, {
					plot: "water", 
					stroke: {color:"#A9C5DA", width: 1 }, 
					fill: "rgba(169,197,218,0.1)"
				});
				
				this.resultsHabitatChart.render();
				
				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
				
			}
			
			this.setChartBackgroundToTransparent = function(chartId){
				var svgRects = dojo.query("#" + chartId + " svg rect");
				dojo.forEach(svgRects, function(rect){
					rect.setAttribute("fill-opacity", 0)
				})
				
			}
			
			this.resizeResultsChart = function(){
				this.resultsChart.resize(775,285);
				this.resultsHabitatChart.resize(775,175);
				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
			}
			
			this.resizeProfileChart = function(){
				var width = this.profileChart.dim.width;
				console.log(width);
				if (width != 525) {
					this.profileChart.resize(525,250);
					var innerPlotArea =  dojo.query('#cd_plotDiv svg rect')[1];
					var sliderWidth = number.round(innerPlotArea.width.baseVal.value,0) + 17;
					dijit.byId("cd_habitatSliderDiv").domNode.style.cssText = "position: relative !important; width: " + sliderWidth + "px !important; left: 45px !important;";
				}
			}
			
			this.onHabitatCheckboxChange = function(type, widget){
				switch (type) {
					case 'coral':
						if (widget.checked) {
							self.reefShoreEdgeBox.set('disabled', false); 
							self.reefSeaEdgeBox.set('disabled', false);
							
							self.frictionCoefficientLiveCoralBox.set('disabled', false); 
							self.frictionCoefficientReefFrameworkBox.set('disabled', false);
							
							if (self.waterTypeButton.label == "Sea-Level Rise") {
								self.reefResponseTypeButton.set('disabled', false);
							}
							if (self.reefResponseTypeButton.label == "Degrade") {
								self.reefResponseDegradationBox.set('disabled', false);
							}
							
							self.addFutureHabitatPlot("coral");					
							domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
							domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "block");
							self.habitatRangeSlider.set('value', [self.parameters.futureReefSeaEdge, self.parameters.futureReefShoreEdge]);
							self.setProfileSliderText(type, true);
							
						} else {
							self.reefShoreEdgeBox.set('disabled', true); 
							self.reefSeaEdgeBox.set('disabled', true);
							
							self.frictionCoefficientLiveCoralBox.set('disabled', true); 
							self.frictionCoefficientReefFrameworkBox.set('disabled', true); 

							self.reefResponseTypeButton.set('disabled', true);
							self.reefResponseDegradationBox.set('disabled', true);
							
							self.removeFutureHabitatPlot("coral");
							
							domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
							domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
							self.setProfileSliderText(type, false);
						}
						break;
					case 'mangrove':
						if (widget.checked) {
							self.mangroveShoreEdgeBox.set('disabled', false); 
							self.mangroveSeaEdgeBox.set('disabled', false);
							
							self.mangroveDensityBox.set('disabled', false); 
							self.mangroveDensityReductionBox.set('disabled', false);
							self.mangroveMudDensityBox.set('disabled', false); 
							self.mangroveSurgeAttenuationBox.set('disabled', false); 
							
							self.addFutureHabitatPlot("mangrove");
							domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
							domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "block");
							self.habitatRangeSlider.set('value', [self.parameters.futureMangroveSeaEdge, self.parameters.futureMangroveShoreEdge]);
							self.setProfileSliderText(type, true);
							
						} else {
							self.mangroveShoreEdgeBox.set('disabled', true); 
							self.mangroveSeaEdgeBox.set('disabled', true);
							
							self.mangroveDensityBox.set('disabled', true); 
							self.mangroveDensityReductionBox.set('disabled', true);
							self.mangroveMudDensityBox.set('disabled', true); 
							self.mangroveSurgeAttenuationBox.set('disabled', true); 							
							
							self.removeFutureHabitatPlot("mangrove");
							
							domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
							domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
							self.setProfileSliderText(type, false);
						}
						break;
					case 'underwaterStructure':
						if (widget.checked) {
							self.underwaterStructureLocationBox.set('disabled', false); 
							self.underwaterStructureHeightBox.set('disabled', false); 
							self.underwaterStructureBaseWidthBox.set('disabled', false);
							self.underwaterStructureTypeButton.set('disabled', false);
							
							if (self.underwaterStructureTypeButton.label == 'Trapezoidal') {
								self.underwaterStructureCrestWidthBox.set('disabled', false);
							}

							domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "block");
							domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
							
							self.addFutureHabitatPlot("underwaterStructure");

							self.habitatRangeSlider.set('value', [self.parameters.futureUnderwaterStructureSeaEdge, self.parameters.futureUnderwaterStructureShoreEdge]);
							self.setProfileSliderText(type, true);
							
						} else {
							self.underwaterStructureLocationBox.set('disabled', true); 
							self.underwaterStructureHeightBox.set('disabled', true); 
							self.underwaterStructureBaseWidthBox.set('disabled', true);
							self.underwaterStructureTypeButton.set('disabled', true);

							domStyle.set(self.habitatRangeSlider.sliderHandle,"display", "none");
							domStyle.set(self.habitatRangeSlider.sliderHandleMax,"display", "none");
							self.removeFutureHabitatPlot("underwaterStructure");
							self.setProfileSliderText(type, false);
						}
						break;
				}
			}
			
			this.setProfileSliderText = function(type, enabled){
				if (enabled) {
					switch (type) {
						case 'coral':
							dojo.style('cd_sliderInputText', 'color', '#1C4A85');
							dojo.byId('habitatSliderText').innerHTML = 'live corals are to be restored';
							break;
						case 'mangrove':
							dojo.style('cd_sliderInputText', 'color', '#4B604E');
							dojo.byId('habitatSliderText').innerHTML = 'mangrove is either restored or degraded';
							break;
						case 'underwaterStructure':
							dojo.style('cd_sliderInputText', 'color', '#959999');
							dojo.byId('habitatSliderText').innerHTML = 'an artificial reef structure will be placed';
							break;
					}
				} else {
					dojo.style('cd_sliderInputText', 'color', '#E0E0E0');
					dojo.byId('habitatSliderText').innerHTML = 'habitat is to be modified';
				}
			}
			
			this.createProfileChartSlider = function(data, widget){
				var self = widget;
				var habitatSliderDiv = dojo.byId("cd_habitatSliderDiv");
				var innerPlotArea =  dojo.query('#cd_plotDiv svg rect')[1];
				var sliderWidth = number.round(innerPlotArea.width.baseVal.value,0) + 17;
				var sliderLeft = number.round(innerPlotArea.x.baseVal.value,0);
				var sliderLeft = 45;
				
			    this.habitatRangeSlider = new dojox.form.HorizontalRangeSlider({
					name: "habitatRangeSlider",
					value: [_.first(data).x, _.last(data).x],
					minimum: _.first(data).x,
					maximum: _.last(data).x,
					intermediateChanges: true,
					showButtons:false,
					disabled: true,
					style: "position: relative !important; width: " + sliderWidth + "px !important; left: " + sliderLeft + "px !important;",
					onChange: function(value){
						var habitatPane = dijit.byId('habitatPane').get('selectedChildWidget').id;
						switch(habitatPane) {
							case 'coralReefPanel':
								self.onSliderChange('coral', value, this);
								break;
								
							case 'mangrovePanel':
								self.onSliderChange('mangrove', value, this);
								break;
								
							case 'underwaterStructurePanel':
								self.onSliderChange('underwaterStructure', value, this);
								break;
						}
					}
			    }, habitatSliderDiv);
			}
			
			this.onSliderChange = function(type, value, widget) {
				var seaEdge = value[0];
				var shoreEdge = value[1];
				if (!widget.disabled) {
					switch (type) {
						case 'coral':
							var seriesName = "Reef (future)";
							var reefMinEdge = self.parameters.currentReefSeaEdge;
							var reefMaxEdge =  self.parameters.currentReefShoreEdge;
							
							if (seaEdge < reefMinEdge) {
								widget.set('value', [reefMinEdge, shoreEdge]);
								seaEdge = reefMinEdge;
							}
							if (shoreEdge > reefMaxEdge) {
								widget.set('value', [seaEdge, reefMaxEdge]);
								shoreEdge = reefMaxEdge;
							}

							self.parameters.futureReefSeaEdge = seaEdge;
							dojo.byId("cd_reefSeaEdgeBox").value = number.round(seaEdge,0);
							self.parameters.futureReefShoreEdge = shoreEdge;
							dojo.byId("cd_reefShoreEdgeBox").value = number.round(shoreEdge,0);
							//var data = self.profileChart.getSeries(seriesName).data;
							//data[0].x = seaEdge;
							//data[1].x = shoreEdge;
							var data = self.currentHabitatData.coral;
							data = dojo.map(data, function(item){ 
								var obj = { x: item.x };
								obj.y = (item.y != null && item.x > seaEdge && item.x < shoreEdge) ? 0 : null;
								return obj;
							})
							break;
							
						case 'mangrove':
							var seriesName = "Mangrove (future)";
							var mangroveMinEdge = self.parameters.currentMangroveSeaEdge;
							var mangroveMaxEdge =  widget.get('maximum');
							
							if (seaEdge < mangroveMinEdge) {
								widget.set('value', [mangroveMinEdge, shoreEdge]);
								seaEdge = mangroveMinEdge;
							}
							if (shoreEdge > mangroveMaxEdge) {
								widget.set('value', [seaEdge, mangroveMaxEdge]);
								shoreEdge = mangroveMaxEdge;
							}

							self.parameters.futureMangroveSeaEdge = seaEdge;
							dojo.byId("cd_mangroveSeaEdgeBox").value = number.round(seaEdge,0);
							self.parameters.futureMangroveShoreEdge = shoreEdge;
							dojo.byId("cd_mangroveShoreEdgeBox").value = number.round(shoreEdge,0);
							
							var data = self.profileChart.getSeries(seriesName).data;
							data[0].x = seaEdge;
							data[1].x = shoreEdge;
							break;
							
						case 'underwaterStructure':
							var seriesName = "Underwater Structure";
							var underwaterStructureMinEdge = self.parameters.currentUnderwaterStructureSeaEdge;
							var underwaterStructureMaxEdge =  self.parameters.currentUnderwaterStructureShoreEdge;
							
							var index = this.utilities.findClosestValueInArray(seaEdge, self.currentHabitatData.distance).index;
							var coral = self.currentHabitatData.coral;
							if ( (coral[index]) && (coral[index].y != null) ) {
								var absent = dojo.map(dojo.filter(coral, function(item) { return item.y == null }), function(item){ return item.x });
								seaEdge = this.utilities.findClosestValueInArray(seaEdge, absent).value;
								widget.set('value', [seaEdge, shoreEdge]);
							}
							
							/* if (seaEdge < underwaterStructureMinEdge) {
								widget.set('value', [underwaterStructureMinEdge, shoreEdge]);
								seaEdge = underwaterStructureMinEdge;
							} */
							if (seaEdge > underwaterStructureMaxEdge) {
								widget.set('value', [underwaterStructureMaxEdge, shoreEdge]);
								shoreEdge = underwaterStructureMaxEdge;
							}

							self.parameters.futureUnderwaterStructureSeaEdge = seaEdge;
							self.parameters.futureUnderwaterStructureShoreEdge = seaEdge;
							dojo.byId("cd_underwaterStructureLocationBox").value = number.round(seaEdge,0);
							
							var data = self.profileChart.getSeries(seriesName).data;
							var elevation = self.currentHabitatData.elevation;
							//var index = this.utilities.findClosestValueInArray(seaEdge, elevation).index;
							var xs = dojo.map(elevation, function (item) { return Math.abs(item.x - seaEdge) });
							var index = dojo.indexOf(xs, _.min(xs));
							var offset = 5;
							
							data[0].x = elevation[index-offset].x;
							data[0].y = elevation[index-offset].y - 0.5;
							data[1].x = seaEdge;
							data[2].x = elevation[index+offset].x;
							data[2].y = elevation[index+offset].y - 0.5;
							break;
					}

					self.profileChart.updateSeries(seriesName, data);
					self.profileChart.render();
				}
			}
			
			this.createProfileChart = function(data, widget){
				var self = widget;
				
				//Set Some Basic Plotting Parameters
				var xTitle = 'Distance From Shore ' + this.currentUnits.unitText;
				var yTitle = this.currentUnits.unitTextFull + ' from Mean Sea Level';
				var axisFonts = '12pt';

				//Create Plot
				this.profileChart = new Chart("cd_plotDiv");
				this.profileChart.addPlot("currentReef", {type: Lines, tension: "S"});
				this.profileChart.addPlot("currentMangrove", {type: Lines, tension: "S"});
				this.profileChart.addPlot("currentUnderwaterStructure", {type: Lines});
				this.profileChart.addPlot("elevationArea", {type: Areas, tension: "S"});
				this.profileChart.addPlot("futureUnderwaterStructure", {type: Areas});
				this.profileChart.addPlot("futureReef", {type: Areas, tension: "S"});
				this.profileChart.addPlot("futureMangrove", {type: Areas, tension: "S"});
				this.profileChart.addPlot("waterArea", {type: Areas, tension: "S"});
			    this.profileChart.addAxis("x", {vertical: false, title: xTitle, font: axisFonts, titleGap: 2, min: _.first(data).x, max:_.last(data).x, titleOrientation: 'away',  });
			    this.profileChart.addAxis("y", {vertical: true, title: yTitle, font: axisFonts, titleGap: 5, min: 0, max: 10, minorTicks: true, minorLabels: false, microTicks: false, majorTickStep: 10, minorTickStep: 2});
				
				this.profileChart.addSeries("Coral Reef & Hard Bottom", data, { 
					plot: "currentReef", 
					stroke: { color: "#1C4A85", width: 5, cap: "round", join: "round"  }
				});
				
				this.profileChart.addSeries("Mangrove", data, { 
					plot: "currentMangrove", 
					stroke: { color: "#4B604E", width: 5, cap: "round", join: "round"  }
				});
						
				this.profileChart.addSeries("Artificial Reef Structure", [ {x:-100, y:-100}, {x:-101, y:-100} ], {
					plot: "currentUnderwaterStructure", 
					stroke: { color:"rgba(76, 86, 87, 0.5)", width: 5 }
				});

				this.profileChart.render();
				
				var legend = new Legend({ id: "cd_profileLegend", class: "cd_profileLegend", chart: this.profileChart, layoutAlign: "center"}, "cd_legendDiv");
				
				this.profileChart.removeSeries("Artificial Reef Structure");
				this.profileChart.removeSeries("Coral Reef & Hard Bottom");
				this.profileChart.removeSeries("Mangrove");
				
				this.profileChart.addSeries("Water", [ {x:-20000, y:0}, {x:20000, y:0} ], {
					plot: "waterArea", 
					stroke: {color:"#A9C5DA", width: 1 }, 
					fill: "rgba(169,197,218,0.1)"
				});
				
				this.profileChart.addSeries("Elevation", data, {
					plot: "elevationArea", 
					stroke: {color:"#BFBF99", width: 1 }, 
					fill: "#fafad4"
				});
				
				this.profileChart.render();
			}
			
			this.addFutureHabitatPlot = function(type) {
				var maxY = this.profileChart.getAxis("y").opt.max
				switch (type) {
					case "coral":
						var data = this.currentHabitatData.coral;
						//data = [ {x:_.first(data).x, y:0 }, {x:_.last(data).x, y:0 } ];
						data = dojo.map(data, function(item){ var obj = { x: item.x }; obj.y = (item.y != null) ? 0 : item.y; return obj })
						var plotName = "Reef (future)";
						var plot = "futureReef"; 
						var color = "rgba(28, 74, 133, 0.35)";
						var width = 0; 
						var fill = "rgba(28, 74, 133, 0.35)"; 
						break;
					
					case "mangrove": 
						var data = this.currentHabitatData.mangrove;
						data = [ {x:_.first(data).x, y:maxY }, {x:_.last(data).x, y:maxY } ];
						var plotName = "Mangrove (future)";
						var plot = "futureMangrove"; 
						var color = "rgba(192, 201, 165, 0.5)"; 
						var width = 0; 
						var fill = "rgba(192, 201, 165, 0.5)";
						break;
					
					case "underwaterStructure":
						var data = this.futureHabitatData.underwaterStructure;
						data[1].y = 0;
						var plotName = "Underwater Structure";
						var plot = "futureUnderwaterStructure"; 
						var color = "rgba(76, 86, 87, 0.35)"; 
						var width = 3; 
						var fill = "rgba(76, 86, 87, 0.35)";
						break;
				}
				
				this.profileChart.addSeries(plotName, data, {
					plot: plot, 
					stroke: { 
						color: color, 
						width: width 
					},
					fill: fill
				});
				this.profileChart.render();
			}
			
			this.removeFutureHabitatPlot = function(type) {
				switch (type) {
					case "coral":
						var name = "Reef (future)";
						this.futureHabitatData.coral = this.profileChart.getSeries(name).data;
						break;
						
					case "mangrove":
						var name = "Mangrove (future)";
						this.futureHabitatData.mangrove = this.profileChart.getSeries(name).data;
						break;
						
					case "underwaterStructure":
						var name = "Underwater Structure";
						this.futureHabitatData.underwaterStructure = this.profileChart.getSeries(name).data;
						break;
				}
				
				this.profileChart.removeSeries(name);
				this.profileChart.render();
			}

			this.removeResultsHabitatPlots = function(type) {
				this.resultsHabitatChart.removeSeries("Present");
				this.resultsHabitatChart.removeSeries("Future");
				this.resultsHabitatChart.removeSeries("Elevation");
				this.resultsHabitatChart.removeSeries("Water");
				this.resultsHabitatChart.removeSeries("Reef (present)");
				this.resultsHabitatChart.removeSeries("Reef (future)");
				this.resultsHabitatChart.removeSeries("Mangrove (present)");
				this.resultsHabitatChart.removeSeries("Mangrove (future)");
				this.resultsHabitatChart.removeSeries("Structure");
				
				this.resultsHabitatChart.render();
				this.resultsHabitatChartLegend.refresh();
				
				var data = []
				var range = 2000 
				for (var i = 0; i <= range; i++) {
					data.push({ "x": i-(range/2), "y": -100 });
				}
				this.addResultsHabitatPlot("wave_present", data);
				this.resultsHabitatChart.render();
			}
			
			this.addResultsHabitatPlot = function(type, data) {
				switch (type) {
					case "wave_present":
						var plotName = "Present";
						var plot = "waveHeight"; 
						var color = "rgba(150,150,150,1)";
						var width = 4;
						break;
					case "wave_future":
						var plotName = "Future";
						var plot = "waveHeight"; 
						var color = "rgba(100,100,100,1)";
						var width = 2;
						var style = "Dash";
						var outline = null;
						break;
					case "coral_present":
						var plotName = "Reef (present)";
						var plot = "presentHabitat"; 
						var color = "#1C4A85";
						var width = 5;
						break;
					case "coral_future":
						var plotName = "Reef (future)";
						var plot = "futureHabitat"; 
						var color = "rgba(28, 74, 133, 0.35)";
						var width = 0; 
						var fill = "rgba(28, 74, 133, 0.35)"; 
						break;
					case "mangrove_present": 
						var plotName = "Mangrove (present)";
						var plot = "presentHabitat"; 
						var color = "rgba(75, 96, 78, 1.0)"; 
						var width = 5; 
						break;
					case "mangrove_future": 
						var plotName = "Mangrove (future)";
						var plot = "futureHabitat"; 
						var color = "rgba(55, 128, 84, 0.5)"; 
						var width = 0; 
						var fill = "rgba(55, 128, 84, 0.5)";
						break;
					case "underwaterStructure":
						var plotName = "Structure";
						var plot = "underwaterStructure"; 
						var color = "rgba(76, 86, 87, 0.35)"; 
						var width = 0; 
						var fill = "rgba(76, 86, 87, 0.35)";
						break;
					case "elevation":
						var plotName = "Elevation";
						var plot = "elevation";
						var color = "#BFBF99"; 
						var width = 1; 
						var fill = "#fafad4";
						break;
					case "water":
						var plotName = "Water";
						var plot = "water";
						var color = "#A9C5DA"; 
						var width = 1; 
						var fill = "rgba(169,197,218,0.1)";
						break;
				}
				
				var params = {
					plot: plot, 
					stroke: { 
						color: color, 
						width: width 
					}
				};
				if (fill) { params.fill = fill; }
				if (style) { params.stroke.style = style; }
				if (outline) { params.outline = outline; }
				
				this.resultsHabitatChart.addSeries(plotName, data, params);
			}
			
			this.renderResultsHabitatPlot = function() {
				var data = [{"x":-100, "y":-100}, {"x":-101, "y":-101}];
				//this.addResultsHabitatPlot("wave_present", data);
				this.addResultsHabitatPlot("wave_future", data);
				this.addResultsHabitatPlot("coral_present", data);
				if (this.coralReefCheckBox.checked) { this.addResultsHabitatPlot("coral_future", data); }
				this.addResultsHabitatPlot("mangrove_present", data);
				if (this.mangroveCheckBox.checked) { this.addResultsHabitatPlot("mangrove_future", data); }
				if (this.underwaterStructureCheckBox.checked) { this.addResultsHabitatPlot("underwaterStructure", data); }
				
				this.resultsHabitatChart.render();
				this.resultsHabitatChartLegend.refresh();

				this.addResultsHabitatPlot("elevation", data);
				this.addResultsHabitatPlot("water", data );
				
				this.resultsHabitatChart.render();

				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
			}
			
			this.addInterfaceTooltips = function() {
				dojo.addClass(dojo.body(), "claro");
				this.runScenarioButtonTooltip = new Tooltip({
			        connectId: ["runScenarioButton"],
			        label: "Run model with current parameters.",
					showDelay: 200
			    });
				
				this.coralReefCheckBoxTooltip = new Tooltip({
			        connectId: ["coralReefPanel_button_title"],
			        label: "(Disabled) No coral reef habitat available to modify.",
					showDelay: 200
			    });
				
				this.mangroveCheckBoxTooltip = new Tooltip({
			        connectId: ["mangrovePanel_button_title"],
			        label: "(Disabled) No mangrove habitat available to modify.",
					showDelay: 200
			    });
				
				this.underwaterStructureCheckBoxTooltip = new Tooltip({
			        connectId: ["underwaterStructurePanel_button_title"],
			        label: "(Disabled) No profile to place an underwater structure.",
					showDelay: 200
			    });
				
				this.chooseRegionButtonTooltip = new TooltipDialog({
					id: 'chooseRegionButtonTooltip',
					style: "width: 155px;",
					content: "1. Click to select a region<br>&nbsp;&nbsp;&nbsp;&nbsp;for analysis.",
				});
				this.chooseRegionButtonTooltip.startup();
				

				dojo.connect(dojo.byId('regionButton'), 'onclick', function(){
					popup.close(self.chooseRegionButtonTooltip);
				});
				
				this.chooseProfileButtonTooltip = new TooltipDialog({
					id: 'chooseProfileButtonTooltip',
					style: "width: 135px;",
					content: "2. Click to set a profile<br>&nbsp;&nbsp;&nbsp;&nbsp;for analysis."
				});
				this.chooseProfileButtonTooltip.startup();

				dojo.connect(dojo.byId('chooseProfileButton'), 'onclick', function(){
					popup.close(self.chooseProfileButtonTooltip);
				});
				
				this.chooseHabitatButtonTooltip = new TooltipDialog({
					id: 'chooseHabitatButtonTooltip',
					style: "width: 175px;",
					content: "3. Click to select a habitat<br>&nbsp;&nbsp;&nbsp;&nbsp;scenario for analysis."
				});
				this.chooseHabitatButtonTooltip.startup();
				
				dojo.connect(dojo.byId('habitatScenarioButton'), 'onclick', function(){
					popup.close(self.chooseHabitatButtonTooltip);
				});
			}
			
			this.adjustInterfaceTooltip = function(id, xOffset, yOffset, top) {
				var tooltipPosition = domGeom.position(dojo.byId(id));
				domStyle.set(self[id]._popupWrapper, { "top": (tooltipPosition.y - yOffset) + "px", "left":( tooltipPosition.x + xOffset) + "px"});
				domStyle.set(self[id].connectorNode, { "top": top + "px", "left":"-9px", "backgroundPosition": "-53px 0px" })
			}
			
			this.regionSelect = function(region, key){
				this.parameters.subRegion = region;
				this.parameters.subRegionIndex = key;
				this.parameters.currentWindow = 1;
				
				var self = this;
				
				//Load GIS Layers
				if (!this.parameters.layersLoaded){
					var layers = this.loadLayers(this);
				}
				this.setExtent(key);
				
				//this.unitsButton.set("disabled", false);
				this.chooseProfileButton.set("disabled", false);
				
				popup.open({
					popup: this.chooseProfileButtonTooltip,
					around: dojo.byId('chooseProfileButton'),
					orient: ["after"]
				});
				this.adjustInterfaceTooltip("chooseProfileButtonTooltip", 15, 10, 15);
				
			} //end region select handling

			this.loadLayers = function(){
				
				this.habitatLayer = new ArcGISDynamicMapServiceLayer(this._data[this.parameters.regionIndex].layers.mapLayers.url, { 
				  "id": "habitatLayer",
				  "opacity": 0.5
				});
				var visibleLayers = lang.clone(this._data[this.parameters.regionIndex].layers.mapLayers.habitatLayerIds);
				this.habitatLayer.setVisibleLayers(visibleLayers);
				this._map.addLayer(this.habitatLayer)
				
				this.parameters.layersLoaded = true;
					
			}
			
			this.setExtent = function(key){
				newExtent = new esri.geometry.Extent({
					"ymax": this._data[this.parameters.regionIndex].extents.subRegions[key].extent.ymax,
					"xmax": this._data[this.parameters.regionIndex].extents.subRegions[key].extent.xmax,
					"ymin": this._data[this.parameters.regionIndex].extents.subRegions[key].extent.ymin,
					"xmin": this._data[this.parameters.regionIndex].extents.subRegions[key].extent.xmin,
					"spatialReference": {
						"wkid": 4326
					}
				});
				this._map.setExtent(newExtent);
				
			} //end setExtent

			this.setClickLocation = function(id) {
				this.habitatScenarioTitleDiv.innerHTML = '';
				this.resetHabitatInterface();
				this.disableInterfaceInputs();
				this.resetResultsPane();
				dojo.style(dojo.byId(id), "display", "none");
				dojo.byId("cd_noResultsDataHtmlContentDiv").innerHTML = "<center><img src='" + self.pluginDirectory + "/images/graph.png' class='errorImage'>Results Graph</center>";
				
				if (this.profileTransect){
					this.profileTransect.hide();
				}
				
				var mapLayers = this._data[this.parameters.regionIndex].layers.mapLayers;
				if (!this.profilePolygon){
					var profilePolygonSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,0,0,0.5]),3), new dojo.Color([255,190,190,0.0]));
					this.profilePolygon = new FeatureLayer(mapLayers.url + "/" + mapLayers.profilePolygonLayerId, {
						id: 'cd_profilePolygon',
						outFields: ["*"],
						visible: false
					});
					this.profilePolygon.setRenderer(new esri.renderer.SimpleRenderer(profilePolygonSymbol));
					this._map.addLayer(this.profilePolygon);
					
					var visibleLayers = this.habitatLayer.visibleLayers;
					visibleLayers.push(mapLayers.profilePolygonLayerId);
					this.habitatLayer.setVisibleLayers(visibleLayers);
					
					dojo.connect(this.profilePolygon, "onClick", function(evt) {
						domStyle.set(dojo.byId(id), "display","block");
						dojo.byId("cd_noDataHtmlContentDiv").innerHTML = "<center><img src='" + self.pluginDirectory + "/images/graph.png' class='errorImage'>Habitat Profile Graph</center>";
						domStyle.set("cd_noDataHtmlContentDiv", "display", "none");
						domStyle.set("cd_dataLoadingContentDiv", "display","block");
						domStyle.set("cd_dataLoadingDiv", "display","block");
						domStyle.set("profilePolygonTooltipDiv", "display", "none");
						this.hide();
						var visibleLayers = lang.clone(self._data[self.parameters.regionIndex].layers.mapLayers.habitatLayerIds);
						self.habitatLayer.setVisibleLayers(visibleLayers);
						
						var params = {
							"Region": self._data[self.parameters.regionIndex].location.replace(' ', '_'),
							"Input_Location": evt.mapPoint.x + "," + evt.mapPoint.y,
							"Filter_Number": self._data[self.parameters.regionIndex].profilePointFilterNumber
						}
						gp_FindClosestProfile = new esri.tasks.Geoprocessor(self.gpFindProfileUrl);
						gp_FindClosestProfile.submitJob(params, function(jobInfo) {
							if (jobInfo.jobStatus == 'esriJobSucceeded') {	
								gp_FindClosestProfile.getResultData(jobInfo.jobId, "Output_Profile", function(result) {
									self.findProfileProgressBar.set({ "value": self.findProfileProgressBar.get("maximum") });
									self.processProfileData(result.value);
									self.loadProfileData();
									self.loadTransectLayer();
									dojo.style("cd_dataLoadingDiv", "display", "none");
									self.findProfileProgressBar.set({ "value": 0 });
									
									self.habitatScenarioButton.set("disabled", false);
									self.coralReefCheckBoxTooltip.set("label", "(Disabled) No habitat scenario chosen.");
									self.mangroveCheckBoxTooltip.set("label", "(Disabled) No habitat scenario chosen.");
									self.underwaterStructureCheckBoxTooltip.set("label", "(Disabled) No habitat scenario chosen.");
									
									popup.open({
										popup: self.chooseHabitatButtonTooltip,
										around: dojo.byId('habitatScenarioButton'),
										orient: ["after"]
									});
									self.adjustInterfaceTooltip("chooseHabitatButtonTooltip", 15, 10, 15);
								});
							} else if (jobInfo.jobStatus == 'esriJobFailed') {
								self.findProfileProgressBar.set({ "value": self.findProfileProgressBar.get("maximum") });
								if (self.parameters.debug) {
									self.showDebugMessages(jobInfo);
								}
								self.disableInterfaceInputs();
								dojo.byId("cd_noDataHtmlContentDiv").innerHTML = "<center><img src='" + self.pluginDirectory + "/images/error.png' class='errorImage'>No data to plot</center>";
								dojo.style("cd_noDataHtmlContentDiv", "display", "block");
								dojo.style("cd_dataLoadingContentDiv", "display","none");
								dojo.style("cd_dataLoadingDiv", "display", "block");
								self.findProfileProgressBar.set({ "value": 0 });
								self.runScenarioButton.set("disabled", false);
							}
						}, 
						function(jobInfo) {
							if (self.parameters.debug) {
								self.showDebugMessages(jobInfo);
							}
							self.advanceProgressBar("findProfile");
						});
					});
					
					dojo.connect(this.profilePolygon, "onLoad", function(){
						this.show();
						//self._map.setExtent(this.fullExtent);
						self.setExtent(self.parameters.subRegionIndex);
					});
					
					dojo.connect(this.profilePolygon, "onMouseMove", function(evt) {
						self.showProfilePolygonToolTip(evt);
					});
					
					dojo.connect(this.profilePolygon, "onMouseOut", function(evt) {
						domStyle.set("profilePolygonTooltipDiv", "display", "none");
					});
					
				} else {
					var visibleLayers = lang.clone(mapLayers.habitatLayerIds);
					visibleLayers.push(mapLayers.profilePolygonLayerId);
					this.habitatLayer.setVisibleLayers(visibleLayers);
					//this._map.setExtent(this.profilePolygon.fullExtent);
					self.setExtent(self.parameters.subRegionIndex);
					this.profilePolygon.show();
				}
			
			}
			
			this.loadTransectLayer = function() {
				var mapLayers = this._data[this.parameters.regionIndex].layers.mapLayers;
				if (!this.profileTransect){
					var profileTransectSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([205,60,83,0.75]),4);
					this.profileTransect = new FeatureLayer(mapLayers.url + "/" + mapLayers.profileTransectLayerId, {
						id: 'cd_profileTransect',
						outFields: ["*"],
						visible: true
					});
					this.profileTransect.setRenderer(new esri.renderer.SimpleRenderer(profileTransectSymbol));
					this.profileTransect.setDefinitionExpression("Id = '" + this.parameters.profileId + "'");
					
					this.profileTransectOnUpdateHandler = dojo.connect(this.profileTransect, "onUpdateEnd", function(){
						self._map.setExtent(this.graphics[0].geometry.getExtent().expand(1), true);
						dojo.disconnect(self.profileTransectOnUpdateHandler);
					});
					
					this._map.addLayer(this.profileTransect);
				} else {
					this.profileTransectOnUpdateHandler = dojo.connect(this.profileTransect, "onUpdateEnd", function(){
						self._map.setExtent(this.graphics[0].geometry.getExtent().expand(1), true);
						dojo.disconnect(self.profileTransectOnUpdateHandler);
					});
					this.profileTransect.setDefinitionExpression("Id = '" + this.parameters.profileId + "'");
					this.profileTransect.show();
				}
				
				var visibleLayers = lang.clone(mapLayers.habitatLayerIds);
				visibleLayers.push(mapLayers.profileTransectLayerId);
				
				var layerDefinitions = [];
				layerDefinitions[1] = "Id < 0";
				this.habitatLayer.setLayerDefinitions(layerDefinitions);
				this.habitatLayer.setVisibleLayers(visibleLayers);
			}
			
			this.showProfilePolygonToolTip = function(evt){
				var sidebarWidth = dojo.position(dojo.query(".sidebar")[0]).w;
				var px = evt.clientX - sidebarWidth;
				var py = evt.clientY - sidebarWidth;
				domStyle.set("profilePolygonTooltipDiv", { left: (px + 15) + "px", top: (py) + "px" });
				domStyle.set("profilePolygonTooltipDiv", "display", "block");
			}
			
			this.enableInterfaceInputs = function() {
				this.coralReefCheckBox.set("disabled", false);
				this.mangroveCheckBox.set("disabled", false);
				this.underwaterStructureCheckBox.set("disabled", false);
				this.habitatScenarioButton.set("disabled", false);
				this.habitatRangeSlider.set("disabled", false);
				this.runScenarioButton.set("disabled", false);
				this.windWaveButton.set("disabled", false);
				this.windButton.set("disabled", false);
				this.waveButton.set("disabled", false);
				this.wavePeriodBox.set("disabled", false);
				this.waveHeightBox.set("disabled", false);
				this.hurricaneButton.set("disabled", false);
				this.waterTypeButton.set("disabled", false);
				this.seaLevelRiseButton.set("disabled", false);
				this.tideLevelButton.set("disabled", false);
			}
			
			this.disableInterfaceInputs = function() {
				this.coralReefCheckBox.set("disabled", true);
				this.mangroveCheckBox.set("disabled", true);
				this.underwaterStructureCheckBox.set("disabled", true);
				this.habitatScenarioButton.set("disabled", true);
				this.habitatRangeSlider.set("disabled", true);
				this.runScenarioButton.set("disabled", true);
				this.windWaveButton.set("disabled", true);
				this.windButton.set("disabled", true);
				this.waveButton.set("disabled", true);
				this.wavePeriodBox.set("disabled", true);
				this.waveHeightBox.set("disabled", true);
				this.hurricaneButton.set("disabled", true);
				this.waterTypeButton.set("disabled", true);
				this.seaLevelRiseButton.set("disabled", true);
				this.tideLevelButton.set("disabled", true);
			}
			
			this.resetHabitatInterface = function() {
				this.coralReefCheckBox.set("checked", false);
				this.mangroveCheckBox.set("checked", false);
				this.underwaterStructureCheckBox.set("checked", false);
				dojo.byId("cd_reefSeaEdgeBox").value = 0;
				dojo.byId("cd_reefShoreEdgeBox").value = 0;
				dojo.byId("cd_mangroveSeaEdgeBox").value = 0;
				dojo.byId("cd_mangroveShoreEdgeBox").value = 0;
				dojo.byId("cd_underwaterStructureLocationBox").value = 0;
				domStyle.set(dijit.byId("coralReefPanel").getParent().id, "display","block");
				domStyle.set(dijit.byId("mangrovePanel").getParent().id, "display","block");
				domStyle.set(dijit.byId("underwaterStructurePanel").getParent().id, "display","block");
				dijit.byId('habitatPane').resize({h:370});
				this.coralReefCheckBoxTooltip.set("label", "(Disabled) No habitat scenario chosen.");
				this.mangroveCheckBoxTooltip.set("label", "(Disabled) No habitat scenario chosen.");
				this.underwaterStructureCheckBoxTooltip.set("label", "(Disabled) No habitat scenario chosen.");
				this.windWaveButton.set("label", "Oceanic");
				dojo.style("windContentDiv", "display", "none");
				dojo.style("waveContentDiv", "display", "block");
				dojo.style("hurricaneContentDiv", "display", "none");
				this.waveButton.set("label", "Storm");
				this.windButton.set("label", "Strong Storm");
				this.hurricaneButton.set("label", "Category 1");
				this.waterTypeButtonOnChange("Tide");
				//this.waterTypeButton.set("label", "Tide");
				this.tideLevelButton.set("label", "Mean Sea Level");
				this.seaLevelRiseButton.set("label", "Moderate");
				this.setProfileSliderText('', false);
				dijit.byId('habitatPane').selectChild('coralReefPanel');
			}
			
			this.updateInterfaceInputs = function(scenario){
				this.enableInterfaceInputs();
				this.resetHabitatData();
				switch(scenario) {
					case "Coral Reef":
						domStyle.set(dijit.byId("underwaterStructurePanel").getParent().id, "display","none");
						this.underwaterStructureCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Underwater Structure") !== "undefined") {
							this.onHabitatCheckboxChange('underwaterStructure', this.underwaterStructureCheckBox);
						}
						this.underwaterStructureCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("mangrovePanel").getParent().id, "display","none");
						this.mangroveCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Mangrove (future)") !== "undefined") {
							this.onHabitatCheckboxChange('mangrove', this.mangroveCheckBox);
						}
						this.mangroveCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("coralReefPanel").getParent().id, "display","block");
						dijit.byId('habitatPane').selectChild('coralReefPanel');
						if (this.currentHabitatData.coral) {
							this.coralReefCheckBox.set("disabled", false);
							this.coralReefCheckBox.set("checked", true);
							this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							this.coralReefCheckBoxTooltip.set("label", "Check to set a coral reef restoration scenario. Uncheck to run under current conditions.");
							this.coralReefCheckBoxTooltip.open("coralReefPanel_button_title");
						} else {
							this.coralReefCheckBox.set("disabled", true);
							this.coralReefCheckBox.set("checked", false);
							if (typeof this.profileChart.getSeries("Reef (future)") !== "undefined") {
								this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							}
							this.coralReefCheckBoxTooltip.set("label", "(Disabled) No coral reef habitat available to modify.");
						}
						
						this.waterTypeButton.set("label", "Tide");
						this.waterTypeButtonOnChange("Tide");
						this.waterTypeButton.set("disabled", true);
						break;
					case "Coral Reef & Sea Level Rise":
						domStyle.set(dijit.byId("underwaterStructurePanel").getParent().id, "display","none");
						this.underwaterStructureCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Underwater Structure") !== "undefined") {
							this.onHabitatCheckboxChange('underwaterStructure', this.underwaterStructureCheckBox);
						}
						this.underwaterStructureCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("mangrovePanel").getParent().id, "display","none");
						this.mangroveCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Mangrove (future)") !== "undefined") {
							this.onHabitatCheckboxChange('mangrove', this.mangroveCheckBox);
						}
						this.mangroveCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("coralReefPanel").getParent().id, "display","block");
						dijit.byId('habitatPane').selectChild('coralReefPanel');
						if (this.currentHabitatData.coral) {
							this.coralReefCheckBox.set("disabled", false);
							this.coralReefCheckBox.set("checked", true);
							this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							this.coralReefCheckBoxTooltip.set("label", "Check to set a coral reef restoration scenario. Uncheck to run under current conditions.");
							this.coralReefCheckBoxTooltip.open("coralReefPanel_button_title");
						} else {
							this.coralReefCheckBox.set("disabled", true);
							this.coralReefCheckBox.set("checked", false);
							if (typeof this.profileChart.getSeries("Reef (future)") !== "undefined") {
								this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							}
							this.coralReefCheckBoxTooltip.set("label", "(Disabled) No coral reef habitat available to modify.");
						}
						
						this.waterTypeButton.set("label", "Sea-Level Rise");
						this.waterTypeButtonOnChange("Sea-Level Rise");
						this.waterTypeButton.set("disabled", true);
						break;
					case "Coral Reef & Artificial Reef Structures":
						domStyle.set(dijit.byId("underwaterStructurePanel").getParent().id, "display","block");
						this.underwaterStructureCheckBox.set("checked", true);
						this.underwaterStructureCheckBox.set("disabled", false);
						this.underwaterStructureLocationBox.set('disabled', false);
						this.underwaterStructureLocationBox.set('value', this.currentHabitatData.underwaterStructure, false);
						this.underwaterStructureTypeButton.set("label", "Reef Dome");
						this.underwaterStructureTypeButton.set('disabled', true);
						this.underwaterStructureHeightBox.set('disabled', false); 
						this.underwaterStructureBaseWidthBox.set('disabled', false);
						this.addFutureHabitatPlot("underwaterStructure");
						this.underwaterStructureCheckBoxTooltip.set("label", "Check to place an artificial underwater structure.");
						
						domStyle.set(dijit.byId("mangrovePanel").getParent().id, "display","none");
						this.mangroveCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Mangrove (future)") !== "undefined") {
							this.onHabitatCheckboxChange('mangrove', this.mangroveCheckBox);
						}
						this.mangroveCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("coralReefPanel").getParent().id, "display","block");
						dijit.byId('habitatPane').selectChild('coralReefPanel');
						if (this.currentHabitatData.coral) {
							this.coralReefCheckBox.set("disabled", false);
							this.coralReefCheckBox.set("checked", true);
							this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							this.coralReefCheckBoxTooltip.set("label", "Check to set a coral reef restoration scenario. Uncheck to run under current conditions.");
							this.coralReefCheckBoxTooltip.open("coralReefPanel_button_title");
						} else {
							this.coralReefCheckBox.set("disabled", true);
							if (typeof this.profileChart.getSeries("Reef (future)") !== "undefined") {
								this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							}
							this.coralReefCheckBoxTooltip.set("label", "(Disabled) No coral reef habitat available to modify.");
						}
						
						this.waterTypeButton.set("label", "Tide");
						this.waterTypeButtonOnChange("Tide");
						this.waterTypeButton.set("disabled", true);
						break;
					case "Mangroves":
						domStyle.set(dijit.byId("underwaterStructurePanel").getParent().id, "display","none");
						this.underwaterStructureCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Underwater Structure") !== "undefined") {
							this.onHabitatCheckboxChange('underwaterStructure', this.underwaterStructureCheckBox);
						}
						this.underwaterStructureCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("coralReefPanel").getParent().id, "display","none");
						this.coralReefCheckBox.set("checked", false);
						if (typeof this.profileChart.getSeries("Reef (future)") !== "undefined") {
							this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
						}
						this.coralReefCheckBox.set("disabled", true);
						
						domStyle.set(dijit.byId("mangrovePanel").getParent().id, "display","block");
						dijit.byId('habitatPane').selectChild('mangrovePanel');
						if (this.currentHabitatData.mangrove) {
							this.mangroveCheckBox.set("disabled", false);
							this.mangroveCheckBox.set("checked", true);
							this.onHabitatCheckboxChange('mangrove', this.mangroveCheckBox);
							this.mangroveCheckBoxTooltip.set("label", "Check to set a mangrove restoration scenario. Uncheck to run under current conditions.");
							this.mangroveCheckBoxTooltip.open("mangrovePanel_button_title");
						} else {
							this.mangroveCheckBox.set("disabled", true);
							this.mangroveCheckBox.set("checked", false);
							if (typeof this.profileChart.getSeries("Mangrove (future)") !== "undefined") {
								this.onHabitatCheckboxChange('mangrove', this.mangroveCheckBox);
							}
							this.mangroveCheckBoxTooltip.set("label", "(Disabled) No mangrove habitat available to modify.");
						}
						
						this.waterTypeButton.set("label", "Tide");
						this.tideLevelButton.set("label", "Mean Higher High Water");
						this.waterTypeButtonOnChange("Tide");
						this.waterTypeButton.set("disabled", true);
						break;
					case "Coral Reef, Mangroves, & Artificial Reef Structures":
						domStyle.set(dijit.byId("underwaterStructurePanel").getParent().id, "display","block");
						this.underwaterStructureCheckBox.set("checked", true);
						this.underwaterStructureCheckBox.set("disabled", false);
						this.underwaterStructureLocationBox.set('disabled', false);
						this.underwaterStructureLocationBox.set('value', this.currentHabitatData.underwaterStructure, false);
						this.underwaterStructureTypeButton.set("label", "Reef Dome");
						this.underwaterStructureTypeButton.set('disabled', true);
						this.underwaterStructureHeightBox.set('disabled', false); 
						this.underwaterStructureBaseWidthBox.set('disabled', false);
						this.addFutureHabitatPlot("underwaterStructure");
						this.underwaterStructureCheckBoxTooltip.set("label", "Check to place an artificial underwater structure.");
						
						domStyle.set(dijit.byId("mangrovePanel").getParent().id, "display","block");
						if (this.currentHabitatData.mangrove) {
							this.mangroveCheckBox.set("disabled", false);
							this.mangroveCheckBox.set("checked", true);
							this.mangroveShoreEdgeBox.set('disabled', false); 
							this.mangroveSeaEdgeBox.set('disabled', false);
							this.mangroveSeaEdgeBox.set('value', this.parameters.futureMangroveSeaEdge, false);
							this.mangroveShoreEdgeBox.set('value', this.parameters.futureMangroveShoreEdge, false);
							this.mangroveDensityBox.set('disabled', false); 
							this.mangroveDensityReductionBox.set('disabled', false);
							this.mangroveMudDensityBox.set('disabled', false); 
							this.mangroveSurgeAttenuationBox.set('disabled', false); 
							this.addFutureHabitatPlot("mangrove");
							this.mangroveCheckBoxTooltip.set("label", "Check to set a mangrove restoration scenario. Uncheck to run under current conditions.");
						} else {
							this.mangroveCheckBox.set("disabled", true);
							this.mangroveCheckBox.set("checked", false);
							this.mangroveCheckBoxTooltip.set("label", "(Disabled) No mangrove habitat available to modify.");
						}
						
						this.waterTypeButton.set("label", "Tide");
						this.tideLevelButton.set("label", "Mean Higher High Water");
						this.waterTypeButtonOnChange("Tide");
						this.waterTypeButton.set("disabled", true);
						
						domStyle.set(dijit.byId("coralReefPanel").getParent().id, "display","block");
						dijit.byId('habitatPane').selectChild('coralReefPanel');
						if (this.currentHabitatData.coral) {
							this.coralReefCheckBox.set("disabled", false);
							this.coralReefCheckBox.set("checked", true);
							this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							this.coralReefCheckBoxTooltip.set("label", "Check to set a coral reef restoration scenario. Uncheck to run under current conditions.");
							this.coralReefCheckBoxTooltip.open("coralReefPanel_button_title");
						} else {
							this.coralReefCheckBox.set("disabled", true);
							if (typeof this.profileChart.getSeries("Reef (future)") !== "undefined") {
								this.onHabitatCheckboxChange('coral', this.coralReefCheckBox);
							}
							this.coralReefCheckBoxTooltip.set("label", "(Disabled) No coral reef habitat available to modify.");
						}
						break;
				}
				dijit.byId('habitatPane').resize({h:370});
			}
			
			this.resetHabitatData = function() {
				if (this.currentHabitatData.coral) {
					this.parameters.futureReefSeaEdge = this.parameters.currentReefSeaEdge;
					this.parameters.futureReefShoreEdge = this.parameters.currentReefShoreEdge;
					//this.futureHabitatData.coral = [this.parameters.currentReefSeaEdge, this.parameters.currentReefShoreEdge];
					//this.futureHabitatData.coral = [ { x: this.parameters.currentReefSeaEdge, y: 0 }, { x: this.parameters.currentReefShoreEdge, y: 0 }];
					this.futureHabitatData.coral = dojo.map(this.currentHabitatData.coral, function(item){ var obj = { x: item.x }; obj.y = (item.y != null) ? 0 : item.y; return obj })
				}
				
				if (this.currentHabitatData.mangrove) {
					this.parameters.futureMangroveSeaEdge = this.parameters.currentMangroveSeaEdge;
					this.parameters.futureMangroveShoreEdge = this.parameters.currentMangroveShoreEdge;
					//this.futureHabitatData.mangrove = [this.parameters.currentMangroveSeaEdge, this.parameters.currentMangroveShoreEdge];
					var y = this.profileChart.getAxis("y").opt.max;
					this.futureHabitatData.mangrove = [ { x: this.parameters.currentMangroveSeaEdge, y: y }, { x: this.parameters.currentMangroveShoreEdge, y: y }];
				}
				
				this.parameters.futureUnderwaterStructureSeaEdge = this.currentHabitatData.underwaterStructure;
				this.parameters.futureUnderwaterStructureShoreEdge = this.currentHabitatData.underwaterStructure;
				var xs = dojo.map(this.currentHabitatData.elevation, function (item) { return Math.abs(item.x - self.currentHabitatData.underwaterStructure) });
				var index = dojo.indexOf(xs, _.min(xs));
				var offset = 5;
				var pt1 = {
					x: this.currentHabitatData.distance[index-offset], 
					y: this.currentHabitatData.elevation[index-offset].y-0.5
				};
				var pt2 = {
					x: this.currentHabitatData.underwaterStructure,
					y:  0
				}
				var pt3 = {
					x: this.currentHabitatData.distance[index+offset],
					y: this.currentHabitatData.elevation[index+offset].y-0.5
				}
				this.futureHabitatData.underwaterStructure = [ pt1, pt2, pt3];
			}
			
			this.processProfileData = function(result) {			
				this.parameters.profileId = result.id;
				this.parameters.mllw = result.mllw;
				this.parameters.wave = result.wave;
				var distance = result.distance;
				var elevation = result.elevation;
				var profileData = dojo.map(distance, function(d, i) { 
					return { "x": d, "y": elevation[i] }
				});
				
				if (_.has(result, "coral")) {	
					var coral = result.coral;
					//var reefData = dojo.map(distance.slice(coral.seaEdge.index, coral.shoreEdge.index+1), function(d, i) { return { "x": d, "y": elevation[coral.seaEdge.index + i] } });
					var reefData = [];
					dojo.forEach(distance.slice(coral.seaEdge.index, coral.shoreEdge.index+1), function(d, i) {
						var distanceIndex = dojo.indexOf(distance, d);
						var dataIndex = dojo.indexOf(coral.data, distanceIndex);
						var y = (dataIndex > -1) ? elevation[distanceIndex] : null;
						reefData.push( { "x": d, "y": y });
					});
				}
				
				if (_.has(result, "mangrove")) {
					var mangrove = result.mangrove;
					//var mangroveData = dojo.map(distance.slice(mangrove.seaEdge.index, mangrove.shoreEdge.index+1), function(d, i) { return { "x": d, "y": elevation[mangrove.seaEdge.index + i] } });
					var mangroveData = [];
					dojo.forEach(distance.slice(mangrove.seaEdge.index, mangrove.shoreEdge.index+1), function(d, i) { 
						var distanceIndex = dojo.indexOf(distance, d);
						var dataIndex = dojo.indexOf(mangrove.data, distanceIndex);
						var y = (dataIndex > -1) ? elevation[distanceIndex] : null;
						mangroveData.push( { "x": d, "y": y } );
					});
				}
				
				if (_.has(result, "marsh")) {	
					var marsh = result.marsh;
					//var marshData = dojo.map(distance.slice(marsh.seaEdge.index, marsh.shoreEdge.index+1), function(d, i) { return { "x": d, "y": elevation[marsh.seaEdge.index + i] } });
					var marshData = [];
					dojo.forEach(distance.slice(marsh.seaEdge.index, marsh.shoreEdge.index+1), function(d, i) {
						var distanceIndex = dojo.indexOf(distance, d);
						var dataIndex = dojo.indexOf(marsh.data, distanceIndex);
						var y = (dataIndex > -1) ? elevation[distanceIndex] : null;
						marshData.push( { "x": d, "y": y });
					});
				}
				
				if (_.has(result, "seagrass")) {	
					var seagrass = result.seagrass;
					//var seagrassData = dojo.map(distance.slice(seagrass.seaEdge.index, seagrass.shoreEdge.index+1), function(d, i) { return { "x": d, "y": elevation[seagrass.seaEdge.index + i] } });
					var seagrassData = [];
					dojo.forEach(distance.slice(seagrass.seaEdge.index, seagrass.shoreEdge.index+1), function(d, i) { 
						var distanceIndex = dojo.indexOf(distance, d);
						var dataIndex = dojo.indexOf(seagrass.data, distanceIndex);
						var y = (dataIndex > -1) ? elevation[distanceIndex] : null;
						seagrassData.push( { "x": d, "y": y } );
					});
				}
				
				if (_.has(result, "beach")) {	
					var beach = result.beach;
					//var beachData = dojo.map(distance.slice(beach.seaEdge.index, beach.shoreEdge.index+1), function(d, i) { return { "x": d, "y": elevation[beach.seaEdge.index + i] } });
					var beachData = [];
					dojo.forEach(distance.slice(beach.seaEdge.index, beach.shoreEdge.index+1), function(d, i) { 
						var distanceIndex = dojo.indexOf(distance, d);
						var dataIndex = dojo.indexOf(beach.data, distanceIndex);
						var y = (dataIndex > -1) ? elevation[distanceIndex] : null;
						beachData.push( { "x": d, "y": y } );
					});
				}
				
				this.currentHabitatData = {};
				this.futureHabitatData = {};
				this.currentHabitatData.distance = distance;
				this.currentHabitatData.elevation = profileData;
				if (coral) {
					this.currentHabitatData.coral = reefData;
					this.parameters.currentReefSeaEdge = coral.seaEdge.value;
					this.parameters.currentReefShoreEdge = coral.shoreEdge.value;
					
					//this.futureHabitatData.coral = [ { x: coral.seaEdge.value, y: 0 }, { x: coral.shoreEdge.value, y: 0 }];
					this.futureHabitatData.coral = dojo.map(this.currentHabitatData.coral, function(item){ var obj = { x: item.x }; obj.y = (item.y != null) ? 0 : item.y; return obj });
					this.parameters.futureReefSeaEdge = this.parameters.currentReefSeaEdge;
					this.parameters.futureReefShoreEdge = this.parameters.currentReefShoreEdge;
					//this.coralReefCheckBox.set("disabled", false);
					this.coralReefCheckBoxTooltip.set("label", "Check to set a coral reef restoration scenario. Uncheck to run under current conditions.");
				} else {
					this.currentHabitatData.coral = [];
					this.parameters.currentReefSeaEdge = 0;
					this.parameters.currentReefShoreEdge = 0;
					
					this.futureHabitatData.coral = [];
					this.parameters.futureReefSeaEdge = this.parameters.currentReefSeaEdge;
					this.parameters.futureReefShoreEdge = this.parameters.currentReefShoreEdge;
					this.coralReefCheckBox.set("disabled", true);
					this.coralReefCheckBoxTooltip.set("label", "(Disabled) No coral reef habitat available to modify.");
				}
				
				if (mangrove) {
					this.currentHabitatData.mangrove = mangroveData;
					this.parameters.currentMangroveSeaEdge = mangrove.seaEdge.value;
					this.parameters.currentMangroveShoreEdge = mangrove.shoreEdge.value;
					
					this.futureHabitatData.mangrove = [{ x: mangrove.seaEdge.value, y: 20 }, { x: mangrove.shoreEdge.value, y: 20 }];
					this.parameters.futureMangroveSeaEdge = this.parameters.currentMangroveSeaEdge;
					this.parameters.futureMangroveShoreEdge = this.parameters.currentMangroveShoreEdge;
					
					var mangroveMinValues = dojo.filter(profileData,function(item) { return item.y > (self.parameters.mllw*2 - 0.25) && item.y < (self.parameters.mllw*2 + 0.25) });
					var mangroveValues = dojo.map(mangroveMinValues, function(value){ return value.x});
					console.log(mangroveValues);
					/* var mangroveMinValue = dojo.filter(mangroveMinValues, function(item) {
						return item.x == _.max(mangroveValues);
					});
					this.parameters.mangroveSeaEdgeEnd = _.last(mangroveMinValue).x; */
					
					this.parameters.mangroveSeaEdgeEnd = _.min(mangroveValues);
					
					if ((this.waterTypeButton.get('label') == 'Tide') && (this.tideLevelButton.get('label') == 'Mean Lower Low Water' || this.tideLevelButton.get('label') == 'Mean Sea Level')) {
						this.mangroveCheckBox.set("disabled", true);
						this.mangroveCheckBoxTooltip.set("label", "(Disabled) Mangrove habitat must be submerged to modify - set tide level to Mean Higher High Water or above.");
					} else {
						//this.mangroveCheckBox.set("disabled", false);
						this.mangroveCheckBoxTooltip.set("label", "Check to set a mangrove restoration scenario. Uncheck to run under current conditions.");
					}
					
				} else {
					this.currentHabitatData.mangrove = [];
					this.parameters.currentMangroveSeaEdge = this.parameters.mllw;
					this.parameters.currentMangroveShoreEdge = _.last(this.currentHabitatData.distance);
					
					this.futureHabitatData.mangrove = [];
					this.parameters.futureMangroveSeaEdge = this.parameters.currentMangroveSeaEdge;
					this.parameters.futureMangroveShoreEdge = this.parameters.currentMangroveShoreEdge;
					this.mangroveCheckBox.set("disabled", true);
					this.mangroveCheckBoxTooltip.set("label", "(Disabled) No mangrove habitat available to modify.");
				}
				
				if (_.min(distance) <= -40) {
					this.parameters.underwaterStructureShoreEdgeEnd = -40;
					//this.parameters.currentUnderwaterStructureSeaEdge = (this.currentHabitatData.coral.length > 0) ? this.parameters.currentReefShoreEdge : _.min(distance);
					this.parameters.currentUnderwaterStructureSeaEdge = _.min(distance);
					this.parameters.currentUnderwaterStructureShoreEdge = this.parameters.underwaterStructureShoreEdgeEnd;
					
					var initialX = this.parameters.currentUnderwaterStructureShoreEdge - ((this.parameters.currentUnderwaterStructureShoreEdge - this.parameters.currentUnderwaterStructureSeaEdge)/2)
					this.currentHabitatData.underwaterStructure = this.utilities.findClosestValueInArray(initialX, distance).value;
					
					this.parameters.futureUnderwaterStructureSeaEdge = this.currentHabitatData.underwaterStructure
					this.parameters.futureUnderwaterStructureShoreEdge = this.currentHabitatData.underwaterStructure;
					
					var offset = 5;
					var pt1 = {
						x: distance[dojo.indexOf(distance, this.currentHabitatData.underwaterStructure)-offset], 
						y: elevation[dojo.indexOf(distance, this.currentHabitatData.underwaterStructure)-offset]-0.5
					};
					var pt2 = {
						x: this.currentHabitatData.underwaterStructure,
						y:  0
					}
					var pt3 = {
						x: distance[dojo.indexOf(distance, this.currentHabitatData.underwaterStructure)+offset],
						y: elevation[dojo.indexOf(distance, this.currentHabitatData.underwaterStructure)+offset]-0.5
					}
					this.futureHabitatData.underwaterStructure = [ pt1, pt2, pt3];
					//this.underwaterStructureCheckBox.set("disabled", false);
					this.underwaterStructureCheckBoxTooltip.set("label", "Check to place an artificial underwater structure.");
				} else {
					this.parameters.underwaterStructureShoreEdgeEnd = 0;
					this.currentHabitatData.underwaterStructure = 0;
					this.parameters.currentUnderwaterStructureSeaEdge = 0;
					this.parameters.currentUnderwaterStructureShoreEdge = 0;
					this.parameters.futureUnderwaterStructureSeaEdge = this.parameters.currentUnderwaterStructureShoreEdge;
					this.parameters.futureUnderwaterStructureShoreEdge = this.parameters.currentUnderwaterStructureShoreEdge;
					this.futureHabitatData.underwaterStructure = [ ];
					this.underwaterStructureCheckBox.set("disabled", true);
					this.underwaterStructureCheckBoxTooltip.set("label", "(Disabled) Profile not long enough to place an underwater structure.");
				}
			}
			
			this.loadProfileData = function(){
				// Set chart axes to new data
				var xs = [];
				var ys = [];
				dojo.forEach(this.currentHabitatData.elevation, function(value) {
					xs.push(value.x);
					ys.push(value.y);
				});
				
				var xOpts = this.profileChart.getAxis("x").opt
				xOpts.min = _.min(xs);
				xOpts.max = _.max(xs);
				var yOpts = this.profileChart.getAxis("y").opt
				yOpts.min = _.min(ys)
				yOpts.max = _.max(ys) + ((_.max(ys) - _.min(ys))/4);
				this.profileChart.addAxis("x", xOpts);
				this.profileChart.addAxis("y", yOpts);
				
				// update chart plots with new data
				this.profileChart.addSeries("Elevation", this.currentHabitatData.elevation, {
					plot: "elevationArea", 
					stroke: {color:"#BFBF99", width: 1 }, 
					fill: "#fafad4"
				});
				this.profileChart.render();
				
				if (this.profileChart.getSeries("Reef (future)")) {
					this.removeFutureHabitatPlot("coral");
				}
				if (this.profileChart.getSeries("Mangrove (future)")) {
					this.removeFutureHabitatPlot("mangrove");
				}
				if (this.profileChart.getSeries("Underwater Structure")) {
					this.removeFutureHabitatPlot("underwaterStructure");
				}

				if (this.currentHabitatData.coral.length > 0) {
					this.profileChart.addSeries("Coral Reef & Hard Bottom", this.currentHabitatData.coral, { 
						plot: "currentReef", 
						stroke: { color: "#1C4A85", width: 5, cap: "round", join: "round" } 
					});
				} else {
					this.profileChart.addSeries("Coral Reef & Hard Bottom", [{"x": -1000, "y": -1000},{"x": -1001, "y": -1001}], { 
						plot: "currentReef", 
						stroke: { color: "#1C4A85", width: 5, cap: "round", join: "round" } 
					});
				}
				if (this.currentHabitatData.mangrove.length > 0) {
					this.profileChart.addSeries("Mangrove", this.currentHabitatData.mangrove, { 
						plot: "currentMangrove", 
						stroke: { color: "#4B604E", width: 5, cap: "round", join: "round" } 
					});
				} else {
					this.profileChart.addSeries("Mangrove", [{"x": -1000, "y": -1000},{"x": -1001, "y": -1001}], { 
						plot: "currentMangrove", 
						stroke: { color: "#4B604E", width: 5, cap: "round", join: "round" } 
					});
				}
				
				this.profileChart.render();
				
				this.habitatRangeSlider.set('minimum',_.min(xs));
				this.habitatRangeSlider.set('maximum',_.max(xs))
				dojo.byId("cd_reefSeaEdgeBox").value = number.round(this.parameters.currentReefSeaEdge,0);
				dojo.byId("cd_reefShoreEdgeBox").value = number.round(this.parameters.currentReefShoreEdge,0);
				dojo.byId("cd_mangroveSeaEdgeBox").value = number.round(this.parameters.currentMangroveSeaEdge,0);
				dojo.byId("cd_mangroveShoreEdgeBox").value = number.round(this.parameters.currentMangroveShoreEdge,0);
				dojo.byId("cd_underwaterStructureLocationBox").value = number.round(this.parameters.futureUnderwaterStructureSeaEdge,0);
				
				this.habitatRangeSlider.set("disabled", false);
				domStyle.set(this.habitatRangeSlider.sliderHandle,"display", "none");
				domStyle.set(this.habitatRangeSlider.sliderHandleMax,"display", "none");
				
				this.waveHeightBox.set("value", this.parameters.wave["Storm"].height);
				this.wavePeriodBox.set("value", this.parameters.wave["Storm"].period);
			}
			
			this.setWaveModelParameters = function() {
				var valueTranslate = { 
					"wave": {
						"Oceanic":"Direct Input",
						"Wind-Wave":"From Wind",
						"Hurricane":"From Hurricane"
					},
					"hurricane": {
						"Tropical Storm":"TS",
						"Category 1":"C1",
						"Category 2":"C2",
						"Category 3":"C3",
						"Category 4":"C4",
						"Category 5":"C5",
					},
					"tide": {
						"Mean Lower Low Water":"MLLW",
						"Mean Sea Level":"MSL",
						"Mean High Water":"MHW",
						"Mean Higher High Water":"MHHW",
						"Highest Observed":"Highest Observed"
					}
				}

				var random = Math.round(Math.random() * 10000);
				var params = {
					//Geographic Parameters
					"Run_Label": this.parameters.region.replace(" ", "_") + "_" + random,
					"Region": this.parameters.region.replace(" ", "_"),
					"Profile_Number": this.parameters.profileId,
					"Use_Cross-Shore_Extent": 0,
					"Offshore_Limit": 0,
					"Shoreward_Limit": 0,
					
					//Wave Parameters
					"Wave_Type": valueTranslate.wave[this.windWaveButton.get("label")],
					"Wave_Height": this.waveHeightBox.get("value"),
					"Wave_Period": this.wavePeriodBox.get("value"),
					"Wind_Type": this.windButton.get("label"),
					"Hurricane_Category": valueTranslate.hurricane[this.hurricaneButton.get("label")],
					
					//Water Parameters
					"Sea_Level_Increase": this.waterTypeButton.get("label"),
					"Sea-Level_Rise": this.seaLevelRiseButton.get("label"),
					"Tide_Level": valueTranslate.tide[this.tideLevelButton.get("label")],
					
					//Habitat Parameters
					//Coral Reef
					"Modify_Coral_Reef": (this.coralReefCheckBox.checked) ? 1 : 0,
					"Offshore_Location_of_Live_Coral": this.reefSeaEdgeBox.get("value"),
					"Shoreward_Location_of_Live_Coral": this.reefShoreEdgeBox.get("value"),
					"Modify_Friction_Coefficient": (this.coralReefCheckBox.checked) ? 1 : 0,
					"Friction_Coefficient_for_Live_Coral": this.frictionCoefficientLiveCoralBox.get("value"),
					"Friction_Coefficient_for_Reef_Framework": this.frictionCoefficientReefFrameworkBox.get("value"),
					"Coral_Reef_Response_to_SLR__Keep_Up": (this.reefResponseTypeButton.get("label") == "Keep Up") ? "Yes" : "No",
					"Coral_Reef_Response_to_SLR__Degradation____": this.reefResponseDegradationBox.get("value"),
					
					"Vegetation": (this.mangroveCheckBox.checked) ? 1 : 0,
					//Mangrove Parameters
					"Modify_Mangroves":  (this.mangroveCheckBox.checked) ? 1 : 0,
					"Modify_Mangrove_Location": (this.mangroveCheckBox.checked) ? 1 : 0,
					"Seaward_Location_of_Mangrove": this.mangroveSeaEdgeBox.get("value"),
					"Landward_Location_of_Mangrove": this.mangroveShoreEdgeBox.get("value"),
					"Mangrove_Density": this.mangroveDensityBox.get("value"),
					"Mangrove_Density_Reduction_in_Future____": this.mangroveDensityReductionBox.get("value"),
					"Mud_Density": this.mangroveMudDensityBox.get("value"),
					"Surge_Attenuation": this.mangroveSurgeAttenuationBox.get("value"),
					//Not being used in the model at this time, fixing values
					"Modify_Mangrove_Physical_Characteristics": 0,
					"Mangrove_Roots_Diameter": 0.05,
					"Mangrove_Roots_Height": 0.5,
					"Mangrove_Roots_CD": 1,
					"Mangrove_Roots_Density": 90,
					"Mangrove_Roots_Density_Reduction_in_Future____": 100,
					"Mangrove_Trunk_Diameter": 0.5,
					"Mangrove_Trunk_Height": 1,
					"Mangrove_Trunk_CD": 1,
					"Mangrove_Trunk_Density_Present": 1.2,
					"Mangrove_Trunk_Density_Reduction_in_Future____": 100,
					"Mangrove_Canopy_Diameter": 0.05,
					"Mangrove_Canopy_Height": 1,
					"Mangrove_Canopy_CD": 1,
					"Mangrove_Canopy_Density_Present": 900,
					"Mangrove_Canopy_Density_Reduction_in_Future____": 100,		

					//Marsh Parameters
					"Modify_Marsh": 0,
					"Marsh_Density": 0,
					"Marsh_Density_Reduction_in_Future____": 0,
					"Modify_Marsh_Location": 0,
					"Seaward_Location_of_Marsh": 0,
					"Landward_Location_of_Marsh": 0,
					"Modify_Marsh_Stem_Physical_Characteristics": 0,
					"Marsh_Stem_Diameter": 0,
					"Marsh_Stem_Height": 0,
					"Marsh_Stem_CD": 0,
					"Marsh_Stem_Density": 0,
					"Marsh_Stem_Density_Reduction_in_Future____": 0,
					
					//Seagrass Parameters
					"Modify_Seagrass": 0,
					"Seagrass_Density": 0,
					"Seagrass_Density_Reduction_in_Future____": 0,
					"Modify_Seagrass_Location": 0,
					"Seaward_Location_of_Seagrass": 0,
					"Landward_Location_of_Seagrass": 0,
					"Modify_Seagrass_Stem_Physical_Characteristics": 0,
					"Seagrass_Stem_Diameter": 0,
					"Seagrass_Stem_Height": 0,
					"Seagrass_CD": 0,
					"Seagrass_Stem_Density": 0,
					"Seagrass_Stem_Density_Reduction_in_Future____": 0,
					
					//Beach Parameters
					"Modify_Beach": 0,
					"Sand_Diameter": 0,
					"Beach_Slope": 0,
					"Berm_Height_Present": 0,
					"Berm_Width_Present": 0,
					"Dune_Height_Present": 0,
					"Modify_Beach_in_Future": 0,
					"Berm_Height_Future": 0,
					"Berm_Width_Future": 0,
					"Dune_Height_Future": 0,
					"Beach_Grass": "No",
					
					//Underwater Structure Parameters
					"Modify_Artificial_Underwater_Structure": (this.underwaterStructureCheckBox.checked) ? 1 : 0,
					"Reef_Present_for_Current_and_Future_Runs": "No",
					"Reef_Type": this.underwaterStructureTypeButton.get("label"),
					"Reef_Location": this.underwaterStructureLocationBox.get("value"),
					"Reef_Height": this.underwaterStructureHeightBox.get("value"),
					"Reef_Base_Width": this.underwaterStructureBaseWidthBox.get("value"),
					"Reef_Crest": this.underwaterStructureCrestWidthBox.get("value"),
					
					//Structure Parameters
					"Modify_Structure_s_": 0,
					"Structure_Type": "Seawall",
					"Seawall_Location": 0,
					"Seawall_Height": 0,
					"Levee_Location": 0,
					"Levee_Height": 0,
					"Levee_Slope": 0	
				};
				
				this.waveModelParameters = params;
			}
			
			this.printWaveModelParameters = function() {
					var printParams = "<p>";
					printParams += "<h5>Input Parameters for Current Run</h5>";
					printParams += "<b>Geographic Parameters</b><br>";
					printParams += "<i>Run_Label:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Run_Label"]  + "</b><br>";
					printParams += "<i>Region:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Region"]  + "</b><br>";
					printParams += "<i>Profile_Number:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Profile_Number"]  + "</b><br>";
					printParams += "<i>Use_Cross-Shore_Extent:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Use_Cross-Shore_Extent"]  + "</b><br>";
					printParams += "<i>Offshore_Limit:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Offshore_Limit"]  + "</b><br>";
					printParams += "<i>Shoreward_Limit:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Shoreward_Limit"]  + "</b><br>";
					
					printParams +=  "<br><b>Wave Parameters</b><br>";
					printParams += "<i>Wave_Type:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Wave_Type"]  + "</b><br>";
					printParams += "<i>Wave_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Wave_Height"]  + "</b><br>";
					printParams += "<i>Wave_Period:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Wave_Period"]  + "</b><br>";
					printParams += "<i>Wind_Type:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Wind_Type"]  + "</b><br>";
					printParams += "<i>Hurricane_Category:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Hurricane_Category"]  + "</b><br>";
					
					printParams += "<br><b>Water Parameters</b><br>";
					printParams += "<i>Sea_Level_Increase:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Sea_Level_Increase"]  + "</b><br>";
					printParams += "<i>Sea-Level_Rise:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Sea-Level_Rise"]  + "</b><br>";
					printParams += "<i>Tide_Level:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Tide_Level"]  + "</b><br>";
					
					printParams +=  "<br><b>Coral Reef</b><br>";
					printParams += "<i>Modify_Coral_Reef:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Coral_Reef"]  + "</b><br>";
					printParams += "<i>Offshore_Location_of_Live_Coral:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Offshore_Location_of_Live_Coral"]  + "</b><br>";
					printParams += "<i>Shoreward_Location_of_Live_Coral:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Shoreward_Location_of_Live_Coral"]  + "</b><br>";
					printParams += "<i>Modify_Friction_Coefficient:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Friction_Coefficient"]  + "</b><br>";
					printParams += "<i>Friction_Coefficient_for_Live_Coral:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Friction_Coefficient_for_Live_Coral"]  + "</b><br>";
					printParams += "<i>Friction_Coefficient_for_Reef_Framework:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Friction_Coefficient_for_Reef_Framework"]  + "</b><br>";
					printParams += "<i>Coral_Reef_Response_to_SLR_Keep_Up:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Coral_Reef_Response_to_SLR__Keep_Up"]  + "</b><br>";
					printParams += "<i>Coral_Reef_Response_to_SLR_Degradation:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Coral_Reef_Response_to_SLR__Degradation____"]  + "</b><br>";
					
					printParams +=  "<br><b>Vegetation Parameters</b><br>";
					printParams += "<i>Vegetation:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Vegetation"]  + "</b><br>";
					printParams +=  "<br><b>Mangrove</b><br>";
					printParams += "<i>Modify_Mangroves:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Mangroves"]  + "</b><br>";
					printParams += "<i>Modify_Mangrove_Location:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Mangrove_Location"]  + "</b><br>";
					printParams += "<i>Seaward_Location_of_Mangrove:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seaward_Location_of_Mangrove"]  + "</b><br>";
					printParams += "<i>Landward_Location_of_Mangrove:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Landward_Location_of_Mangrove"]  + "</b><br>";
					printParams += "<i>Mangrove_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Density"]  + "</b><br>";
					printParams += "<i>Mangrove_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Density_Reduction_in_Future____"]  + "</b><br>";
					printParams += "<i>Mud_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mud_Density"]  + "</b><br>";
					printParams += "<i>Surge_Attenuation:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Surge_Attenuation"]  + "</b><br>";
					
					printParams +=  "<br>Not being used in the interface/model at this time, fixing values<br>";
					printParams += "<i>Modify_Mangrove_Physical_Characteristics:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Mangrove_Physical_Characteristics"]  + "</b><br>";
					printParams += "<i>Mangrove_Roots_Diameter:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Roots_Diameter"]  + "</b><br>";
					printParams += "<i>Mangrove_Roots_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Roots_Height"]  + "</b><br>";
					printParams += "<i>Mangrove_Roots_CD:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Roots_CD"]  + "</b><br>";
					printParams += "<i>Mangrove_Roots_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Roots_Density"]  + "</b><br>";
					printParams += "<i>Mangrove_Roots_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Roots_Density_Reduction_in_Future____"]  + "</b><br>";
					printParams += "<i>Mangrove_Trunk_Diameter:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Trunk_Diameter"]  + "</b><br>";
					printParams += "<i>Mangrove_Trunk_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Trunk_Height"]  + "</b><br>";
					printParams += "<i>Mangrove_Trunk_CD:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Trunk_CD"]  + "</b><br>";
					printParams += "<i>Mangrove_Trunk_Density_Present:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Trunk_Density_Present"]  + "</b><br>";
					printParams += "<i>Mangrove_Trunk_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Trunk_Density_Reduction_in_Future____"]  + "</b><br>";
					printParams += "<i>Mangrove_Canopy_Diameter:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Canopy_Diameter"]  + "</b><br>";
					printParams += "<i>Mangrove_Canopy_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Canopy_Height"]  + "</b><br>";
					printParams += "<i>Mangrove_Canopy_CD:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Canopy_CD"]  + "</b><br>";
					printParams += "<i>Mangrove_Canopy_Density_Present:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Canopy_Density_Present"]  + "</b><br>";
					printParams += "<i>Mangrove_Canopy_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Mangrove_Canopy_Density_Reduction_in_Future____"]  + "</b><br>";	

					printParams +=  "<br><b>Marsh Parameters</b><br>";
					printParams += "<i>Modify_Marsh:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Marsh"]  + "</b><br>";
					printParams += "<i>Marsh_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Density"]  + "</b><br>";
					printParams += "<i>Marsh_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Density_Reduction_in_Future____"]  + "</b><br>";
					printParams += "<i>Modify_Marsh_Location:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Marsh_Location"]  + "</b><br>";
					printParams += "<i>Seaward_Location_of_Marsh:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seaward_Location_of_Marsh"]  + "</b><br>";
					printParams += "<i>Landward_Location_of_Marsh:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Landward_Location_of_Marsh"]  + "</b><br>";
					printParams += "<i>Modify_Marsh_Stem_Physical_Characteristics:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Marsh_Stem_Physical_Characteristics"]  + "</b><br>";
					printParams += "<i>Marsh_Stem_Diameter:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Stem_Diameter"]  + "</b><br>";
					printParams += "<i>Marsh_Stem_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Stem_Height"]  + "</b><br>";
					printParams += "<i>Marsh_Stem_CD:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Stem_CD"]  + "</b><br>";
					printParams += "<i>Marsh_Stem_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Stem_Density"]  + "</b><br>";
					printParams += "<i>Marsh_Stem_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Marsh_Stem_Density_Reduction_in_Future____"]  + "</b><br>";
					
					printParams +=  "<br><b>Seagrass Parameters</b><br>";
					printParams += "<i>Modify_Seagrass:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Seagrass"]  + "</b><br>";
					printParams += "<i>Seagrass_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_Density"]  + "</b><br>";
					printParams += "<i>Seagrass_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_Density_Reduction_in_Future____"]  + "</b><br>";
					printParams += "<i>Modify_Seagrass_Location:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Seagrass_Location"]  + "</b><br>";
					printParams += "<i>Seaward_Location_of_Seagrass:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seaward_Location_of_Seagrass"]  + "</b><br>";
					printParams += "<i>Landward_Location_of_Seagrass:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Landward_Location_of_Seagrass"]  + "</b><br>";
					printParams += "<i>Modify_Seagrass_Stem_Physical_Characteristics:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Seagrass_Stem_Physical_Characteristics"]  + "</b><br>";
					printParams += "<i>Seagrass_Stem_Diameter:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_Stem_Diameter"]  + "</b><br>";
					printParams += "<i>Seagrass_Stem_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_Stem_Height"]  + "</b><br>";
					printParams += "<i>Seagrass_CD:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_CD"]  + "</b><br>";
					printParams += "<i>Seagrass_Stem_Density:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_Stem_Density"]  + "</b><br>";
					printParams += "<i>Seagrass_Stem_Density_Reduction_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seagrass_Stem_Density_Reduction_in_Future____"]  + "</b><br>";
					
					printParams +=  "<br><b>Beach Parameters</b><br>";
					printParams += "<i>Modify_Beach:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Beach"]  + "</b><br>";
					printParams += "<i>Sand_Diameter:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Sand_Diameter"]  + "</b><br>";
					printParams += "<i>Beach_Slope:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Beach_Slope"]  + "</b><br>";
					printParams += "<i>Berm_Height_Present:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Berm_Height_Present"]  + "</b><br>";
					printParams += "<i>Berm_Width_Present:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Berm_Width_Present"]  + "</b><br>";
					printParams += "<i>Dune_Height_Present:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Dune_Height_Present"]  + "</b><br>";
					printParams += "<i>Modify_Beach_in_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Beach_in_Future"]  + "</b><br>";
					printParams += "<i>Berm_Height_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Berm_Height_Future"]  + "</b><br>";
					printParams += "<i>Berm_Width_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Berm_Width_Future"]  + "</b><br>";
					printParams += "<i>Dune_Height_Future:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Dune_Height_Future"]  + "</b><br>";
					printParams += "<i>Beach_Grass:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Beach_Grass"]  + "</b><br>";
					
					printParams +=  "<br><b>Underwater Structure Parameters</b><br>";
					printParams += "<i>Modify_Artificial_Underwater_Structure:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Artificial_Underwater_Structure"]  + "</b><br>";
					printParams += "<i>Reef_Present_for_Current_and_Future_Runs:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Reef_Present_for_Current_and_Future_Runs"]  + "</b><br>";
					printParams += "<i>Reef_Type:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Reef_Type"]  + "</b><br>";
					printParams += "<i>Reef_Location:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Reef_Location"]  + "</b><br>";
					printParams += "<i>Reef_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Reef_Height"]  + "</b><br>";
					printParams += "<i>Reef_Base_Width:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Reef_Base_Width"]  + "</b><br>";
					printParams += "<i>Reef_Crest:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Reef_Crest"]  + "</b><br>";
					
					printParams +=  "<br><b>Structure Parameters</b><br>";
					printParams += "<i>Modify_Structure:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Modify_Structure_s_"]  + "</b><br>";
					printParams += "<i>Structure_Type:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Structure_Type"]  + "</b><br>";
					printParams += "<i>Seawall_Location:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seawall_Location"]  + "</b><br>";
					printParams += "<i>Seawall_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Seawall_Height"]  + "</b><br>";
					printParams += "<i>Levee_Location:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Levee_Location"]  + "</b><br>";
					printParams += "<i>Levee_Height:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Levee_Height"]  + "</b><br>";
					printParams += "<i>Levee_Slope:</i>&nbsp;&nbsp;&nbsp;<b>" + this.waveModelParameters["Levee_Slope"]  + "</b><br>";	
					printParams += "</p>";
					
					return printParams;
			}
			
			this.runWaveModel = function() {
				gp_RunWaveModel = new esri.tasks.Geoprocessor(this.gpRunWaveModelUrl);
				gp_RunWaveModel.submitJob(this.waveModelParameters, function(jobInfo) {
					if (jobInfo.jobStatus == 'esriJobSucceeded') {
						gp_RunWaveModel.getResultData(jobInfo.jobId, "Model_Output", function(result) {		
							self.waveModelProgressBar.set({ "value": self.waveModelProgressBar.get("maximum") });
							self.processResultsData(result.value);
							self.loadResultsData();
							self.waveModelProgressBar.set({ "value": 0 });
						});
					} else if (jobInfo.jobStatus == 'esriJobFailed') {
						self.waveModelProgressBar.set({ "value": self.waveModelProgressBar.get("maximum") });
						if (self.parameters.debug) {
							self.showDebugMessages(jobInfo);
						}
						dojo.byId("cd_noResultsDataHtmlContentDiv").innerHTML = "<center><img src='" + self.pluginDirectory + "/images/error.png' class='errorImage'>No data to plot</center>";
						self.resetResultsPane();
						self.waveModelProgressBar.set({ "value": 0 });
					}
					
					self.runScenarioButton.set("disabled", false);
					
					if (self.parameters.debug) {
						var inputParams = self.printWaveModelParameters();
						var debugContent = self.debugServerMessagePane.get("content");
						self.debugServerMessagePane.set("content", debugContent + inputParams);
					}
					
				}, 
				function(jobInfo) { 
					if (self.parameters.debug) {
						self.showDebugMessages(jobInfo);
					}
					self.advanceProgressBar("waveModel");
				});
			}
			
			this.showDebugMessages = function(jobInfo) {
				var jobStatusMessages = dojo.filter(jobInfo.messages, function(message) {
					return message.type != "esriJobMessageTypeEmpty";
				});
				var print = [];
				if (jobStatusMessages.length > 4) {
					var i = (_.has(jobInfo, "results")) ? 3 : 5;
					var messages = jobStatusMessages.slice(i, jobStatusMessages.length);
					dojo.forEach(messages, function(message) {
						if (message.type == "esriJobMessageTypeWarning") {
							print.push('<br><span style="color:#00ff00;">' + message.description + '</span><br>');
						} else if (message.type == "esriJobMessageTypeError" || message.type == "esriJobMessageTypeAbort") {
							print.push('<br><span style="color:#ff0000;">' + message.description + '</span><br>');
						} else {
							print.push(message.description);
						}
					});
				}
				print = this.filterDebugMessages(print);
				var message = "<h5>ArcGIS Geoprocessing Service Messages</h5>";
				this.debugServerMessagePane.set("content", message + print.join("<br>"));
			}
			
			this.filterDebugMessages = function(messages) {
				var clean = [];
				dojo.forEach(messages, function(message) {
					var messagesContainFailedTo = dojo.some(clean, function(item) { return item.indexOf("Failed to") > -1 });
					var messagesContainFailedAt = dojo.some(clean, function(item) { return item.indexOf("Failed at") > -1 });
					var messagesContainSucceededAt = dojo.some(clean, function(item) { return item.indexOf("Succeeded at") > -1 });
					if (!messagesContainSucceededAt && !messagesContainFailedAt && !messagesContainSucceededAt && message.indexOf("Failed.") == -1) {
						clean.push(message);
					}
				});
				
				return clean;
			}
			
			this.advanceProgressBar = function(type) {
				var progressBar = (type == "waveModel") ? this.waveModelProgressBar : this.findProfileProgressBar;
				var value = parseInt(progressBar.get("value")) + 1;
				var max = parseInt(progressBar.get("maximum"));
				if (value == max - 1) {
					progressBar.set("maximum", max + 1)
				}
				progressBar.set({ "value": value });
			}
			
			this.processResultsData = function(result) {
				this.waveModelResults = {};
				this.waveModelResults.waveHeight = {}
				this.waveModelResults.waveHeight.present = {}
				this.waveModelResults.waveHeight.future = {}
				
				var distance = [];
				var elevation = [];
				var waveHeightPresent = [];
				var waveHeightFuture = [];
				var min = 0;
				var max = 0
				dojo.forEach(result.distance, function(x, i) {
					if (x%self._data[self.parameters.regionIndex].profilePointFilterNumber == 0) {
						distance.push(result.distance[i]);
						elevation.push(result.elevation[i]);
						waveHeightPresent.push({ "x": x, "y": result.wave_height_present[i] });
						waveHeightFuture.push( { "x": x, "y": (result.wave_height_future[i] == undefined) ? null : result.wave_height_future[i] });
						min = (_.min([result.wave_height_present[i], result.wave_height_future[i]]) < min) ? _.min([result.wave_height_present[i], result.wave_height_future[i]]) : min;
						max = (_.max([result.wave_height_present[i], result.wave_height_future[i]]) > max) ? _.max([result.wave_height_present[i], result.wave_height_future[i]]) : max;
					}
				});

				var closestDistanceValue = this.utilities.findClosestValueInArray(_.first(distance), this.currentHabitatData.distance).value
				var start = dojo.indexOf(distance, closestDistanceValue);
				//console.log('index = ' + start);
				this.waveModelResults.distance = distance.slice(start, distance.length+1);
				this.waveModelResults.elevation = elevation.slice(start, elevation.length+1);
				
				this.waveModelResults.waveHeight.present.data = waveHeightPresent.slice(start, waveHeightPresent.length+1);
				this.waveModelResults.waveHeight.future.data = waveHeightFuture.slice(start,  waveHeightFuture.length+1);
				this.waveModelResults.waveHeight.min = min;
				this.waveModelResults.waveHeight.max = max;
				
				this.waveModelResults.messages = result.output_messages;
			}
			
			this.loadResultsData = function() {
				domStyle.set("cd_resultsDataLoadingDiv", "display", "none");
				
				this.renderResultsHabitatPlot();
				
				var xOpts = this.resultsChart.getAxis("x").opt;
				xOpts.min = this.profileChart.getAxis("x").opt.min;
				xOpts.max = this.profileChart.getAxis("x").opt.max;
				this.resultsChart.addAxis("x", xOpts);
				
				var yOpts = this.resultsChart.getAxis("y").opt;
				yOpts.min =this.waveModelResults.waveHeight.min;
				yOpts.max = (this.waveModelResults.waveHeight.max < 1) ? Math.ceil(this.waveModelResults.waveHeight.max, 1): this.waveModelResults.waveHeight.max + this.waveModelResults.waveHeight.max*0.15;
				yOpts.majorTickStep = (this.waveModelResults.waveHeight.max < 1.5) ? 0.1 : (this.waveModelResults.waveHeight.max >= 1.5 && this.waveModelResults.waveHeight.max < 10) ? 0.5 : 1;
				yOpts.minorTickStep = (this.waveModelResults.waveHeight.max < 1.5) ? 0.05 :  (this.waveModelResults.waveHeight.max >= 1.5 && this.waveModelResults.waveHeight.max < 10) ? 0.25 : 0.5;
				this.resultsChart.addAxis("y", yOpts);
				
				this.resultsChart.updateSeries("Present", this.waveModelResults.waveHeight.present );
				this.resultsChart.updateSeries("Future", this.waveModelResults.waveHeight.future );
				
				this.resultsChart.render();
				
				var waveHeightMin = dojo.map(this.waveModelResults.waveHeight.future.data, function(item, i) {
					var obj = (item.y > self.waveModelResults.waveHeight.present.data[i].y) ? { x: item.x, y:self.waveModelResults.waveHeight.present.data[i].y } : item;
					return  obj;
				});
				this.resultsChart.updateSeries("waveHeightMin", { data: waveHeightMin } );
				
				var futureWaveHeightBetter = dojo.map(this.waveModelResults.waveHeight.future.data, function(item, i) {
					var obj = (item.y > self.waveModelResults.waveHeight.present.data[i].y) ? { x: item.x, y:null } : { x: item.x, y:self.waveModelResults.waveHeight.present.data[i].y };
					return  obj;
				});
				this.resultsChart.updateSeries("futureWaveHeightBetter", { data: futureWaveHeightBetter } );
				
				var futureWaveHeightWorse = dojo.map(this.waveModelResults.waveHeight.future.data, function(item, i) {
					var obj = (item.y < self.waveModelResults.waveHeight.present.data[i].y) ? { x: item.x, y:null } : item;
					return  obj;
				});
				this.resultsChart.updateSeries("futureWaveHeightWorse", { data: futureWaveHeightWorse } );
				
				this.resultsChart.render();
				
				var xOpts = this.resultsHabitatChart.getAxis("x").opt;
				xOpts.min = this.profileChart.getAxis("x").opt.min;
				xOpts.max = this.profileChart.getAxis("x").opt.max;
				this.resultsHabitatChart.addAxis("x", xOpts);
				
				var yOpts = this.resultsHabitatChart.getAxis("y").opt;
				yOpts.min = this.profileChart.getAxis("y").opt.min;
				yOpts.max = this.profileChart.getAxis("y").opt.max;
				this.resultsHabitatChart.addAxis("y", yOpts);
				
				var blankData = [{"x":-100, "y":-100}, {"x":-101, "y":-101}];
				
				var data = (this.currentHabitatData.coral.length > 0) ? this.profileChart.getSeries("Coral Reef & Hard Bottom").data : blankData;
				this.resultsHabitatChart.updateSeries("Reef (present)",  data);
				
				var data = (this.coralReefCheckBox.checked) ? this.profileChart.getSeries("Reef (future)").data : blankData;
				this.resultsHabitatChart.updateSeries("Reef (future)",  data);
				
				var data = (this.currentHabitatData.mangrove.length > 0) ? this.profileChart.getSeries("Mangrove").data : blankData;
				this.resultsHabitatChart.updateSeries("Mangrove (present)",  data);
				
				var data = (this.mangroveCheckBox.checked) ? this.profileChart.getSeries("Mangrove (future)").data : blankData;
				this.resultsHabitatChart.updateSeries("Mangrove (future)",  data);
				
				var data = (this.underwaterStructureCheckBox.checked) ? this.profileChart.getSeries("Underwater Structure").data : blankData;
				this.resultsHabitatChart.updateSeries("Structure",  data);
				
				this.resultsHabitatChart.updateSeries("Elevation", this.profileChart.getSeries("Elevation").data );
				this.resultsHabitatChart.updateSeries("Water", this.profileChart.getSeries("Water").data );
				
				this.resultsHabitatChart.render();

				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
				
				
				var resultsChartType = new DropDownMenu({ style: "display: none;"});
				domClass.add(resultsChartType.domNode, "claro");

				if (this.waveModelResults.messages.coral != null && this.waveModelResults.messages.coral != '') {
					var menuItem = new MenuItem({
						label: "Coral Reef",
						value: "coral",
						onClick: function(){
							self.resultsChartTypeButton.set("label", this.label);
							self.resultsChartTypeButton.set("value", "coral");
							var message = self.waveModelResults.messages.coral;
							message = (message.split('wave').length > 2) ? message.split('wave').join('<br>wave').replace(' and','') : message;
							dojo.byId('resultsHabitatMessage').innerHTML = message;
							domStyle.set('resultsChartTypeContentDiv', "right", "35px");
						}
					});
					resultsChartType.addChild(menuItem);
				}
				
				if (this.waveModelResults.messages.mangrove != null && this.waveModelResults.messages.mangrove != '') {
					var menuItem = new MenuItem({
						label: "Mangrove",
						value: "mangrove",
						onClick: function(){
							self.resultsChartTypeButton.set("label", this.label);
							self.resultsChartTypeButton.set("value", "mangrove");
							var message = self.waveModelResults.messages.mangrove;
							message = (message.split('height').length > 1) ? message.split('wave').join('<br>wave').replace(' and','<br>and').replace(' forest', '') : message;
							dojo.byId('resultsHabitatMessage').innerHTML = message;
							domStyle.set('resultsChartTypeContentDiv', "right", "30px");
						}
					});
					resultsChartType.addChild(menuItem);
				} 
				
				if (this.waveModelResults.messages.underwaterStructure != null && this.waveModelResults.messages.underwaterStructure != '') {
					var menuItem = new MenuItem({
						label: "Artificial Reef",
						value: "underwaterStructure",
						onClick: function(){
							self.resultsChartTypeButton.set("label", this.label);
							self.resultsChartTypeButton.set("value", "underwaterStructure");
							var message = self.waveModelResults.messages.underwaterStructure;
							message = (message.split('wave').length > 2) ? message.split('wave').join('<br>wave').replace(' and','') : message;
							dojo.byId('resultsHabitatMessage').innerHTML = message;
							domStyle.set('resultsChartTypeContentDiv', "right", "50px");
						}
					});
					resultsChartType.addChild(menuItem);
				} 
				this.resultsChartTypeButton.set('dropDown', resultsChartType);
				var menuItem = _.first(this.resultsChartTypeButton.get("dropDown").getChildren());
				this.resultsChartTypeButton.set("label", menuItem.label);
				this.resultsChartTypeButton.set("value", menuItem.value);
				
				var message = self.waveModelResults.messages[menuItem.value];
				if (menuItem.value != "Mangrove") {
					message = (message.split('wave').length > 2) ? message.split('wave').join('<br>wave').replace(' and','').replace(' forest', '') : message;
				} else {
					message = (message.split('height').length > 1) ? message.split('wave').join('<br>wave').replace(' and','<br>and').replace(' forest', '') : message;
				}
				dojo.byId('resultsHabitatMessage').innerHTML = message;
				switch(menuItem.value) {
					case "coral":
						var right = "35px";
						break;
					case "mangrove":
						var right = "30px";
						break;
					case "underwaterStructure":
						var right = "50px";
						break;
				}
				domStyle.set('resultsChartTypeContentDiv', "right", right);cd_resultsTitleDiv
				
				domStyle.set('cd_resultsTitleDiv', "left", "65px");
				dojo.byId('cd_resultsSubTitleDiv').innerHTML = this.waveModelResults.messages.shore + "<br>" + this.waveModelResults.messages.mud;
				this.resultsChartTypeButton.set('disabled', false);
			}
			
			this.resetResultsPane = function() {
				dojo.byId('resultsHabitatMessage').innerHTML = '';
				dojo.byId('cd_resultsSubTitleDiv').innerHTML = '';
				domStyle.set('cd_resultsTitleDiv', "left", "95px");
				domStyle.set("cd_resultsDataLoadingDiv", "display", "block");
				domStyle.set("cd_noResultsDataHtmlContentDiv", "display", "block");
				domStyle.set("cd_resultsDataLoadingContentDiv", "display", "none");
				this.waveModelProgressBar.set({ "value": 0 });
				this.clearResultsChart();
				this.removeResultsHabitatPlots();
				this.resultsChartTypeButton.set('disabled', true);
			}
			
			this.clearResultsChart = function() {	
				
				var xOpts = this.resultsChart.getAxis("x").opt;
				xOpts.min = -1000;
				xOpts.max = 1000;
				this.resultsChart.addAxis("x", xOpts);
				
				var yOpts = this.resultsChart.getAxis("y").opt;
				yOpts.min = 0;
				yOpts.max = 10;
				yOpts.majorTickStep = 1;
				yOpts.minorTickStep = 0.5;
				this.resultsChart.addAxis("y", yOpts);
				
				var xOpts = this.resultsHabitatChart.getAxis("x").opt;
				xOpts.min = -1000;
				xOpts.max = 1000;
				this.resultsHabitatChart.addAxis("x", xOpts);
				
				var yOpts = this.resultsHabitatChart.getAxis("y").opt;
				yOpts.min = -40;
				yOpts.max = 10;
				this.resultsHabitatChart.addAxis("y", yOpts);
				
				this.clearResultsChartData();
				this.removeResultsHabitatPlots();
				this.resultsHabitatChart.render();
				this.resultsHabitatChartLegend.refresh();
				
				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
			
			}
			
			this.clearResultsChartData = function() {
				var data = [ {"x":-100, "y":-100}, {"x":-101, "y":-101}];
				this.resultsHabitatChart.updateSeries("Reef (present)", data);
				this.resultsHabitatChart.updateSeries("Reef (future)", data);
				this.resultsHabitatChart.updateSeries("Mangrove (present)", data);
				this.resultsHabitatChart.updateSeries("Mangrove (future)", data);
				this.resultsHabitatChart.updateSeries("Structure", data);
				this.resultsHabitatChart.updateSeries("Water", data);
				
				var data = []
				var range = 2000 
				for (var i = 0; i <= range; i++) {
					data.push ({ "x": i-(range/2), "y": -100 });
				}
				
				this.resultsChart.updateSeries("Present", data );
				this.resultsChart.updateSeries("Future", data );
				this.resultsChart.updateSeries("waveHeightMin", data );
				this.resultsChart.updateSeries("futureWaveHeightBetter", data );
				this.resultsHabitatChart.updateSeries("futureWaveHeightWorse", data);
				
				this.resultsChart.render();
				this.resultsHabitatChart.render();
				
				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
			}
			
			this.updateInterfaceWithNewUnits = function(unit){
				var cUnits = this.currentUnits;
				var nUnits = this.toolUnits[unit];
				var conversionFactor = cUnits.conversionFactor;
				
				var xOpts = this.profileChart.getAxis("x").opt;
				xOpts.min = number.round(xOpts.min * conversionFactor, 0);
				xOpts.max = number.round(xOpts.max * conversionFactor, 0);
				xOpts.title = xOpts.title.replace(cUnits.unitText, nUnits.unitText);
				this.profileChart.addAxis("x", xOpts);
				
				var yOpts = this.profileChart.getAxis("y").opt;
				yOpts.min = number.round(yOpts.min * conversionFactor, 0);
				yOpts.max = number.round(yOpts.max * conversionFactor, 0);
				yOpts.title = yOpts.title.replace(cUnits.unitText, nUnits.unitText).replace(cUnits.unitTextFull, nUnits.unitTextFull)
				this.profileChart.addAxis("y", yOpts);
				
				dojo.forEach(this.profileChart.series, function(series){
					var data = dojo.map(series.data, function(item) {
						return { "x": number.round(item.x * conversionFactor, 0), "y":  number.round(item.y * conversionFactor, 0) }
					});
					self.profileChart.updateSeries(series.name, data);
				});
				
				var xOpts = this.resultsChart.getAxis("x").opt;
				xOpts.min = number.round(xOpts.min * conversionFactor, 0);
				xOpts.max = number.round(xOpts.max * conversionFactor, 0);
				xOpts.title = xOpts.title.replace(cUnits.unitText, nUnits.unitText);
				this.resultsChart.addAxis("x", xOpts);
				
				var yOpts = this.resultsChart.getAxis("y").opt;
				yOpts.min = number.round(yOpts.min * conversionFactor, 0);
				yOpts.max = number.round(yOpts.max * conversionFactor, 0);
				yOpts.title = yOpts.title.replace(cUnits.unitText, nUnits.unitText).replace(cUnits.unitTextFull, nUnits.unitTextFull)
				this.resultsChart.addAxis("y", yOpts);
				
				dojo.forEach(this.resultsChart.series, function(series){
					var data = dojo.map(series.data, function(item) {
						return { "x": number.round(item.x * conversionFactor, 0), "y":  number.round(item.y * conversionFactor, 0) }
					});
					self.resultsChart.updateSeries(series.name, data);
				});
				
				var xOpts = this.resultsHabitatChart.getAxis("x").opt;
				xOpts.min = number.round(xOpts.min * conversionFactor, 0);
				xOpts.max = number.round(xOpts.max * conversionFactor, 0);
				xOpts.title = xOpts.title.replace(cUnits.unitText, nUnits.unitText);
				this.resultsHabitatChart.addAxis("x", xOpts);
				
				var yOpts = this.resultsHabitatChart.getAxis("y").opt;
				yOpts.min = number.round(yOpts.min * conversionFactor, 0);
				yOpts.max = number.round(yOpts.max * conversionFactor, 0);
				yOpts.title = yOpts.title.replace(cUnits.unitText, nUnits.unitText).replace(cUnits.unitTextFull, nUnits.unitTextFull)
				dojo.forEach(this.resultsHabitatChart.series, function(series){
					var data = dojo.map(series.data, function(item) {
						return { "x": number.round(item.x * conversionFactor, 0), "y":  number.round(item.y * conversionFactor, 0) }
					});
					self.resultsHabitatChart.updateSeries(series.name, data);
				});
				
				this.profileChart.render();
				this.resultsChart.render();
				this.resultsHabitatChart.render();
				
				this.setChartBackgroundToTransparent("cd_resultsHabitatPlotDiv");
				this.setChartBackgroundToTransparent("cd_resultsPlotDiv");
				
				var min = this.habitatRangeSlider.get("minimum");
				this.habitatRangeSlider.set('minimum', number.round(min * conversionFactor, 0));
				var max = this.habitatRangeSlider.get("maximum");
				this.habitatRangeSlider.set('maximum', number.round(max * conversionFactor, 0));
				var value = this.habitatRangeSlider.get("value");
				this.habitatRangeSlider.set('value', [number.round(value[0] * conversionFactor, 0), number.round(value[1] * conversionFactor, 0)]);
				
				this.currentUnits = this.toolUnits[unit];
			}
			
			this.utilities.findClosestValueInArray = function(goal, list) {
				var absDiff = dojo.map(list, function(item) {  return Math.abs(item - goal); });
				var index = dojo.indexOf(absDiff, _.min(absDiff));
				var value = list[index];
				return { "index": index, "value": value }
			}
			
			this.utilities.zipToXyObject = function(array1, array2) {
			
			
			
			}

			this.parseConfigData = function(configFile) {
				// Parse and validate config data to get URLs of layer sources
				var errorMessage;
				try {
				    var data = JSON.parse(configFile),
				        schema = layerConfigSchema,
				        valid = tv4.validate(data, schema);
				    if (valid) {
				        return data;
				    } else {
				        errorMessage = tv4.error.message + " (data path: " + tv4.error.dataPath + ")";
				    }
				} catch (e) {
				    errorMessage = e.message;
				}
				this._app.error("", "Error in config file layers.json: " + errorMessage);
				return null;
			}

			var layerConfigSchema = {
				$schema: 'http://json-schema.org/draft-04/schema#',
				title: 'Coastal Defense Config Schema',
				type: 'array',
				items: {	
					type: 'object',
					additionalProperties: false,
					properties: {
						location: { type: 'string' },
						layers: {
							type: 'object',
							additionalProperties: false,
							properties:{
								profileLandPoints: {type: 'string'},
								profilePoints: {type: 'string'},
								profilePolygon: {type: 'string'},
								profileTransect: {type: 'string'},
								reefLayer: {type: 'string'},
								marshLayer: {type: 'string'},
								mangroveLayer: {type: 'string'},
								seagrassLayer: {type: 'string'},
								underwaterStructureLayer: {type: 'string'},
								structureLayer: {type: 'string'},
								beachLayer: {type: 'string'},
								bathyLayer: {type: 'string'},
								mapLayers: {
									type: 'object',
									additionalProperties: false,
									properties: {
										url: { type: 'string'},
										habitatLayerIds: { type: 'array', items: { type: 'number' } },
										profilePolygonLayerId: { type: 'number' },
										profileTransectLayerId: { type: 'number' }
									}
								}
							}
						}, // end layers
						extents: {
							type: 'object',
							additionalProperties: false,
							properties: {
								initial: {
									type: 'object',
									additionalProperties: false,
									properties:  {
										xmin: { type: 'number'},
										xmax: { type: 'number'},
										ymin: { type: 'number'},
										ymax: { type: 'number'}
									}
								},
								subRegions: {
									type: 'array',
									items: {
										type: 'object',
										additionalProperties: false,
										properties: {
											name: { type: 'string' },
											extent: {
												type: 'object',
												additionalProperties: false,
												properties:  {
													xmin: { type: 'number'},
													xmax: { type: 'number'},
													ymin: { type: 'number'},
													ymax: { type: 'number'}
												}
											}
										}
									}
								}
							}
						}, //end extents
						profilePointFilterNumber: {type: 'number'},
						habitatList: { type: 'array', items: { type: 'string' } },
						menuItemExcludeList: { type: 'array', items: { type: 'string' } }
					} //Close Properties
				}  // Close Items
			} //end layerconfigschema
		
		} ;// End cdTool
		return cdTool;	
		
	} //end anonymous function

); //End define