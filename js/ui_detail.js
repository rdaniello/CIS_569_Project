// draw the detail pane with selected files
function displaySelectedFiles(){
    // reordering the list in left pane will reorder the 
    // detail pane as well
    let detail = d3.select('#detail');
          
    // get files where 'selected' is true
    let selectedFiles = getSelected();

    // empty the pane
    detail.selectAll('div').remove();

    // add div for each selected file in list to right pane
    var detailDivs = detail.selectAll('div')
          .data(selectedFiles)
          .enter()
          .append("div")
          .style("font", "14px 'Helvetica Neue'")
          .style("height", '150px')
          .style('overflow-y', 'scroll')
          .classed('detailDiv',true)
          .on('click', function(event,d){
                let elem = d3.select(this);

                // if expanded then collapse and hide scroll
                if(elem.style('height') == '150px'){
                      elem.style('overflow-y', 'hidden')
                      elem.transition()
                            .duration(200)
                            .ease(d3.easeBounce)
                            .style('height', '20px')
                            
                }
                else{
                      // expand div and add scroll
                      elem.style('overflow-y', 'scroll')
                      elem.transition()
                            .duration(200)
                            .ease(d3.easeBounce)
                            .style('height', '150px')
                            .style('overflow-y', 'scroll')
                }
          })
    
    // add 'x' to close and deselect item
    detailDivs
          .append('div')
          .text(function(d){return 'X'})
          .style('color','red')
          .style('padding-bottom', '10px')
          .style('width', '30px')
          .style('display', 'inline-block')
          .on('click', function(event,d){
                // set selected to 0 and redraw list
                d.selected = 0;

                // update the list and detail panes
                drawList();
                displaySelectedFiles();
          })

    // add title and contents to each div
    detailDivs
          .append('div')
          .text(function(d){
                let text = "File: " + d.name + ' Cluster ' + d.cluster + ' Entities: '
                            + dataClusters[d.cluster].e1 + ", " 
                            + dataClusters[d.cluster].e2 + ", " 
                            + dataClusters[d.cluster].e3 + ", " 
                            + dataClusters[d.cluster].e4 + ", " 
                            + dataClusters[d.cluster].e5;
                return text;
          })
          .classed('bold',true)
          .style('height', '150px')
          .style('width', '100%')
          .style('display', 'inline-block')
          .transition()
                .duration(1000)
                .ease(d3.easeElastic)
                .delay(function(d,i){
                      return i * 250;
                })
          .style('height', '20px')
    
    detailDivs
          .append('div')
          .text(function(d){return d.text})
          .style('padding-left', '10px')
          .style('padding-top', '10px')
}