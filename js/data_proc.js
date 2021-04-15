let dataFileFiles = 'data/processed_data/processed_files.csv' // files data files
let dataFileClusters = 'data/processed_data/processed_clusters.csv' // cluster data files
let dataFiles = new Map(); // the files in json object array
let dataClusters = new Map(); // the files in json object array
let isDragged = false; // flag to discern between drag and click events

// load the data files
Promise.all(
      [d3.csv(dataFileFiles), d3.csv(dataFileClusters)],d3.autoType()).then(main)

// called when data loading is complete
function main(data){
      // build the array of JSON objects
      dataFiles = buildJSONFiles(data[0]);
      dataClusters = buildJSONClusters(data[1]);
   
      // draw the list
      drawList();

      // draw the scatter plot
      drawScatter();
}

// return data json item where selected equals 1
function getSelected(){
    let sel = [];
    // for each cluster - find the files that have been selected
    dataFiles.forEach(function(val,key,map){
          val.forEach(function(item){
                if(item.selected == 1){
                      sel.push(item);
                }
          })
    })
    return sel;
}

// sets selected field to 0 for all files
function clearSelectedFiles(){
    // for each cluster - set selected to 0 for all files
    dataFiles.forEach(function(val,key,map){
          val.forEach(function(item){
                item.selected = 0;
          })
    })
}

// builds and returns map of json objects to be consumed by D3
// file data
function buildJSONFiles(inData){
    // change cluster and position coordinates to number
    inData.forEach(function(item){
          // convert strings to floats
          item.cluster = +item.cluster;
          item.xPos = +item.xPos;
          item.yPos = +item.yPos;
          item.selected = 0;
    })

    // group by cluster
    groupedData = d3.group(inData, d => d.cluster)

    return groupedData;
}

// builds and returns map of json objects to be consumed by D3
// cluster data
function buildJSONClusters(inData){
    // change cluster to number
    inData.forEach(function(item){
          item.expanded = 0;
          item.cluster = +item.cluster;
    })

    return inData;
}