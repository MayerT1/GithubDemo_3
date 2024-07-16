/////////////////////////////////////////////////////////////
////Github training #3
////T. Mayer 7/11/24
////Purpose of the script is to test a set of Github approaches for collaborative development and transferring of efforts
/////////////////////////////////////////////////////////////

//////////
//Run a basic analysis in an ROI using LS 9 SR
/////////
var ROI = ee.Geometry.Polygon([[78.2244482434705,30.715875382880505], [79.17682556280644,30.715875382880505],[79.17682556280644,31.482889694297526],[78.2244482434705,31.482889694297526],[78.2244482434705,30.715875382880505]])
Map.addLayer(ROI, {}, "ROI")
Map.centerObject(ROI)
print("ROI", ROI)

var LS9_SR = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2').filterDate('2022-01-01', '2022-12-31').filterBounds(ROI);
print("LS9_SR", LS9_SR)


//////////
//Calculate a a set of indices
/////////
function calculateLSIndices (imageCollection) {

  var image = ee.Image(ee.Algorithms.If(
    ee.Algorithms.ObjectType(imageCollection).equals('Image'),
    ee.Image(imageCollection),
    ee.ImageCollection(imageCollection).median())
  );

  var NDVI = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
  
  var NDWI = image.normalizedDifference(['SR_B3', 'SR_B5']).rename('NDWI');

  var MNDWI = image.normalizedDifference(['SR_B3', 'SR_B6']).rename('MNDWI');
  
  var NDMI = image.normalizedDifference(['SR_B5', 'SR_B6']).rename('NDMI');
    
  var NDBI = image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');

  return NDVI.addBands([NDWI, MNDWI, NDMI, NDBI]).float();
}

var LS9_SR_indices = LS9_SR.map(calculateLSIndices);


//////////
//Clip each image in the image collection to ROI; Viz and Map
/////////
var LS9_SR_clip = LS9_SR_indices.map(function(image) { return image.clip(ROI); })

var palettes = require('users/gena/packages:palettes');
var palette = palettes.colorbrewer.YlGn[9];

Map.addLayer(LS9_SR_clip.select("NDVI"), {min: -1, max: 1, palette: palette}, "LS9_SR_clip NDVI")


//////////
//Sample @ 100m moasiced image across all indicies and chart as histrogram
/////////
var chart =
    ui.Chart.image.histogram({image: LS9_SR_clip.mosaic(), region: ROI, scale: 100})
        .setSeriesNames(['NDVI','NDWI', 'MNDWI', 'NDMI', 'NDBI'])
        .setOptions({
          title: 'SR Indice LS 9 Histogram',
          hAxis: {
            title: 'Reflectance (scaled by 1e4)',
            titleTextStyle: {italic: false, bold: true},
          },
          vAxis:
              {title: 'Count', titleTextStyle: {italic: false, bold: true}},
          colors: ['cf513e', '1d6b99', 'f0af07']
        });
print(chart);


//////////
//Sample @ 100m moasiced image across all indicies and export as a CSV
/////////
var fcPolygonSamp = LS9_SR_clip.mosaic().sampleRegions({
  collection: ee.FeatureCollection(ROI),
  scale: 100,
  geometries: true
});

print("fcPolygonSamp", fcPolygonSamp.first())

Export.table.toDrive({
  collection: fcPolygonSamp,
  description: 'Github_JS_demo_script',
  folder: 'earth_engine_demos',
  fileFormat: 'csv'
});

//////////
//Sample @ 100m moasiced image across all indicies and export as an Image
/////////
Export.image.toDrive({image: LS9_SR_clip.mosaic(),
                      description: 'Github_JS_demo_script_image',
                      folder: 'earth_engine_demos',
                      // fileNamePrefix,
                      // dimensions,
                      region: ROI,
                      scale: 100,
                      // crs,
                      // crsTransform,
                      maxPixels :10e12,
                      // shardSize,
                      // fileDimensions,
                      // skipEmptyTiles,
                      // fileFormat,
                      // formatOptions,
                      // priority
});



