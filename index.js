// https://nodejs.dev/learn/the-nodejs-fs-module
const fs = require("fs")

// https://openlayers.org/en/latest/examples/vector-layer.html
import "ol/ol.css"
import GeoJSON from "ol/format/GeoJSON"
import Map from "ol/Map"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import {OSM} from "ol/source" // https://openlayers.org/en/latest/examples/geojson.html
import {Tile as TileLayer} from "ol/layer" // https://openlayers.org/en/latest/examples/geojson.html
import View from "ol/View"
import {Fill, Stroke, Style, Text} from "ol/style"

// define default feature style
var style = new Style({
  fill: new Fill({
    color: "rgba(12, 147, 255, 0.2)"
  }),
  stroke: new Stroke({
    color: "rgba(12, 147, 255, 0.2)",
    width: 1
  }),
  text: new Text({
    font: "14px Calibri, sans-serif",
    fill: new Fill({
      color: "#000000"
    }),
    stroke: new Stroke({
      color: "#ffffff",
      width: 3
    })
  })
})

// define highlight feature style
var highlightStyle = new Style({
  stroke: new Stroke({
    color: "rgba(192, 0, 4, 0.2)",
    width: 1
  }),
  fill: new Fill({
    color: "rgba(192, 0, 4, 0.2)"
  }),
  text: new Text({
    font: "14px Calibri, sans-serif",
    fill: new Fill({
      color: "#000000"
    }),
    stroke: new Stroke({
      color: "#ffffff",
      width: 3
    })
  })
})

// county data is only for california
// place data is only for la/riverside/san diego area
// zcta5 data is only for riverside
var statePath = "data/geojson/TIGER2018_STATE_data_index.geojson"
var countyPath = "data/geojson/TIGER2018_COUNTY_california.geojson"
var placePath = "data/geojson/TIGER2018_PLACE_riverside.geojson"
var zcta5Path = "data/geojson/TIGER2018_ZCTA5_riverside.geojson"

// read and parse geojson files
var stateGeoJSONString = fs.readFileSync(statePath, {
  encoding: "utf8",
  flag: "r"
})
var stateGeoJSONObj = JSON.parse(stateGeoJSONString)

var countyGeoJSONString = fs.readFileSync(countyPath, {
  encoding: "utf8",
  flag: "r"
})
var countyGeoJSONObj = JSON.parse(countyGeoJSONString)

var placeGeoJSONString = fs.readFileSync(placePath, {
  encoding: "utf8",
  flag: "r"
})
var placeGeoJSONObj = JSON.parse(placeGeoJSONString)

var zcta5GeoJSONString = fs.readFileSync(zcta5Path, {
  encoding: "utf8",
  flag: "r"
})
var zcta5GeoJSONObj = JSON.parse(zcta5GeoJSONString)

// make vector layers using geojson objs
var stateVectorLayer = new VectorLayer({
  maxZoom: 6,
  source: new VectorSource({
    // featureProjection: "EPSG:3857"} is necessary for the code to work with UCR-Star data
    features: new GeoJSON({featureProjection: "EPSG:3857"}).readFeatures(stateGeoJSONObj)
  }),
  style: function(feature) {
    style.getText().setText(feature.get("NAME"))
    return style
  }
})

var countyVectorLayer = new VectorLayer({
  minZoom: 6,
  source: new VectorSource({
    // featureProjection: "EPSG:3857"} is necessary for the code to work with UCR-Star data
    features: new GeoJSON({featureProjection: "EPSG:3857"}).readFeatures(countyGeoJSONObj)
  }),
  style: function(feature) {
    style.getText().setText(feature.get("NAME"))
    return style
  }
})

var placeVectorLayer = new VectorLayer({
  source: new VectorSource({
    // featureProjection: "EPSG:3857"} is necessary for the code to work with UCR-Star data
    features: new GeoJSON({featureProjection: "EPSG:3857"}).readFeatures(placeGeoJSONObj)
  }),
  style: function(feature) {
    style.getText().setText(feature.get("NAME"))
    return style
  }
})

// create map
var map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    stateVectorLayer,
    countyVectorLayer,
  ],
  target: "map",
  view: new View({
    center: [0, 0],
    zoom: 1
  })
})

var featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: function(feature) {
    highlightStyle.getText().setText(feature.get("NAME"))
    return highlightStyle
  }
})

// function to make selected feature red and display feature info
var highlight
var displayFeatureInfo = function(pixel) {

  // get feature
  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature
  })

  var info = document.getElementById("info")
  if (feature) {

    // calc land% and water% and populate "info" div
    var landPercent = ((feature.get("ALAND") * 100 / (feature.get("ALAND") + feature.get("AWATER"))).toFixed(1))
    var waterPercent = Number((feature.get("AWATER") * 100 / (feature.get("ALAND") + feature.get("AWATER"))).toFixed(1))

    // populate div with feature information
    info.innerHTML = feature.get("NAME") + " (" + feature.get("STUSPS") + "): " + landPercent + "% land, " + waterPercent + "% water"
  } else {
    info.innerHTML = "&nbsp;"
  }

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight)
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature)
    }
    highlight = feature
  }
}

// function to make selected feature red
var highlightFeature = function(pixel) {

  // get feature
  var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature
  })

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight)
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature)
    }
    highlight = feature
  }
}

// change feature color on mouse hover
map.on("pointermove", function(evt) {
  if (evt.dragging) {
    return
  }
  const pixel = map.getEventPixel(evt.originalEvent)
  highlightFeature(pixel)
})

// display feature info on mouse click
map.on("click", function(evt) {
  displayFeatureInfo(evt.pixel)
})