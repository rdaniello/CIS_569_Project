// list file items in left pane of UI and assign interactive call backs for items
function drawList(){
    // select the list svg
    let list = d3.select('#listDiv');

    // y position for drawing divs - increments by 20 
    let y = 20;

    // remove all list items
    list.selectAll('div').remove();

    // Add pane title
    list.append('div')
      .html("<span style='font-size: 16px; font-weight: bold; text-decoration:underline; margin-left:30%'>File List</span>")

    // add one div for each cluster
    for(let i =0; i < dataClusters.length; i++){
          y += 20;
          let tmpDiv = list.append('div')
            .datum(dataClusters[i])
            .attr('id','cluster'+ dataClusters[i].cluster)
            .attr('cluster', dataClusters[i].cluster)
            .style('top', y + 'px')
            .classed('cluster',true)
            .classed('fileGroupCol',function(){
                  if(dataClusters[i].expanded == 0){
                        return true;
                  }
                  else{
                        return false;
                  }
            })
            .classed('fileGroupEx',function(){
                  if(dataClusters[i].expanded == 1){
                        return true;
                  }
                  else{
                        return false;
                  }
            })
            .on("mousemove",function (mouseData,d){
                  let scatterCanvas = d3.select('.circleGrp');
                  
                  // outline all circles in the cluster
                  let clusterCircles = scatterCanvas.selectAll('.cluster' + d.cluster)
                  clusterCircles.attr('r', 8)
            })
            .on("mouseleave",function (mouseData,d){
                  let scatterCanvas = d3.select('.circleGrp');
                  // make all circles the same size
                  scatterCanvas.selectAll('circle').attr('r', 4);
            })
            .on('click', function(evt, d){
                  let elem = d3.select(this)
                  let cluster = parseInt(elem.attr('cluster'));
                  // if expanded then collapse
                  if(d.expanded == 1){
                        elem.classed('fileGroupEx', false)  
                        elem.classed('fileGroupCol', true)  
                        let icon = elem.select('.grpIcon')
                        icon.html('+')
                        // set the list flag to collapse
                        d.expanded = 0;
                  }
                  else{// if collapsed then expand
                        elem.classed('fileGroupEx', true)  
                        elem.classed('fileGroupCol', false) 
                        let icon = elem.select('.grpIcon')
                        icon.html('-')
                        // set the list flag to expand
                        d.expanded = 1;
                  }
                  drawList();
            })
            // assign drag events to file item
            .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragendedCluster)
            );
          tmpDiv
                .append('span')
                .classed('grpIcon', true)
                .html(function(d){
                      if(d.expanded == 1){
                            return '-';
                      }
                      else{
                            return '+';
                      }
                });
          tmpDiv
                .append('span')
                .classed('clusterName', true)
                .html(' Disease List: ' + dataClusters[i].cluster);
          
          // if the cluster has been expanded then display filenames in cluster
          if(dataClusters[i].expanded== 1){
                let clusterY = 0;
                tmpDiv.selectAll('div')
                      .data(dataFiles.get(dataClusters[i].cluster))
                      .enter()
                      .append('div')
                      .classed('fileNameDiv', true) // for styling
                      .classed('fileCluster' + dataClusters[i].cluster, true) // for d3
                      .classed('selected', function(d){
                            if(d.selected == 1){
                                  return true;
                            }
                            else{
                                  return false;
                            }
                      })
                      .classed('scatterHlight', function(d){
                              if(d.scatterHlight == 1){
                                    return true;
                              }
                              else{
                                    return false;
                              }
                        })
                      .style('top', function(d){
                            clusterY+=20;
                            y+=20;
                            return clusterY + 'px';
                      })
                      .html(function(d){
                            return d.name;
                      })
                      // toggle 'selected' field of item when clicked
                      .on('click', function(event,d){
                            try{
                                  // if filename selected then remove 
                                  if(d.selected == 1){
                                        d.selected=0;

                                        // change appearance
                                        d3.select(this)
                                              .classed('selected', false)
                                  }
                                  // add the the filename to the selected filename list
                                  else{
                                        d.selected = 1
          
                                        // change appearance
                                        d3.select(this)
                                              .classed('selected', true)
                                  }
                                  event.stopPropagation();
                            }
                            catch{}
                      })
                      // highlight on mouse over
                      .on('mouseenter', function (mouseData, d) {
                            try {
                                  if(!isDragged){
                                        d3.select(this)
                                              .classed('listHover', true)
                                  }

                            } catch {}
                      })
                      .on('mouseleave', function (mouseData, d) {
                            try {
                                  if(!isDragged){
                                        d3.select(this)
                                              .classed('listHover', false)
                                  }
                            } catch {}
                      })
                      // assign drag events to file item
                      .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragendedFile)
                      )
          }
    }
}

// fires when list item drag starts
function dragstarted(d) {
    // nothing to do since this may be a click
    // let click event fire
}

// fires when list item is dragged
function dragged(event, d) {

    // set the flag that element has been dragged - ie not a click
    isDragged = true;

    // remove any old drag lines
    d3.selectAll('.dragLine').remove();

    // get the top and bottom of div scroll position
    let scrollTopY = $("#listDiv").scrollTop();
    let scrollBotY = $("#listDiv").scrollTop() + $("#listDiv").height();

    // get the mouse y position in div - subtract margins and padding
    let currYListPos = scrollTopY  + d3.pointer(event)[1] 

    // if mouse position is close to top then scroll list div up
    if(currYListPos < scrollTopY + 175 && event.x < 175){
          let newScroll = $("#listDiv").scrollTop() - 20;
          if(newScroll < 0) {newScroll = 0}
          $("#listDiv").scrollTop(newScroll);
    }

    // if mouse position is close to bottom then scroll list div down
    if(currYListPos > scrollBotY + 80 && event.x < 175){
          let newScroll = $("#listDiv").scrollTop() + 20;
          if(newScroll > scrollBotY - $("#listDiv").height()) {scrollBotY - $("#listDiv").height()}
          $("#listDiv").scrollTop(newScroll);
    }

    // selected the hover text by class - remove old detail hover from right pane
    let detail = d3.select('#detail');
    detail.selectAll('.detailHover').remove();

    // if in list box - left pane
    if(event.x < 175){
          // adjust x and y of object being dragged
          let elem = d3.select(this)
                .style('left',function(){return event.x.toString() + "px"})
                .style('top',function(){                        
                      return event.y.toString() + "px"
                })
                .classed('listDrag', true)
                .classed('listHover', false);
          
          // add line to show drop position
          // get list 
          //.node().getBoundingClientRect().top;
          // select the correct div to append line to
          let list = null;
          if(elem.classed('cluster')){
                list = d3.select('#listDiv')
          }
          else{
                list = d3.select('#cluster'+ d.cluster)
          }
          list.append('div')
                .classed('dragLine', true)
                .style('top', function(){
                      // snap to the closest multiple of 20
                      let lineY = event.y - 20;
                      let tmp = lineY / 20.0;
                      if(lineY - Math.floor(tmp)*20 < lineY - Math.ceil(tmp)*20){
                            lineY = lineY - Math.floor(tmp)*20;
                      }
                      else{
                            lineY = Math.ceil(tmp)*20
                      }

                      return lineY.toString() + 'px'
                })
                .style('left', '0px')
    }
    // if in right pane - then add '+' to detail pane
    else{
          let cood = d3.pointer(event)

          // get of dragging file or cluster - cluster have attribute value
          let elem = d3.select(this);
          let clusterNumber = parseInt(elem.attr('cluster'))
          let isCluster = !isNaN(clusterNumber)

          if(isNaN(clusterNumber)){
                // get the number of selected files
                selectedCount = getSelected().length;
          }
          else{
                selectedCount = dataFiles.get(clusterNumber).length
          }

          // get width of left pane
          let lPane = d3.select('#listDiv')
          let listbox = lPane.node().getBoundingClientRect();
          let listwidth = listbox.width

          // add the updated hover add 
          detail.append('div')
                .text("+ " + selectedCount + " Selected Files")
                .style('left',(cood[0] - listwidth).toString() + "px")
                .style('top',event.y + "px")
                .classed('detailHover', true)
                .style('font-size','20pt')
    }
}

function reorderClusters(elem, datum){
    clusterTops = [];

    // get top of this element
    let dropY = elem.node().getBoundingClientRect().top;

    // get tops of all cluster divs
    clustDivs = d3.selectAll('.cluster').nodes()
    clustDivs.forEach(function(div){
          clusterTops.push(div.getBoundingClientRect().top);
    })

    // find the nearest top
    distArr = clusterTops.map(function(d){
                return Math.abs(d - dropY)
          })
    distArrSorted = clusterTops.map(function(d){
          return Math.abs(d - dropY)
    })
    distArrSorted.sort((a, b) => a - b);

    // new index is the 2nd closest - closest is the element and is 0
    let newIdx = distArr.indexOf(distArrSorted[1]);
    let oldIdx = distArr.indexOf(distArrSorted[0]);

    // remove cluster from cluster array
    dataClusters.splice(oldIdx,1);

    // splice luster array array in correct order
    dataClusters.splice(newIdx, 0, datum);
}

function dragendedCluster(event, d) {
    // get the element
    let elem = d3.select(this);

    // remove item drag class
    elem.classed('listDrag',false);

    // only move if item is dragged - set in dragged event
    // otherwise let click event happen
    if(isDragged){
          // remove old arrows
          // let list = d3.select("#list")
          // list.selectAll('.listArrow').remove();

          // decide if we are re-ordering list or displaying file
          // based on how far right the object is dragged
          if(event.x < 175){ 
                // rearrange the data
                reorderClusters(elem, d);
          }
          else{        
                // else clear all selected files
                clearSelectedFiles();

                // mark files in this cluster as selected
                // for each cluster - find the files that have been selected
                dataFiles.get(d.cluster).forEach(function(item){
                      item.selected = 1;
                })

                // display the selected files
                displaySelectedFiles();
          }

          // redraw the list
          drawList();

          // reset isDragged flag
          isDragged = false;
          
    }
}

function reorderFiles(elem, datum){
    filesTops = [];
    filesBot = [];
    // get top of this element - drop position
    let dropY = elem.node().getBoundingClientRect().top;
    let dropYB = elem.node().getBoundingClientRect().bottom;

    // get top and bottom of cluster file list
    // get the divs
    let fileDivs = d3.selectAll('.fileCluster' + datum.cluster).nodes()
    fileDivs.forEach(function(div){
          filesTops.push(div.getBoundingClientRect().top);
          filesBot.push(div.getBoundingClientRect().bottom);
    })

    // find the limits - don't include the dragged element
    filesTops.splice(filesTops.indexOf(dropY),1);
    filesBot.splice(filesBot.indexOf(dropYB),1);
    let dropMin = Math.min(...filesTops);
    let dropMax = Math.max(...filesBot);

    // if drop position is in range then adjust file order
    if(dropY < dropMax && dropY > dropMin){
          // need new top array
          filesTops = [];
          fileDivs.forEach(function(div){
                filesTops.push(div.getBoundingClientRect().top);
          })
          // get the distances to drop poistion
          distArr = filesTops.map(function(d){
                return Math.abs(d - dropY)
          })
          distArrSorted = filesTops.map(function(d){
                return Math.abs(d - dropY)
          })
          distArrSorted.sort((a, b) => a - b);

          // new index is the 2nd closest - closest is the element and is 0
          let newIdx = distArr.indexOf(distArrSorted[1]);
          let oldIdx = distArr.indexOf(distArrSorted[0]);

          // remove item from this clusters file item array
          dataFiles.get(datum.cluster).splice(oldIdx,1);

          // splice clusters file item array in correct order
          dataFiles.get(datum.cluster).splice(newIdx, 0, datum);
    }
}

function dragendedFile(event, d) {
    // get the element
    let elem = d3.select(this);

    // remove item drag class
    elem.classed('listDrag',false);

    // only move if item is dragged - set in dragged event
    // otherwise let click event happen
    if(isDragged){
          // remove old arrows
          // let list = d3.select("#list")
          // list.selectAll('.listArrow').remove();

          // decide if we are re-ordering list or displaying file
          // based on how far right the object is dragged
          if(event.x < 175){ 
                // rearrange the filesName array based on new order
                reorderFiles(elem, d);
               
                // if dragged item is selected then reflect this change
                // in detail pane
                if(getSelected().length > 1){
                      displaySelectedFiles();
                }
          }
          else{
                // draw the detail pane with selected files
                displaySelectedFiles();
          }

          // redraw the list
          drawList();

          // reset isDragged flag
          isDragged = false;           
    }
}