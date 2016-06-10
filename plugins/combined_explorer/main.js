// Pull in your favorite version of jquery 
require({ 
	packages: [{ name: "jquery", location: "http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/", main: "jquery.min" }] 
});

define([
        "dojo/_base/declare",
		"framework/PluginBase",

		"esri/request",
		"esri/layers/ArcGISDynamicMapServiceLayer",
		"esri/layers/ArcGISImageServiceLayer",
		"esri/layers/ImageServiceParameters",
		"esri/layers/RasterFunction",
		"esri/tasks/ImageServiceIdentifyTask",
		"esri/tasks/ImageServiceIdentifyParameters",
		"esri/tasks/IdentifyParameters",
		"esri/tasks/IdentifyTask",
		"esri/tasks/QueryTask",
		"esri/tasks/query",
		"esri/graphicsUtils",
		"esri/geometry/Extent",
		"esri/SpatialReference",
		"esri/layers/MapImage",
		"esri/layers/MapImageLayer",

		"esri/symbols/SimpleLineSymbol",
		"esri/symbols/SimpleFillSymbol",
		"esri/symbols/SimpleMarkerSymbol",
		"esri/graphic",

		"dijit/form/Button",
		"dijit/form/ToggleButton",
		"dijit/form/DropDownButton",
		"dijit/DropDownMenu",
		"dijit/MenuItem",
		"dijit/layout/ContentPane",
		"dijit/layout/TabContainer",
		"dijit/form/HorizontalSlider",
		"dijit/form/CheckBox",
		"dijit/form/RadioButton",
		"dojo/dom",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/_base/window",
		"dojo/dom-construct",
		"dojo/dom-attr",
		"dojo/dom-geometry",

		"dojo/request/script",
		"dojo/_base/array",
		"dojo/aspect",
		"dojo/_base/lang",
		"dojo/on",
		"dojo/query",
		"dojo/parser",
		"dojo/NodeList-traverse",
		"dijit/Tooltip",
		"dijit/registry",
		"require",
		"./combine",
		"dojo/text!./explorer.json"

       ],
       function (declare,
					PluginBase,
					ESRIRequest,
					ArcGISDynamicMapServiceLayer,
					ArcGISImageServiceLayer,
					ImageServiceParameters,
					RasterFunction,
					ImageServiceIdentifyTask,
					ImageServiceIdentifyParameters,
					IdentifyParameters,
					IdentifyTask,
					QueryTask,
					esriQuery,
					graphicsUtils,
					Extent,
					SpatialReference,
					MapImage,
					MapImageLayer,
					SimpleLineSymbol,
					SimpleFillSymbol,
					SimpleMarkerSymbol,
					Graphic,
					Button,
					ToggleButton,
					DropDownButton,
					DropDownMenu,
					MenuItem,
					ContentPane,
					TabContainer,
					HorizontalSlider,
					CheckBox,
					RadioButton,
					dom,
					domClass,
					domStyle,
					win,
					domConstruct,
					domAttr,
					domGeom,
					script,
					array,
					aspect,
					lang,
					on,
					dojoquery,
					parser,
					domNodeTraverse,
					Tooltip,
					registry,
					localrequire,
					combine,
					
					explorer
					) {

			_config = dojo.eval("[" + explorer + "]")[0];

			_infographic = _config.infoGraphic;
			console.log(_infographic);

			if (_infographic != undefined) {

				_infographic = localrequire.toUrl("./" + _infographic);

			}
			
			if (_config.ddText != undefined) {

				_ddText = _config.ddText;

			} else {

				_ddText = "Choose a Region";

			}
			
			
			if (_config.noZoom != undefined) {

				_noZoom = _config.noZoom;

			} else {

				_noZoom = false;

			}
			



           return declare(PluginBase, {
		       toolbarName: _config.name,
               toolbarType: "sidebar",
			   showServiceLayersInLegend: true,
               allowIdentifyWhenActive: true,
			   _hasactivated: false,
			   infoGraphic: _infographic, //"plugins/restoration_explorer/RestorationExplorer_c.jpg",
			   height: _config.pluginHeight,
			   width: _config.pluginWidth,
			   stateRestore: false,
			   hasCustomPrint: true, 
			   usePrintPreviewMap: true, 
			   previewMapSize: [1000, 600],
			   subs: false,
			   updated: false,

			beforePrint: function(printDeferred, $printArea, mapObject) {
				
				//var layer = new esri.layers.ArcGISDynamicMapServiceLayer(this.url);
				//layer.setVisibleLayers([0])
				
				console.log(this.currentLayer);
				
				
				if (this.isVector == true)  {

						TempcurrentLayer = new ArcGISDynamicMapServiceLayer(this.currentLayer.url);
						//TempcurrentLayer.setVisibleLayers([0])
						
						colorRF = dojo.clone(this.currentLayer.dynamicLayerInfos);
						console.log(this.currentLayer);
						TempcurrentLayer.setDynamicLayerInfos(colorRF);
						
						var layerDrawingOptions = [];
						var layerDrawingOption = new esri.layers.LayerDrawingOptions();

						//layerDrawingOption.renderer = renderer;
						
						ldo = dojo.clone(this.currentLayer.layerDrawingOptions);
						TempcurrentLayer.setLayerDrawingOptions(ldo);
						
						//layerDrawingOption.renderer = renderer;

						//layerDrawingOptions[1] = layerDrawingOption;
						//this.currentLayer.setLayerDrawingOptions(layerDrawingOptions);
					
					} else {
	
						params = new ImageServiceParameters();
						
						TempcurrentLayer = ArcGISImageServiceLayer(this.currentLayer.url, {
						  imageServiceParameters: params,
						  opacity: 1
						});	
						
						console.log(this.currentLayer);
						
						colorRF = dojo.clone(this.currentLayer.renderingRule);
						
						TempcurrentLayer.setRenderingRule(colorRF);
				
					} 
						
				mapObject.addLayer(TempcurrentLayer);
	

				console.log($printArea);
				$printArea.append("<div id='title'> NY Combine Habitat Report</div>");
				
				array.forEach(this.geography.tabs, lang.hitch(this,function(tab, i){
				
					console.log(tab);
					array.forEach(tab.items, lang.hitch(this,function(item, i){
					
						console.log(item.text, item.default);
					
					
					}));
				
				
				}));
				
				$printArea.append("<div id='tableWrapper'><div id='tableTitle'>Species with Suitable Habitat in Hexagon</div><table id='table' class='printTable'>");

                printDeferred.resolve();
            },

        activate: function () {
			
			this.combiner = new combine();

					if (this.currentLayer != undefined)  {

						this.currentLayer.setVisibility(true);

					}

					if (this.ancillaryLayer != undefined) {
						this.ancillaryLayer.setVisibility(true);
					}

          this.usableRegions = this.explorerObject.regions;

          if (this.stateRestore == false) {

            if (this._hasactivated == false) {
              this.rebuildOptions();
            }

  					if ((this._hasactivated == false) && (this.usableRegions.length == 1)) {
  						this.changeGeography(this.usableRegions[0], !(_noZoom));

  					};

        } else {

          if (this._hasactivated == false) {

            console.log(this.geography)
            this.rebuildOptions();
            this.changeGeography(this.geography, false);
            this.stateRestore = false;

          }


        }

        if (this.subs == true) {
          this.changeGeography(this.usableRegions[0], !(_noZoom));
        }

					this._hasactivated = true;

			   },
               deactivate: function () { },


               hibernate: function () {

			   //what is used to do

					if (this.currentLayer != undefined)  {

						this.currentLayer.setVisibility(false);

					}

					if (this.ancillaryLayer != undefined)  {

						this.ancillaryLayer.setVisibility(false);

					}


				// added to reset

				if (this.ancillaryLayer != undefined) {
					  this.map.removeLayer(this.ancillaryLayer)
				}


			    this.sliders = new Array();

				if (this.sliderpane != undefined) {

				  this.sliderpane.destroy();
				  this.map.removeLayer(this.currentLayer)

				}

				if (this.buttonpane != undefined) {

				  this.buttonpane.destroy();

				}
				
				if (this.buttonpane != undefined) {
					this.tabpan.destroy();
				}

				domStyle.set(this.textnode, "display", "");

        if (this.button != undefined) {
				      this.button.set("label",_ddText);
        }

				//this._hasactivated = false;

				this.explorerObject = dojo.eval("[" + explorer + "]")[0];

			   },

			     resize: function(w, h) {

					domStyle.set(this.container, 'overflow', 'hidden');
				 
					cdg = domGeom.position(this.container);


					if (cdg.h == 0) {

						this.sph = this.height - 155

					} else {

						this.sph = cdg.h-116;   //73 

					}

					
				  //if (this.tabpan != undefined) {
					//	domStyle.set(this.tabpan.domNode, "height", this.sph + "px");
				  //}
				  
				  this.tabpan.resize({"w" : cdg.w, "h" : this.sph})
				  
				  this.tabpan.layout();

				 },


				initialize: function (frameworkParameters) {

					declare.safeMixin(this, frameworkParameters);

					domClass.add(this.container, "claro");

					this.explorerObject = dojo.eval("[" + explorer + "]")[0];

					this.spinnerURL = localrequire.toUrl("./images/spinner.gif");

					console.log(this.explorerObject);
					
					this.ResetObject = lang.clone(this.explorerObject);


					if (this.explorerObject.betweenGroups == undefined) {
						this.explorerObject.betweenGroups = "+";
					}

					this.textnode = domConstruct.create("div", { innerHTML: "<p style='padding:8px'>" + this.explorerObject.text + "</p>" });
					dom.byId(this.container).appendChild(this.textnode);

					pslidernode = domConstruct.create("span", { innerHTML: "<span style='padding:5px'> </span>" });
					dom.byId(this.container).appendChild(pslidernode);

					nslidernode = domConstruct.create("span");
					dom.byId(this.container).appendChild(nslidernode);

          this.ddNode = domConstruct.create("span");
          dom.byId(this.container).appendChild(this.ddNode);

					this.refreshnode = domConstruct.create("span", {style: "display:none"});

					domClass.add(this.refreshnode, "plugin-report-spinner");

					this.refreshnode = domConstruct.create("span", {style: "display:none"}); //, innerHTML: "<img src=" + this.spinnerURL + ">"
					spinnernode = domConstruct.create("span", {style: "background: url(" + this.spinnerURL + ") no-repeat center center; height: 32px; width: 32px; display: inline-block; position: absolute; left: 45%;" });
					//domClass.add(this.refreshnode, "plugin-report-spinner");
					this.refreshnode.appendChild(spinnernode);
					dom.byId(this.container).appendChild(this.refreshnode);

					a = dojoquery(this.container).parent();

					this.infoarea = new ContentPane({
					  style:"z-index:10000; !important;position:absolute !important;left:310px !important;top:0px !important;width:350px !important;background-color:#FFF !important;padding:10px !important;border-style:solid;border-width:4px;border-color:#444;border-radius:5px;display: none",
					  innerHTML: "<div class='infoareacloser' style='float:right !important'><a href='#'>✖</a></div><div class='infoareacontent' style='padding-top:15px'>no content yet</div>"
					});

					dom.byId(a[0]).appendChild(this.infoarea.domNode)

					ina = dojoquery(this.infoarea.domNode).children(".infoareacloser");
					this.infoAreaCloser = ina[0];

					inac = dojoquery(this.infoarea.domNode).children(".infoareacontent");
					this.infoareacontent = inac[0];


					on(this.infoAreaCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.infoarea.domNode, 'display', 'none');
					}));


				},

        rebuildOptions: function() {

          domConstruct.empty(this.ddNode);

          menu = new DropDownMenu({ style: "display: none;"});

					domClass.add(menu.domNode, "claro");

					array.forEach(this.usableRegions, lang.hitch(this,function(entry, i){

/* 						layersRequest = esri.request({
						  url: entry.url,
						  content: { f: "json" },
						  handleAs: "json",
						  callbackParamName: "callback"
						});

						layersRequest.then(
						  lang.hitch(entry,function(response) {
							console.log(response);
							this.data = response;
						}), function(error) {
							alert("Error loading Restoration Dashboard Layers, Check to make sure service(s) are on.");
						}); */



						menuItem1 = new MenuItem({
							label: entry.name,
							//iconClass:"dijitEditorIcon dijitEditorIconSave",
							onClick: lang.hitch(this,function(e){this.changeGeography(entry, !(_noZoom))})
						});
						menu.addChild(menuItem1);

					}));



					this.button = new DropDownButton({
						label: _ddText,
						style: "margin-bottom:6px !important",
						dropDown: menu
					});

					dom.byId(this.ddNode).appendChild(this.button.domNode);


        },
		
		resetAll: function() {
		
				console.log("reset");
				
					try {
						selectedIndex = this.tabpan.selectedChildWidget.index;
						its = this.geography.tabs[selectedIndex].items;
					} catch(err) {
						selectedIndex = 0;
						its = this.geography.items
					}
				
				reseter = lang.clone(this.ResetObject);
				
				
				array.forEach(reseter.regions, lang.hitch(this,function(reg, t){
				
				  if (reg.name == this.geography.name) {
					  
					  outreg = reg;
					  
				  }
				
				}));
			
				this.changeGeography(outreg, false);
				
				tabs = this.tabpan.getChildren();
				
				this.tabpan.selectChild(tabs[selectedIndex]);
			
			
		},

		
		resetTab: function() {
		
				console.log("reset tab");

					try {
						selectedIndex = this.tabpan.selectedChildWidget.index;
						its = this.geography.tabs[selectedIndex].items;
					} catch(err) {
						selectedIndex = 0;
						its = this.geography.items
					}
				
				reseter = lang.clone(this.ResetObject);
			
				array.forEach(reseter.regions, lang.hitch(this,function(reg, t){
				
				  if (reg.name == this.geography.name) {
					  
					  outreg = reg;
					  
				  }
				
				}));
				
				this.geography.tabs[selectedIndex] = outreg.tabs[selectedIndex]
				
				this.changeGeography(this.geography, false);
				
				tabs = this.tabpan.getChildren();
				
				this.tabpan.selectChild(tabs[selectedIndex]);
			
		},		

        resetPanel: function() {
		
          if (this.ancillaryLayer != undefined) {
              this.map.removeLayer(this.ancillaryLayer)
          }

          if (this.sliderpane != undefined) {

            this.sliderpane.destroy();
            this.map.removeLayer(this.currentLayer)

          }

          if (this.buttonpane != undefined) {

            this.buttonpane.destroy();

          }
		  
		  if (this.tabpan != undefined) {
			 
			this.tabpan.destroy();
			
		  }


        },

		
		changeGeography: function(geography, zoomto) {

           if (geography.dataset == undefined) {
              this.isVector = false;
             } else {
              this.isVector = true;
             }

            if (zoomto == undefined) {
			
             zoomto = true;

            }

            this.geography = geography;


            this.sliders = new Array();

			        //this.legendContainer.innerHTML = this.toolbarName;
          this.resetPanel();

					//this.sliderpane = new ContentPane({
					//  style:"height:287px;border-top-style:groove !important"
					//});

					if (geography.tabs == undefined) {
						
						geography.tabs = new Array();
						geography.tabs.push({"name":""});
						geography.tabs[0].items = geography.items
						
					}
					
					console.log(geography.tabs);					
					
					if (geography.tabs.length == 1) {

						this.tabpan = new ContentPane({
							style:"padding: 8px"
							//style: "height: 100%; width: 100%;"
						});

						this.tabpan.layout = function() {console.log('layout')};

					} else {
						
						this.tabpan = new TabContainer({
							//style: "height: 100%; width: 100%;"
						});
						
						//this.tabpan.layout = function() {console.log('layout')};

					}
					
					
					//this.sliderpane = new ContentPane({
					  //style:"height:" + this.sph + "px;border-top-style:groove !important"
					//});

					dom.byId(this.container).appendChild(this.tabpan.domNode);


					this.buttonpane = new ContentPane({
					  style:"border-top-style:groove !important; height:80px;overflow: hidden !important;background-color:#F3F3F3 !important;padding:2px !important;", innerHTML: '<table style="width:100%;padding:0; margin:0"><tr><td style="padding:2px; margin:0"></td><td style="padding:2px; margin:0"></td style="padding:2px; margin:0"></tr><tr><td colspan="2" style="padding:2px; margin:0"></td></tr></table>'
					});

					dom.byId(this.container).appendChild(this.buttonpane.domNode);

					parser.parse();
					
					
					tds = dojoquery("td", this.buttonpane.domNode);
					
					ulnode = (dojoquery(tds[0]));
					
					thing = dojoquery(ulnode)[0];
					
					ulnode = domConstruct.create("span");
					
					thing.appendChild(ulnode);


					urnode = (dojoquery(tds[1]));
					
					thing = dojoquery(urnode)[0];
					
					urnode = domConstruct.create("span");
					
					thing.appendChild(urnode);
					
					
					llnode = (dojoquery(tds[2]));
					
					thing = dojoquery(llnode)[0];
					
					llnode = domConstruct.create("span");
					
					thing.appendChild(llnode);
					
/* 					exportButton = new Button({
						label: "Export",
						style:  "float:right !important;",
						onClick: function(){


							exportUrl = geography.url + "/exportImage";
							layersRequest = ESRIRequest({
							  url: exportUrl,
							  content: { f: "json" ,pixelType : "F32", format: "tiff", bbox: "-9852928.2643,3522013.8941000025,-9761488.2643,3630213.8941000025", noDataInterpretation: "esriNoDataMatchAny", interpolation: "RSP_BilinearInterpolation"},
							  handleAs: "json",
							  callbackParamName: "callback"
							});

							layersRequest.then(
							  function(response) {
								console.log("Success: ", response);
								window.open(response.href)
							}, function(error) {
								console.log("Error: ", error.message);
							});

							}
							//window.open(geography.url + "/exportImage")}
						});

					this.buttonpane.domNode.appendChild(exportButton.domNode); */

					SyncButton = new ToggleButton({
						label: "Sync Maps",
						checked: false,
						style:  "float:left !important; display:none;",
						onClick: lang.hitch(this, this.syncMaps)
						});
						
					ulnode.appendChild(SyncButton.domNode);

					
					if (geography.methods != undefined) {
						methodsButton = new Button({
							label: "Methods",
							style:  "float:right !important;",
							onClick: function(){window.open(geography.methods)}
							});

						urnode.appendChild(methodsButton.domNode);
					}
					
					if (geography.tabs.length > 1) {
						CombineButton = new ToggleButton({
							label: "View Combined Score",
							checked: false,
							style:  "float:right !important;"//,
							//onClick: function(){window.open(geography.methods)}
							});

						//this.buttonpane.domNode.appendChild(CombineButton.domNode);
						
						//CombineButton.startup();
						
					resetButton = new Button({
						label: "Reset Tab",
						style:  "float:left !important;",
						title: "Resets sliders to defaults (all Medium) for just the currently open tab.",
						onClick: lang.hitch(this, this.resetTab)
						});
					
					ulnode.appendChild(resetButton.domNode);
					
					}
					
					resetAllButton = new Button({
						label: "Reset All",
						style:  "float:left !important;",
						title: "Resets all sliders within the app, across all 4 tabs, to Medium.",
						onClick: lang.hitch(this, this.resetAll)
						});
					
					ulnode.appendChild(resetAllButton.domNode);
					
					if (this.explorerObject.mainToggle != undefined) {
						
					/*	
						if (this.explorerObject.mainToggle.default == undefined) {
						  this.explorerObject.mainToggle.default = 1;
						}

							//brtext = domConstruct.create("span", {style:"float:left !important;", innerHTML: "<br>"});
							//this.buttonpane.domNode.appendChild(brtext);
							
							mainchecknode = domConstruct.create("input", {style:"float:left !important;", innerHTML: ""});
							llnode.appendChild(mainchecknode);

									 this.MainCheck = new CheckBox({
										name: "ExplorerCheck",
										value: 1,
										title: this.explorerObject.mainToggle.text,
										checked: this.explorerObject.mainToggle.default,
										onChange: lang.hitch(this,function(e) {this.currentLayer.setVisibility(e)}),
										}, mainchecknode);

										parser.parse()

							mainchecknodetext = domConstruct.create("span", {style:"float:left !important;", innerHTML: this.explorerObject.mainToggle.text , for: this.MainCheck.id});
							llnode.appendChild(mainchecknodetext);

					*/

						    var trslider = new HorizontalSlider({
								name: "slider",
								value: 1,
								minimum: 0,
								maximum: 1,
								showButtons: false,
								intermediateChanges: true,
								style: "width:100px;",
								onChange: lang.hitch(this,function(e) {this.currentLayer.setOpacity(e)})
							})

							mainchecknodetext = domConstruct.create("span", {style:"float:left !important;", innerHTML: this.explorerObject.mainToggle.text });
							llnode.appendChild(mainchecknodetext);
							llnode.appendChild(trslider.domNode);							
						
					}

					domStyle.set(this.textnode, "display", "none");

					if (this.explorerObject.globalText != undefined) {

					explainText = domConstruct.create("div", {style:"margin-top:0px;margin-bottom:10px", innerHTML: this.explorerObject.globalText});
					//MUST ADD THIS BACK 
					//this.sliderpane.domNode.appendChild(explainText);

					}

					this.button.set("label",geography.name);

					ancillaryon = new Array();

					
					//if (geography.tabs != undefined) {
					
					//	localitems = geography.tabs[0].items;
					
					//} else {
						
					//	localitems = geography.items;
					//}

			if (geography.intro != undefined) {
				
						this.sliderpane = new ContentPane({
							style:"padding: 8px",
						//  style:"height:" + this.sph + "px !important",
						//style: "height: 100%; width: 100%;",
						  title: geography.intro.name,
						  index: -1,
						  content: geography.intro.text
						});	

						this.tabpan.addChild(this.sliderpane);						
			}					
					
			array.forEach(geography.tabs, lang.hitch(this,function(tab, t){

						this.sliderpane = new ContentPane({
							style:"padding: 8px",
						//  style:"height:" + this.sph + "px !important",
						//style: "height: 100%; width: 100%;",
						  title: tab.name,
						  index: t
						});	

						this.tabpan.addChild(this.sliderpane);
						//this.tabs.push(this.sliderpane);						
				
					itemIndex = 0;
					array.forEach(tab.items, lang.hitch(this,function(entry, i){

					/*
			if (this.explorerObject.mainToggle != undefined) {

                if (this.explorerObject.mainToggle.default == undefined) {
                  this.explorerObject.mainToggle.default = 1;
                }

							if (this.explorerObject.mainToggle.index == i) {
								mainchecknode = domConstruct.create("input", {style:"margin-top:0px;margin-bottom:10px;display:inline !important", innerHTML: ""});
								this.sliderpane.domNode.appendChild(mainchecknode);

										 this.MainCheck = new CheckBox({
											name: "ExplorerCheck",
											value: 1,
											title: this.explorerObject.mainToggle.text,
											checked: this.explorerObject.mainToggle.default,
											onChange: lang.hitch(this,function(e) {this.currentLayer.setVisibility(e)}),
											}, mainchecknode);

											parser.parse()

								mainchecknodetext = domConstruct.create("span", {style:"margin-top:0px;margin-bottom:10px;display:inline", innerHTML: this.explorerObject.mainToggle.text + "<br>", for: this.MainCheck.id});
								this.sliderpane.domNode.appendChild(mainchecknodetext);
							}
						}
*/


						if (entry.group == undefined) {

							entry.group = "ungrouped";

						}

						if (entry.type == "hr") {
							hrn = domConstruct.create("hr", {style:""});
							this.sliderpane.domNode.appendChild(hrn);
						}

						if (entry.type == "ancillary") {

							nslidernode = domConstruct.create("div");
							this.sliderpane.domNode.appendChild(nslidernode);

							   slider = new CheckBox({
								name: entry.group,
								value: entry.default,
								index: entry.index,
								minimum: entry.min,
								maximum: entry.max,
								title: entry.text,
								checked: entry.default,
								onChange: lang.hitch(this,function(e) {fx = lang.hitch(this,this.processAncillary);fx(e,entry)}),
								}, nslidernode);

								parser.parse()

							if (entry.default == 1) {
							  ancillaryon.push(entry)
							}

							if (entry.help != undefined) {
								nslidernodeheader = domConstruct.create("div", {style: "display:inline", innerHTML: "<span style='color:#000'> <a style='color:black' href='#' title='" + 'Click for more information.' + "'><img src='data:image/png;base64,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'></a>  " + entry.text + "</span><br>"});
							} else {
								nslidernodeheader = domConstruct.create("div", {style:"display:inline", innerHTML: " " + entry.text + "<br>"});
							}

							on(nslidernodeheader, "click", lang.hitch(this,function(e){
								domStyle.set(this.infoarea.domNode, 'display', '');
								this.infoareacontent.innerHTML = entry.help;
							}));

							this.sliderpane.domNode.appendChild(nslidernodeheader);

							nslidernodeheader = domConstruct.create("div", {style:"margin:3px", innerHTML: ""});
							this.sliderpane.domNode.appendChild(nslidernodeheader);

						}

						if (entry.type == "header") {

							nslidernodeheader = domConstruct.create("div", {style:"margin-top:0px;margin-bottom:10px", innerHTML: "<b>" + entry.text + ":</b>"});
							this.sliderpane.domNode.appendChild(nslidernodeheader);

						}

						if (entry.type == "text") {

							nslidernodeheader = domConstruct.create("div", {style:"margin-top:10px;margin-bottom:10px", innerHTML: entry.text});
							this.sliderpane.domNode.appendChild(nslidernodeheader);

						}

						if (entry.type == "layer") {

							steps = ((entry.max - entry.min) / entry.step) + 1;

							outslid = "";

							middle = Math.round((steps / 2) - 0.5)

							for (i=0; i<steps; i++)  {

							  if ((steps - 1)  == i) {
								outslid = outslid + "<li>High</li>"
							  } else if (i == 1) {

								outslid = outslid + "<li>Low</li>"
							  } else if (i == middle) {

								outslid = outslid + "<li>Medium</li>"
							  } else {

								outslid = outslid + "<li></li>"

								}

							}

							//alert(outslid);
							
			if (this.geography.tabs[t].sliderLabels == undefined) {
				lSliderLabels = this.geography.sliderLabels;	
			} else {
				lSliderLabels = this.geography.tabs[t].sliderLabels;
			}
			

              if (lSliderLabels != undefined) {

                outslid = "<li>" + lSliderLabels.join("</li><li>") + "</li>"

              }

							if (steps == 2) {

							nslidernode = domConstruct.create("div");
							this.sliderpane.domNode.appendChild(nslidernode);

							if (entry.group.slice(0,4) == "muex") {
								rorc = RadioButton;
							} else {
								rorc = CheckBox;
							}

							 slider = new rorc({
								name: this.sliderpane.id + "_" + entry.group,
								value: entry.default,
								index: entry.index,
                order: i,
								minimum: entry.min,
								maximum: entry.max,
								title: entry.text,
								checked: entry.default,
							    onChange: lang.hitch(this,function(){this.updateService()}),
								}, nslidernode);

								parser.parse()

							if (entry.visible == false)
							{ vtext = "display:none"
							  domStyle.set(slider.domNode, 'display', 'none');
							}
							else {vtext = "display:inline"}

							if (entry.help != undefined) {
								nslidernodeheader = domConstruct.create("span", {style: vtext, innerHTML: "<span style='color:#000'> <a style='color:black' href='#' title='" + 'Click for more information.' + "'><img src='data:image/png;base64,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'></a>  " + entry.text + " </span>"});
							} else {
								nslidernodeheader = domConstruct.create("span", {style: vtext, innerHTML: " " + entry.text + "<br>"});
							}

							on(nslidernodeheader, "click", lang.hitch(this,function(e){
								domStyle.set(this.infoarea.domNode, 'display', '');
								this.infoareacontent.innerHTML = entry.help;
							}));


							this.sliderpane.domNode.appendChild(nslidernodeheader);

							nslidernodeheader = domConstruct.create("div", {style:"margin:3px", innerHTML: ""});
							this.sliderpane.domNode.appendChild(nslidernodeheader);

							} else {
					

							if (entry.help != undefined) {
								nslidernodetitle = domConstruct.create("span", {innerHTML: "<span style='color:#000'> <a style='color:black' href='#' title='" + 'Click for more information.' + "'><img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAEZ0FNQQAAsY58+1GTAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAI2SURBVHjarJPfSxRRFMc/rrasPxpWZU2ywTaWSkRYoaeBmoVKBnwoJfIlWB8LekiaP2N76S9o3wPBKAbFEB/mIQJNHEuTdBmjUtq1mz/Xmbk95A6u+lYHzsvnnvO995xzTw3HLJfLDQNZIHPsaArIm6b54iisOZJ4ERhVFCWtaRqqqqIoCgBCCFzXxbZthBCzwIBpmquhwGHyTHd3d9wwDAqlA6a/bFMolQHobI5y41Ijnc1nsCwLx3E2gV7TNFfrDh8wWknOvy9hffoNwNNMgkKxzMu5X7z5KDCuniVrGABxx3FGgd7aXC43rCjKw6GhIV68K/J6QRBISSAl6fP1bO0HzH/bJZCSpY19dsoB9/QeHMdp13W9EAGymqaxUiwzNr+J7wehP59e5+2SqGJj85usFMtomgaQjQAZVVWZXKwO7O9SeHang8fXE1Xc9wMmFwWqqgJkIgCKorC8sYfnB6F/Xt+lIRpBSqq45wcsb+yFE6o0Ed8P8LwgnO+Mu80PcQBQxSuxFYtU5pxsjZ64SUqJlPIET7ZGEUKEAlOu69LXFT9FgFNL6OuK47ouwFQEyNu2TSoRYzDdguf9LUVLNpFqi5Fqi6Elm0I+mG4hlYhh2zZAvnZ8fHxW1/W7Qoj2B7d7Ebsec+4WzY11TCyUmFgosXcQ8LW0z/1rCZ7c7MCyLNbW1mZN03xUaeKA4zgzQHzEMOjvaeHVh58sft8B4Ep7AyO3LnD5XP3Rrzzw/5bpX9b5zwBaRXthcSp6rQAAAABJRU5ErkJggg=='></a>  " + entry.text + " </span>"});
							} else {
								nslidernodetitle = domConstruct.create("span", {innerHTML: entry.text});
							}
							

							on(nslidernodetitle, "click", lang.hitch(this,function(e){
								domStyle.set(this.infoarea.domNode, 'display', '');
								this.infoareacontent.innerHTML = entry.help;
							}));

							//nslidernodetitle = domConstruct.create("div", {innerHTML: entry.text});
							this.sliderpane.domNode.appendChild(nslidernodetitle);
							
							if (entry.ancillary != undefined) {
							//ancillaryNode = domConstruct.create("div", {style: "display:inline", innerHTML: "Hello "});
							//this.sliderpane.domNode.appendChild(ancillaryNode);
							
							ancillaryNode = domConstruct.create("span");
							this.sliderpane.domNode.appendChild(ancillaryNode);
							
							 var checkBox = new CheckBox({
									name: "ExplorerAncillaryCheck",
									value: entry.text,
									checked: false,
									onChange: lang.hitch(this,function(b){
										
										if (!b) {
										
											if (this.ancillaryLayer2 != undefined) {
												  this.map.removeLayer(this.ancillaryLayer2)
												   dojo.destroy(this.ancillaryLayer2);
												  console.log('removean');
											}
										
										} else {
											
											this.addAncillary(b,entry.ancillary, entry.text)
											
										}
										
										}),
										
								}, ancillaryNode);
								
								parser.parse();
//ancillary
						
							}	

 							nslidernode = domConstruct.create("div");
							this.sliderpane.domNode.appendChild(nslidernode);
							

							labelsnode = domConstruct.create("ol", {"data-dojo-type":"dijit/form/HorizontalRuleLabels", container:"bottomDecoration", style:"height:1.5em;font-size:75%;color:gray;", innerHTML: outslid})
							nslidernode.appendChild(labelsnode);


							slider = new HorizontalSlider({
								name: entry.group,
								"data-mexslider": "mexSlider",
								value: entry.default,
								minimum: entry.min,
								maximum: entry.max,
								showButtons:false,
								title: entry.text,
								//intermediateChanges: true,
								tabindex: t,
								order: itemIndex,
								discreteValues: steps,
								index: entry.index,
								onClick: lang.hitch(this,function(b){ 

									allChecks = dojoquery("[name=ExplorerAncillaryCheck]");
									
									array.forEach(allChecks, lang.hitch(this,function(checkerBox, j){
										
											cb = registry.byId(checkerBox.id);
											cb.set("checked", false);
											
									}));
								
								}),
								onChange: lang.hitch(this,function(){this.updateService()}),
								style: "width:240px;margin-top:10px;margin-bottom:20px"
							}, nslidernode);

							parser.parse()

							}

							this.sliders.push(slider);

						}
            itemIndex = itemIndex + 1
					}));

				}));
				

			if (geography.combined != undefined) {
				
						this.sliderpane = new ContentPane({
							style:"padding: 8px",
						//  style:"height:" + this.sph + "px !important",
						//style: "height: 100%; width: 100%;",
						  title: geography.combined.name,
						  index: geography.tabs.length,
						  content: geography.combined.text
						});	

						this.tabpan.addChild(this.sliderpane);						
			}
				
			//	if (geography.combined.selected == true) {
				
				
		//			this.tabpan.selectChild(this.sliderpane);
				
			//	}
			
				

				
					aspect.after(this.tabpan, "selectChild", lang.hitch(this,function (e, o) {

					
						selindex = o[0].index;

						if (selindex == geography.tabs.length) {

						a = lang.hitch(this,function(){this.doCombined()})
						a();
						
						} else {
						
						a = lang.hitch(this,function(){this.updateService()})
						a();
						
						}

						this.resize();


					}));
				
				this.tabpan.startup();
				
				
				
					if (this.isVector == true)  {

						this.currentLayer = new ArcGISDynamicMapServiceLayer(geography.url);

					
					} else {

						params = new ImageServiceParameters();
						//params.noData = 0;

						this.currentLayer = ArcGISImageServiceLayer(geography.url, {
						  imageServiceParameters: params,
						  opacity: 1
						});

						//this.sliderpane.set("tooltip", "Yo")


					}

					dojo.connect(this.currentLayer, "onLoad", lang.hitch(this,function(e){


											//alert(this.currentLayer.bands);

											//array.forEach(this.currentLayer.bands, function(thing) {alert(thing.max)});

											//bc = this.currentLayer.bandCount
											//for (var i=1; i<=bc; i++) {
											//		alert(i);
											//	}
											//alert(zoomto)
											this.updateService(zoomto);

											}));



					dojo.connect(this.currentLayer, "onUpdateStart", lang.hitch(this,function () {
							console.log("Update started...");
							domAttr.set(this.refreshnode, "style", "display:");
						} ));

					dojo.connect(this.currentLayer, "onUpdateEnd", lang.hitch(this,function () {
							//console.log(this.currentLayer.fullExtent)
							console.log("Update Ended...");
							domAttr.set(this.refreshnode, "style", "display:none");
						} ));

					//this.MainCheck.setChecked(true)

					//domStyle.set(this.MainCheck.domNode, "display", "");


					this.map.addLayer(this.currentLayer);

						if (geography.ancillaryUrl != undefined) {

							this.ancillaryLayer = new ArcGISDynamicMapServiceLayer(geography.ancillaryUrl,{
									useMapImage: true
									}
								  );


							slayers = new Array();
							array.forEach(ancillaryon, lang.hitch(this,function(entry, i){

								slayers.push(entry.index)


							}))

							this.ancillaryLayer.setVisibleLayers(slayers)

							this.map.addLayer(this.ancillaryLayer);

						}



					this.resize();
					
					

			   },
			   
			   
			   syncMaps: function() {

					allslids = dojoquery("[data-mexslider=mexSlider]");
			   
					console.log(allslids);
			   
					array.forEach(allslids, lang.hitch(this,function(entry, i){
						
						sl = registry.byId(entry);
						//console.log(sl.getvalue());
					  
					}));

					
				 
			   },
			   
			   addAncillary: function(b,ancillary, compText) {

									
			   
						//if (b) {
					
							this.ancillaryLayer2 = new ArcGISDynamicMapServiceLayer(ancillary.url,{
									useMapImage: true
									}
								  );
								  
							this.ancillaryLayer2.setVisibleLayers(ancillary.show)

							this.map.addLayer(this.ancillaryLayer2);
							
							allChecks = dojoquery("[name=ExplorerAncillaryCheck]");
							
							array.forEach(allChecks, lang.hitch(this,function(checkerBox, j){

								if (checkerBox.value != compText) {
									//alert('');
									cb = registry.byId(checkerBox.id);
									cb.set("checked", false);
								//checkerBox.checked = false;
									//dojoquery(checkerBox).set("checked", false);
								}
							
							}));
							
						//} else {


						
							
						//}
				   
			   },

			   processAncillary: function(e,entry) {


				slayers = this.ancillaryLayer.visibleLayers;


				if (e == false) {

				outslayers = new Array();

				for(i in slayers){
					if(slayers[i] != entry.index){
						  outslayers.push(slayers[i])
						}
				}

						array.forEach(this.geography.items, lang.hitch(this,function(gitem, j){

							  if (gitem.type == "ancillary") {
								if (gitem.index == entry.index) {

									gitem.default = 0;

								}
							  }

						}));

				} else {

				slayers.push(entry.index)
				outslayers = slayers;

						array.forEach(this.geography.items, lang.hitch(this,function(gitem, j){

							  if (gitem.type == "ancillary") {
								if (gitem.index == entry.index) {

									gitem.default = 1;

								}
							  }

						}));

				}

				this.ancillaryLayer.setVisibleLayers(outslayers)

			   },
			   

			   getFormula: function(selectedIndex) {
				
					this.BandFormula = new Array();
					this.GroupTotals = new Array();

					cgroup = "";

					array.forEach(this.sliders, lang.hitch(this,function(entry, i){
						
					  if (selectedIndex == entry.tabindex) {

						if (entry.name != cgroup) {

							if (cgroup != "") {

								this.BandFormula.push(cbf)
								this.GroupTotals.push(hottytot)
							}

							cbf = new Array();
							hottytot = 0;

							cgroup = entry.name;

						}

						if (entry.checked != undefined) {
							if (entry.checked == true) {
								entry.value = 1;
							} else {
								entry.value = 0;
							}
						}
					  

            console.log("WW%%%%",this.geography, entry, entry.value, entry.order)

			
			
            this.geography.tabs[selectedIndex].items[entry.order].default = entry.value;
            console.log("%%%%",this.geography, entry, entry.value, entry.order)

						if (entry.value > 0) {
							cbf.push("(" + entry.value + " * " + entry.index + ")");
              //hottytot.push(entry.value)
              hottytot = hottytot + entry.value;
						}

						array.forEach(this.geography.tabs[selectedIndex].items, lang.hitch(this,function(gitem, j){

							  if (gitem.type == "layer") {
								if (gitem.index == entry.index) {

									gitem.default = entry.value;

								}
							  }

						}));

					}
					}));

					this.BandFormula.push(cbf);
					this.GroupTotals.push(hottytot);

					outform = new Array();

					array.forEach(this.BandFormula, lang.hitch(this,function(bgroup, i){

					 if (this.explorerObject.averageGroups == true) {
						  if (bgroup.length > 0) {
							outform.push("((" + bgroup.join(" + ") + ") / " + this.GroupTotals[i] + ")");
						  }
					  } else {
						outform.push("(" + bgroup.join(" + ") + ")");
					  }
					}));

					//alert(this.BandFormula.join(" + "));
					
					return outform.join(" " + this.explorerObject.betweenGroups + " ");

				
			   },
	
			   doCombined: function() {
				   
				   //this.currentLayer.show();
				   this.currentLayer.setVisibility(true);
				   this.legendContainer.innerHTML  = ""
				   
					formulas = new Array();
				   
					array.forEach(this.geography.tabs, lang.hitch(this,function(tab, t){
						formula = this.getFormula(t);
						formulas.push(formula);
					}));
					
					console.log(formulas);
					
					if (this.isVector == true)  {
						

						rfout = this.combiner.vectorCombineFunction(formulas, this.geography);
						

						//console.log("SELECT " + oFields + ", " + rfout + " AS score FROM " + this.geography.dataset);
	
						
						var dynamicLayerInfos = [];
						var dynamicLayerInfo = new esri.layers.DynamicLayerInfo();
						dynamicLayerInfo.id = 1;
						dynamicLayerInfo.name = this.toolbarName + " - " + this.geography.name;
						var dataSource = new esri.layers.QueryDataSource();
						dataSource.workspaceId = this.geography.workspaceId;
						dataSource.geometryType = this.geography.geometryType;
						dataSource.query = rfout[0]; //"SELECT " + oFields + ", " + rfout + " AS score FROM " + this.geography.dataset;
						dataSource.oidFields = ["objectid"]

						//minquery = "SELECT " + this.formula + " AS score FROM " + this.geography.dataset

						this.layerSource = new esri.layers.LayerDataSource();
						this.layerSource.dataSource = dataSource;
						dynamicLayerInfo.source = this.layerSource;
						dynamicLayerInfos.push(dynamicLayerInfo);
					
						
						console.log(rfout);
						
						this.currentLayer.setDynamicLayerInfos(dynamicLayerInfos);
						
						
						var layerDrawingOptions = [];
						var layerDrawingOption = new esri.layers.LayerDrawingOptions();

						layerDrawingOption.renderer = rfout[1];

						layerDrawingOptions[1] = layerDrawingOption;
						this.currentLayer.setLayerDrawingOptions(layerDrawingOptions);

						
						//alert('');
						//var queryTask = new QueryTask(this.currentLayer.url + "/dynamicLayer", { source: this.layerSource });

						//var allFields = this.geography.reqFields.concat(indFields);
						//allFields.push("score");
						
						
						//alert("Vector Combined Score Not Completely Implemented Yet");	
						
					
					} else {
						
						//alert('');
						
						rfout = this.combiner.combineFunction(formulas);
					
						
						//rfout = poopy.combine;
						
						/*
						colorRF = new RasterFunction();
						colorRF.functionName = "Colormap";
						colorRF.variableName = "riskOutput";
						colorRF.functionArguments = {
						  "Colormap" : lcolorRamp,
						  "Raster" : rf  //use the output of the remap rasterFunction for the Colormap rasterFunction
						};
						*/
						
						this.legendContainer.innerHTML = rfout.legendHTML
						this.currentLayer.setRenderingRule(rfout.renderRule);
						
						
					}
				
			   },

			   updateService: function(zoomto) {
				   
				   
				    
				   this.legendContainer.innerHTML  = ""

					if (zoomto == undefined) {

						zoomto = false;

					}

					console.log(this.sliders)
					
					try {
					selectedIndex = this.tabpan.selectedChildWidget.index;
					orgselectedIndex = this.tabpan.selectedChildWidget.index;
					
					} catch(err) {
						
					selectedIndex = 0
					orgselectedIndex = 0
					
					}
					//if ((selectedIndex > -1)  && (this.updated == true)) {
						
					try {
						its = this.geography.tabs[selectedIndex].items;
					} catch(err) {
						selectedIndex = 0;
						its = this.geography.items
					}
			
					//this.currentLayer.show();
					this.currentLayer.setVisibility(true);
					this.updated = true;
				
					//perhaps this needs to be done sometime but it appears to work now.
					//formget = lang.hitch(this,this.getFormula(selectedIndex))
					this.formula = this.getFormula(selectedIndex);
					
					console.log(this.formula);
					

					if (this.isVector == true)  {

						indFields = []

						array.forEach(its, lang.hitch(this,function(item, i){

						 if (item.type == "layer") {
							indFields.push(item.index);
						  }

						}));


						oFields = this.geography.reqFields.join(", ");
						iFields = indFields.join(", ");

						if (this.formula == "") {

							this.formula = "0::integer";

						}


						console.log("SELECT " + oFields + ", " + iFields + ", " + this.formula + " AS score FROM " + this.geography.dataset);

						var dynamicLayerInfos = [];
						var dynamicLayerInfo = new esri.layers.DynamicLayerInfo();
						dynamicLayerInfo.id = 1;
						dynamicLayerInfo.name = this.toolbarName + " - " + this.geography.name;
						var dataSource = new esri.layers.QueryDataSource();
						dataSource.workspaceId = this.geography.workspaceId;
						dataSource.geometryType = this.geography.geometryType;
						dataSource.query = "SELECT " + oFields + ", " + iFields + ", " + this.formula + " AS score FROM " + this.geography.dataset;
						dataSource.oidFields = ["objectid"]

						minquery = "SELECT " + this.formula + " AS score FROM " + this.geography.dataset

						this.layerSource = new esri.layers.LayerDataSource();
						this.layerSource.dataSource = dataSource;
						dynamicLayerInfo.source = this.layerSource;
						dynamicLayerInfos.push(dynamicLayerInfo);

						this.currentLayer.setDynamicLayerInfos(dynamicLayerInfos);

						var queryTask = new QueryTask(this.currentLayer.url + "/dynamicLayer", { source: this.layerSource });

						var allFields = this.geography.reqFields.concat(indFields);
						allFields.push("score");

						// ***************** Old style classification done on Client **************  FOR SOME REASON THIS IS ACTUALLY FASTER
						//console.log(allFields);
						this.dli = dynamicLayerInfos;

						query = new esriQuery();
						query.returnGeometry = false;
						query.outFields = allFields;
						query.outFields =["score"]
						query.where = this.geography.reqFields[0] + " > -1";
						//query.geometryPrecision = 0;
						//query.maxAllowableOffset = 10000;

						//domAttr.set(this.refreshnode, "style", "display:");
						
						queryTask.execute(query, lang.hitch(this,function(results) {this.showResults(results)}));



						// ***************** CLASSIFICATION DONE ON SERVER **************  FOR SOME REASON THIS IS ACTUALLY SLOWER

						var dataSourcecls = new esri.layers.QueryDataSource();
						dataSourcecls.workspaceId = this.geography.workspaceId;
						dataSourcecls.query = "select 1::integer as objectid, array_to_string(classify('EqualInterval'," + this.geography.colorRamp.length + ",score), ',') as classes from (" + minquery + ") as foo";

						dataSourcecls.oidFields = ["objectid"]

						var layerSource2 = new esri.layers.LayerDataSource();
						layerSource2.dataSource = dataSourcecls;

						console.log(layerSource2)
						var queryTask = new QueryTask(this.currentLayer.url + "/dynamicLayer", { source: layerSource2 });

						query = new esriQuery();
						query.returnGeometry = false;
						//query.outFields = allFields;
						query.outFields =["classes"]
						query.where = "objectid" + " = 1";

						//domAttr.set(this.refreshnode, "style", "display:");

						//queryTask.execute(query, lang.hitch(this,this.updateRenderer));

					   if (zoomto == true) {
						dataSourceex = new esri.layers.QueryDataSource();
						dataSourceex.workspaceId = this.geography.workspaceId;
						dataSourceex.query = "select 1::integer as objectid, ST_AsText(ST_Envelope(ST_Collect(shape))) as extent FROM "+ this.geography.dataset;

						dataSourceex.oidFields = ["objectid"]

						layerSourcex = new esri.layers.LayerDataSource();
						layerSourcex.dataSource = dataSourceex;

						queryTask = new QueryTask(this.currentLayer.url + "/dynamicLayer", { source: layerSourcex });

						query = new esriQuery();
						query.returnGeometry = false;
						//query.outFields = allFields;
						query.outFields =["extent"]
						query.where = "objectid" + " = 1";

						//domAttr.set(this.refreshnode, "style", "display:");


						queryTask.execute(query, lang.hitch(this,this.zoomQextent));

					  }

					} else {

					    if (zoomto == true) {
							this.map.setExtent(this.currentLayer.fullExtent, true);
						}

						 rasterFunction = new RasterFunction();
						// {
        // "rasterFunction": "Stretch",
        // "rasterFunctionArguments": {
            // "StretchType": 5,
            // "DRA": true,
            // "Min": 0,
            // "Max": 255,
            // "UseGamma": false,
            // "OutputPixelType": "U8"
        // },
        // "Raster": {
            // "rasterFunction": "BandArithmetic",
            // "rasterFunctionArguments": {
                // "Method": 0,
                // "BandIndexes": "(B3 * 2) + (B1 * 1) + (B2 * 4) + (B4 * 1) + (B5 * 4) + (B6 * 1)"
            // },
            // "outputPixelType": "F32",
            // "variableName": "Raster"
        // }
    // }
//	}
//			);

		//alert(this.formula);

	  if (this.geography.tabs[selectedIndex].colorRamp == undefined) {
		lcolorRamp = this.geography.colorRamp;
	  } else {
		lcolorRamp = this.geography.tabs[selectedIndex].colorRamp;
	  }
	  
	  if (this.geography.tabs[selectedIndex].inputRanges == undefined) {
		linputRanges = this.geography.inputRanges;
	  } else {
		linputRanges = this.geography.tabs[selectedIndex].inputRanges;
	  }

	  if (this.geography.tabs[selectedIndex].outputValues == undefined) {
		loutputValues = this.geography.outputValues;
	  } else {
		loutputValues = this.geography.tabs[selectedIndex].outputValues;
	  }	  
	  
	  
		
      if (this.formula == "") {this.formula = "(B1 * 0)"};
	  
			rasterFunction.functionName = "BandArithmetic";
						arguments = {"Raster" : "$$"};
						arguments.Method= 0;
						arguments.BandIndexes = this.formula;
						rasterFunction.arguments = arguments;
						rasterFunction.variableName = "riskOutput";
            rasterFunction.outputPixelType = "U8";

            rf = new RasterFunction();
            rf.functionName = "Remap";
            rf.functionArguments = {
              "InputRanges" : linputRanges,
              "OutputValues" : loutputValues,
              "Raster" : rasterFunction
            };
            rf.variableName = "riskOutput";
            rf.outputPixelType = "U8";

            colorRF = new RasterFunction();
            colorRF.functionName = "Colormap";
            colorRF.variableName = "riskOutput";
            colorRF.functionArguments = {
              "Colormap" : lcolorRamp,
              "Raster" : rf  //use the output of the remap rasterFunction for the Colormap rasterFunction
            };

						this.currentLayer.setRenderingRule(colorRF);

					   //legenddiv = domConstruct.create("img", {src:"height:400px", innerHTML: "<b>" + "Legend for Restoration"  + ":</b>"});
					   //dom.byId(this.legendContainer).appendChild(this.legenddiv);
             innerSyms = ""
             array.forEach(lcolorRamp, lang.hitch(this,function(cColor, i){

               innerSyms = innerSyms + '<rect x="0" y ="'+ (i * 30) + '" width="30" height="20" style="fill:rgb('+ cColor[1] + "," + cColor[2] + "," + cColor[3] + ');stroke-width:0;stroke:rgb(0,0,0)" />'


             }));

			 if ( this.geography.outputLabels == undefined) {
				 
				 this.geography.outputLabels = [{text:"Low", "percent": "0"},{text:"Medium", "percent": "50"},{text:"High", "percent": "100"}]
				 
			 //} else {
				 
			 }	 
				 
			// }
			

			 
             lh = ((lcolorRamp.length) * 30) + 10
             maxy = ((lcolorRamp.length) * 30) - 30

			labs = ""
			
			array.forEach(this.geography.outputLabels, lang.hitch(this,function(lab, i){
				console.log(lab);
				labs = labs + '<text x="35" y="' +((maxy * (lab.percent / 100))  + 15) + '" fill="black">' + lab.text + '</text>'
				
			}));
			 
			 console.log(labs)
			 
			this.legendContainer.innerHTML = '<div style="margin-bottom:7px">' + this.toolbarName + '</div>'
             + '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="500px" height="' + lh + '">'
             + innerSyms + labs
			 
			 
             //+ '<text x="35" y="15" fill="black">Low</text>'
             //+ '<text x="35" y="' + ((maxy + 15) / 2) + '" fill="black">Medium</text>'
             //+ '<text x="35" y="' + maxy + '" fill="black">High</text></svg>'

					   //noleg = dom.byId("legend-0_msg")
					   //domStyle.set(noleg, "display", "none");

					}
					
					if (orgselectedIndex > -1) {
					
						//this.currentLayer.show();
						this.currentLayer.setVisibility(true);
					
					} else {
						
						//this.currentLayer.hide();
						this.currentLayer.setVisibility(false);
						//setTimeout(lang.hitch(this,function() {this.currentLayer.hide();}), 500);
						
					}
			   },

			   zoomQextent: function(results) {

				exesraw = results.features[0].attributes['extent'].replace("POLYGON((","").replace("))","")
				allexsraw = exesraw.split(",")

				xmin = parseFloat(allexsraw[0].split(" ")[0])
				ymin = parseFloat(allexsraw[0].split(" ")[1])

				xmax = parseFloat(allexsraw[2].split(" ")[0])
				ymax = parseFloat(allexsraw[2].split(" ")[1])


				console.log(xmin,ymin,xmax,ymax)
				newextent = new Extent(xmin,ymin,xmax,ymax, new SpatialReference({ wkid:3857 }));

				this.map.setExtent(newextent, true);

			   },

			   updateRenderer: function(results) {

			   console.log(results)

			   			if (this.geography.defaultSymbol.type ==  "esriSMS") {
						  SYM = SimpleMarkerSymbol;
						}

						if (this.geography.defaultSymbol.type ==  "esriSLS") {
						  SYM = SimpleLineSymbol;
						}

						if (this.geography.defaultSymbol.type ==  "esriSFS") {
						  SYM = SimpleFillSymbol;
						}

						tranyval = 1;

						sbrks = "[" + results.features[0].attributes['classes'] + "]"

						brks = dojo.eval(sbrks)

						console.log (brks)


						var symbol = new SYM(this.geography.defaultSymbol)

 						if (brks[0] == brks[brks.length-1]) {

							var renderer = new esri.renderer.ClassBreaksRenderer(symbol, "score");
							renderer.addBreak({minValue:-Infinity, maxValue:Infinity, symbol: new SYM(this.geography.defaultSymbol),label:"All variables were excluded by user",description:"All variables were excluded by user"});

						} else {


							var renderer = new esri.renderer.ClassBreaksRenderer(symbol, "score");

							array.forEach(this.geography.colorRamp, lang.hitch(this,function(cColor, i){

								lab = ""
								desc = ""

								if ((i+1) == this.geography.colorRamp.length) {
								 maxB = Infinity;
								 lab = "High";
								} else {
								 maxB = brks[i+1];
								}

								if (i == 0) {
								 minB = -Infinity;
								 lab = "Low";
								} else {
								 minB = brks[i];
								}


								nsym = lang.clone(this.geography.defaultSymbol);
								nsym.color = cColor;

								renderer.addBreak({minValue:minB, maxValue: maxB, symbol: new SYM(nsym),label:lab,description:lab});


							}));


						}


						var layerDrawingOptions = [];
						var layerDrawingOption = new esri.layers.LayerDrawingOptions();

						layerDrawingOption.renderer = renderer;

						layerDrawingOptions[1] = layerDrawingOption;
						this.currentLayer.setLayerDrawingOptions(layerDrawingOptions);

			   },

			   showResults: function(results) {


					maxscore = -9999999999999999999
					minscore = 9999999999999999999

					//console.log(results);
					array.forEach(results.features, lang.hitch(this,function(feat, i){

						if (feat.attributes['score'] > maxscore) {maxscore = feat.attributes['score']};
						if (feat.attributes['score'] < minscore) {minscore = feat.attributes['score']};

					}))

						//alert(minscore);

						//alert(this.geography.colorRamp.length);

						if (this.geography.defaultSymbol.type ==  "esriSMS") {
						  SYM = SimpleMarkerSymbol;
						}

						if (this.geography.defaultSymbol.type ==  "esriSLS") {
						  SYM = SimpleLineSymbol;
						}

						if (this.geography.defaultSymbol.type ==  "esriSFS") {
						  SYM = SimpleFillSymbol;
						}

						tranyval = 1;

						brk = ((maxscore - minscore) / this.geography.colorRamp.length);


						var symbol = new SYM(this.geography.defaultSymbol)

 						if (minscore == maxscore) {

							var renderer = new esri.renderer.ClassBreaksRenderer(symbol, "score");
							renderer.addBreak({minValue:-Infinity, maxValue:Infinity, symbol: new SYM(this.geography.defaultSymbol),label:"All variables were excluded by user",description:"All variables were excluded by user"});

						} else {


							var renderer = new esri.renderer.ClassBreaksRenderer(symbol, "score");

							array.forEach(this.geography.colorRamp, lang.hitch(this,function(cColor, i){

								lab = ""
								desc = ""

								if ((i+1) == this.geography.colorRamp.length) {
								 maxB = Infinity;
								 lab = "High";
								} else {
								 maxB = minscore + (brk * (i+1));
								}

								if (i == 0) {
								 minB = -Infinity;
								 lab = "Low";
								} else {
								 minB = minscore + (brk * i);
								}

								nsym = lang.clone(this.geography.defaultSymbol);
								nsym.color = cColor;

								renderer.addBreak({minValue:minB, maxValue: maxB, symbol: new SYM(nsym),label:lab,description:lab});


							}));


						}


						var layerDrawingOptions = [];
						var layerDrawingOption = new esri.layers.LayerDrawingOptions();

						layerDrawingOption.renderer = renderer;

						layerDrawingOptions[1] = layerDrawingOption;
						this.currentLayer.setLayerDrawingOptions(layerDrawingOptions);

				//alert('finish')
			   },

			   identify: function(point, screenPoint, processResults) {


				   identifyer = new esri.tasks.IdentifyTask(this.currentLayer.url, { source: this.layerSource });
				   identifyParams = new IdentifyParameters();
				   identifyParams.dynamicLayerInfos = this.dli;
				   identifyParams.tolerance = 3;
					identifyParams.returnGeometry = false;
					identifyParams.layerIds = [0,1];
					identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
					identifyParams.width  = this.map.width;
					identifyParams.height = this.map.height;
					identifyParams.mapExtent = this.map.extent;
					identifyParams.geometry = point;

				   identifyer.execute(identifyParams, lang.hitch(this,function(identifyResults) {
						processResults("<br> Computed Score at Mouse Click: <b>" + identifyResults[0].feature.attributes.score);
				   }));


/* 				   idTask = new esri.tasks.ImageServiceIdentifyTask(this.geography.url);
				   identifyParams = new ImageServiceIdentifyParameters();
				   identifyParams.returnGeometry = false;
				   identifyParams.geometry = point;
				   //identifyParams.renderingRule = this.renderingRule;


				   idTask.execute(identifyParams, lang.hitch(this,function(identifyResults) {

								if (identifyResults.value != "NoData") {

									idtable = '<br><table border="1"><tr><th width="50%"><center>Variable</center></th><th width="25%"><center>Value</center></th><th width="25%"><center>Weight</center></th></tr>'

									identifyValues = dojo.eval("[" + identifyResults.value + "]")

									replacedFormula = this.formula;
									varFormula = this.formula;

									array.forEach(identifyValues, lang.hitch(this,function(idval, j){

										replacedFormula = replacedFormula.replace("B"+(j+1), idval);

										array.forEach(this.sliders, lang.hitch(this,function(slid, i){
											ci = j+1;

											if (slid.value == 0) {
												outvaluetext = "Not Included";
											} else if (slid.value == 1) {
												if (slid.checked == true) {
												  outvaluetext = "Included";
												} else {
												  outvaluetext = slid.value;
												}
											} else {
											   outvaluetext = slid.value;
											}

											if (ci == slid.index.replace("B","")) {
													idtable = idtable + ('</tr><tr><td>' + slid.title + '</td><td>' + idval.toFixed(2).replace(".00","") + '</td><td>' + outvaluetext + '</td></tr>')
													varFormula = varFormula.replace("B"+(j+1), slid.title);
											}

										}));

									}));

									//alert(dojo.eval(replacedFormula))

									console.log(identifyResults);

									idtable = idtable + '</table>'

									processResults("<br> Value at Mouse Click: <b>" + dojo.eval(replacedFormula).toFixed(3).replace(".000", '') + "</b><br>" + idtable + "Formula: <br>" + varFormula);

								} else {

									processResults("");

								}

								})); */

					//console.log(point)
					//console.log(screenPoint)

			   },

        getState: function () {

				   state = new Object();
           state.geography = this.geography;
           state.mainToggleChecked = 1;

				   return state

				},


        setState: function (state) {

                 this.stateRestore = true;
                 this.geography = state.geography;
                 //state.mainToggleChecked = 1;

				         console.log(state)

				},

        subregionActivated: function(subregion) {

            console.debug('now using subregion ' + subregion.display);
            this.usableRegions = new Array();

            array.forEach(this.explorerObject.regions, lang.hitch(this,function(region, i){
              if (region.name == subregion.id) {
                this.usableRegions.push(region);
              }
            }));

            this.subs = true;
            //domConstruct.empty(this.regionChooserContainer);

            //console.log(this.mainData);
            //insert
            this.rebuildOptions();

        },

          subregionDeactivated: function(subregion) {

            console.debug('now leaving subregion ' + subregion.display);
            this.subs = false;
            //domConstruct.empty(this.regionChooserContainer);

            this.usableRegions = this.explorerObject.regions;

            this.rebuildOptions();

        }


           });
       });
