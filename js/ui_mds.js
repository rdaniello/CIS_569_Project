function drawScatter(){
    // select the scatter plot svg
    let plotSVG = d3.select('#scatterPlot');

    // margins - 
    let margT = 35;
    let margB = 10;
    let margL = 10;
    let margR = 10;
    let height = plotSVG.node().getBoundingClientRect().height;
    let width = plotSVG.node().getBoundingClientRect().width;

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
                    .range([margL, width - margR]);
    let yScale = d3.scaleLinear()
                    .domain(yExtent)
                    .range([height - margB, margT]);

    // color scale
    let clusterDomain = d3.extent(dataFilesFlat, function(d){
        return d.cluster;
    })
    clusterDomain[1] += 1;
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
        .attr('id', function(d){
            return 'cir_' + d.name;
        })
        .attr('class', function(d){
            return 'cluster' + d.cluster;
        })
        .attr('cx',function(d){
            return xScale(+d.xPos);
        })
        .attr('cy',function(d){
            return yScale((+d.yPos)) ;
        })
        .attr('r', 10)
        .style("fill", function(d){
            try{
                return 'black';
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
        .on("mouseenter",function (mouseData,d){
            let plotSvg = d3.select('#scatterPlot');
            // remove old detail elements
            plotSvg.selectAll('.detailGrp').remove();

            // add detail information
            let detailGrp = plotSvg.append('g')
            detailGrp
                .attr('class', 'detailGrp')
                .append('text')
                .attr('x', function(){
                    return (plotSVG.node().getBoundingClientRect().width / 2) - 100;
                })
                .attr('y',20)
                .text('File: ' + d.name);
            
            detailGrp
                .append('text')
                .attr('x', function(){
                    return plotSVG.node().getBoundingClientRect().width / 2;
                })
                .attr('y', 20)
                .text('Similarity: ' + d.cluster);
            
            // outline all circles in the cluster
            let clusterCircles = scatterCanvas.selectAll('.cluster' + d.cluster)
            clusterCircles.attr('r', 8)

            // highlight the file name in the list
            // get the cluster and expand it if is collapssed
            let clusterItem = dataClusters.find(el => el.cluster == d.cluster)
            // remember if already expanded
            if(clusterItem.expanded == 1){
                clusterItem.prevEx = 1;
            }
            else{
                clusterItem.prevEx = 0;
            }
            clusterItem.expanded = 1;

            // change the 'selected' value 
            d.scatterHlight = 1;

            // redraw the list
            drawList();
        })
        .on("mouseleave",function (mouseData,d){
            let plotSvg = d3.select('#scatterPlot');
            // remove old detail elements
            plotSvg.selectAll('.detailGrp').remove();

            // if cluster not previously expanded collapse it
            let clusterItem = dataClusters.find(el => el.cluster == d.cluster)
            if(clusterItem.prevEx == 1){
                clusterItem.expanded = 1;
            }
            else{
                clusterItem.expanded = 0;
            }
            clusterItem.expanded = clusterItem.prevEx;

            // remove highlighted class
            d.scatterHlight = 0;

            // redraw the list
            drawList();

            // blankify detail text
            let detailGrp = plotSvg.append('g')
            detailGrp
                .attr('class', 'detailGrp')
                .append('text')
                .attr('x', function(){
                    return (plotSVG.node().getBoundingClientRect().width / 2) - 100;
                })
                .attr('y', 20)
                .text('File: -----' );
            
            detailGrp
                .append('text')
                .attr('x', function(){
                    return plotSVG.node().getBoundingClientRect().width / 2;
                })
                .attr('y', 20)
                .text('Similarity: --');
            // remove tooltip
            d3.selectAll('.tooltip').remove();

            // remove outlines
            scatterCanvas.selectAll('circle').attr('r', 4);
        })
        .transition()
            .duration(function(d,i){
                return i * 20;
            })
            .ease(d3.easeBounce)
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

        // apply zoom setting and attach callbacks
        plotSVG.call(d3.zoom()
            .extent([[0,0],[1000,1000]])
            .scaleExtent([1,8])
            .on("zoom",zoomed)
        )
        function zoomed({transform}){
            transform.x = transform.x ;
            scatterCanvas.attr("transform",transform);
        }

        drawLegend();
}

function drawLegend(){
    // select the scatter plot svg
    let legendSVG = d3.select('#scatterLegend');

    // calculate the margin for centering the legend
    let divWidth = legendSVG.node().getBoundingClientRect().width;
    let legWidth = (dataClusters.length / 5) * 125
    let legendMargin = (divWidth- legWidth) / 2;

    // remove any old legend items
    legendSVG.selectAll('.legendGrp').remove();

    // append legend text
    let legendCanvas = legendSVG.append('g');
    legendCanvas.attr('class','legendGrp');
    legendCanvas.selectAll('text')
        .data(dataClusters)
        .enter()
        .append('text')
        .attr('x', function(d,i){
            // get the column number - 5 items per column
            let col = Math.floor(i /5)
            return (125 * col + 20) + 25;
        })
        .attr('y', function(d, i){
            let col = Math.floor(i /5);
            return (i *20 + 20) - (col * 100);
        })
        .text(function(d){
            return 'Disease#: ' + d.cluster;
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

    // center the legend horizontally
    legendCanvas .attr('transform', function(){
        return 'translate(' + legendMargin + ',0)';
    });

    // append legend color
    legendSVG.selectAll('.legendRects').remove();

    // append legend color rects
    let colorScale = d3.scaleSequential()
                        .domain([0, dataClusters.length])
                        .interpolator(d3.interpolateRainbow);

    let legendCanvasRects = legendSVG.append('g');
    legendCanvasRects.attr('class','legendRects');
    legendCanvasRects.selectAll('.legendRect')
            .data(dataClusters)
            .enter()
            .append('rect')
            .attr('x', function(d,i){
                // get the column number - 5 items per column
                let col = Math.floor(i /5)
                return (125 * col) + 20;
            })
            .attr('y', function(d,i){
                let col = Math.floor(i /5);
                return (i *20 + 7) - (col * 100);
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
        
        // center the legend horizontally
        legendCanvasRects.attr('transform', function(){
            return 'translate(' + legendMargin + ',0)';
        });
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