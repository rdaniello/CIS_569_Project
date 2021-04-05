function drawScatter(){
    // select the scatter plot svg
    let plotSVG = d3.select('#scatterPlot');

    // margins - also set in filters so lines draw correctly
    let margT = 10;
    let margB = 10;
    let margL = 10;
    let margR = 10;
    let height = 400;
    let width = 1000;

    // flatten the file data for plotting
    let dataFilesFlat = flattenData(dataFiles);

    // Extents for the data
    let xExtent = d3.extent(dataFilesFlat, function(d){
        return +d.xPos;
    })
    let yExtent = d3.extent(dataFilesFlat, function(d){
        return +d.yPos;
    })

    // Scales
    let xScale = d3.scaleLinear()
                    .domain(xExtent)
                    .range([margL, width / 2 - margR]);
    let yScale = d3.scaleLinear()
                    .domain(yExtent)
                    .range([height - margB, margT]);

    // color scale
    let clusterDomain = d3.extent(dataFilesFlat, function(d){
        return d.cluster;
    })
    let colorScale = d3.scaleSequential()
                        .domain(clusterDomain)
                        .interpolator(d3.interpolateRainbow);

    // remove any old circle grp
    plotSVG.selectAll('.circleGrp').remove();
        
    // add the data points
    let scatterCanvas = plotSVG.append('g');
    scatterCanvas.attr('class', 'circleGrp');
    scatterCanvas.selectAll('circle')
        .data(dataFilesFlat)
        .enter()
        .append('circle')
        .attr('class', function(d){
            return 'cluster' + d.cluster;
        })
        .attr('cx',function(d){
            return xScale(+d.xPos);
        })
        .attr('cy',function(d){
            return yScale((+d.yPos)) ;
        })
        .attr('r', 5)
        .style("fill", function(d){
            try{
                return colorScale(d.cluster)
            }
            catch (error)
            {
                return "white"
            }
        })
        .on('click', function(evt, d){ // open file in detail pane
            d.selected = 1;
            displaySelectedFiles();
            drawList();
        })
        .on("mousemove",function (mouseData,d){
            let plotSvg = d3.select('#scatterPlot');
            // remove old detail elements
            plotSvg.selectAll('.detailGrp').remove();

            // add detail information
            let detailGrp = plotSvg.append('g')
            detailGrp
                .attr('class', 'detailGrp')
                .append('text')
                .attr('x', 200)
                .attr('y', 60)
                .text('File: ' + d.name);
            
            detailGrp
                .append('text')
                .attr('x', 200)
                .attr('y', 80)
                .text('Cluster: ' + d.cluster);
            
            // outline all circles in the cluster
            let clusterCircles = scatterCanvas.selectAll('.cluster' + d.cluster)
            clusterCircles.attr('r', 8)
        })
        .on("mouseleave",function (mouseData,d){
            let plotSvg = d3.select('#scatterPlot');
            // remove old detail elements
            plotSvg.selectAll('.detailGrp').remove();

            // blankify detail text
            let detailGrp = plotSvg.append('g')
            detailGrp
                .attr('class', 'detailGrp')
                .append('text')
                .attr('x', 200)
                .attr('y', 60)
                .text('File: -----' );
            
            detailGrp
                .append('text')
                .attr('x', 200)
                .attr('y', 80)
                .text('Cluster: --');
            // remove tooltip
            d3.selectAll('.tooltip').remove();

            // remove outlines
            //scatterCanvas.selectAll('circle').classed('highlightCircle', false);
            scatterCanvas.selectAll('circle').attr('r', 4);
        })

        // // apply zoom setting and attach callbacks
        // plotSVG.call(d3.zoom()
        //     .extent([[0,0],[1000,800]])
        //     .scaleExtent([1,8])
        //     .on("zoom",zoomed)
        // )
        // function zoomed({transform}){
        //     transform.x = transform.x ;
        //     scatterCanvas.attr("transform",transform)
        // }

        // move to right
        scatterCanvas.attr('transform', 'translate(400,0)');

        drawLegend();
}

function drawLegend(){
    // select the scatter plot svg
    let plotSVG = d3.select('#scatterPlot');

    // remove any old legend items
    plotSVG.selectAll('.legendGrp').remove();

    // append legend text
    let legendCanvas = plotSVG.append('g');
    legendCanvas.attr('class','legendGrp');
    legendCanvas.selectAll('text')
        .data(dataClusters)
        .enter()
        .append('text')
        .attr('x', 1000)
        .attr('y', function(d, i){
            return i *20 + 20;
        })
        .text(function(d){
            return 'Cluster: ' + d.cluster;
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
        .on('click', function(evt, d){ // open all files in cluster
            // change all files to unslected.
            clearSelectedFiles();

            // mark all files iin cluster as selected
            dataFiles.get(d.cluster).forEach(function(el){
                el.selected = 1;
            })

            // redraw the ui
            displaySelectedFiles();
            drawList();
        })

    // append legend color
    plotSVG.selectAll('.legendRects').remove();

    // append legend color rects
    let colorScale = d3.scaleSequential()
                        .domain([0, dataClusters.length])
                        .interpolator(d3.interpolateRainbow);

    let legendCanvasRects = plotSVG.append('g');
    legendCanvasRects.attr('class','legendRects');
    legendCanvasRects.selectAll('.legendRect')
            .data(dataClusters)
            .enter()
            .append('rect')
            .attr('x', 975)
            .attr('y', function(d,i){
                return i *20 + 7;
            })
            .attr('width',20)
            .attr('height', 15)
            .attr('fill', (d,i)=>{
                return colorScale(i)
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
            .on('click', function(evt, d){ // open all files in cluster
                // change all files to unslected.
                clearSelectedFiles();
    
                // mark all files iin cluster as selected
                dataFiles.get(d.cluster).forEach(function(el){
                    el.selected = 1;
                })
    
                // redraw the ui
                displaySelectedFiles();
                drawList();
            })
}

function flattenData(inData){
    flatData = [];

    inData.forEach(function(value, key, map) {
        value.forEach(function(elem, idx){
            flatData.push(elem);
        });
    });

    return flatData;
}