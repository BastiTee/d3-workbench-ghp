/* exported wbBarChartPosNeg */
/**
 * Bar chart with positive and negative values.
 * @return {Object} A reusable, updatable chart object.
 */
let wbBarChartPosNeg = function() {
    'use strict';

    let width = 500;
    let height = 500;
    let padding = 0.1;
    let widthFactor = 1.0;
    let xSelector = 'x';
    let ySelector = 'y';
    let scaleX;
    let scaleY;
    let sortBy;
    let sortDirection = 'desc';
    let fillPos = 'green';
    let fillNeg = 'red';
    let update = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            scaleX = d3
                .scaleBand()
                .rangeRound([0, width], .1)
                .padding(padding);

            scaleY = d3.scaleLinear()
                .range([height, 0]);

            update = function(data) {
                data.forEach(function(d) {
                    d[ySelector] = +d[ySelector];
                });

                if (sortBy) {
                    data.sort(function(a, b) {
                        if (sortDirection == 'desc') {
                            return +b[sortBy] - +a[sortBy];
                        } else {
                            return +a[sortBy] - +b[sortBy];
                        }
                    });
                }

                let yExtent = d3.extent(data, function(d) {
                    return d[ySelector];
                });
                // handle cases where there is no zero crossing
                if (yExtent[0] < 0 && yExtent[1] < 0) {
                    yExtent[1] = 0;
                } else if (yExtent[0] > 0 && yExtent[1] > 0) {
                    yExtent[0] = 0;
                }
                scaleY.domain(yExtent);
                let zeroHeight = scaleY(yExtent[0]) - scaleY(0);
                let zeroHeightInv = scaleY(yExtent[0]) - zeroHeight;

                scaleX.domain(data.map(function(d) {
                    return d[xSelector];
                }));

                s.selectAll('.rects')
                    .remove()
                    .exit()
                    .data(data)
                    .enter().append('rect')
                    .attr('class', 'rects')
                    .attr('x', function(d) {
                        return scaleX(d[xSelector]);
                    })
                    .attr('width', function(d) {
                        return scaleX.bandwidth() * widthFactor;
                    })
                    .attr('y', function(d) {
                        if (d[ySelector] >= 0) {
                            return scaleY(d[ySelector]);
                        } else {
                            return zeroHeightInv;
                        }
                    })
                    .attr('height', function(d) {
                        if (d[ySelector] >= 0) {
                            return height - scaleY(d[ySelector]) - zeroHeight;
                        } else {
                            return scaleY(d[ySelector]) - zeroHeightInv;
                        }
                    })
                    .attr('fill', function(d, i) {
                        if (d[ySelector] >= 0) {
                            return fillPos;
                        } else {
                            return fillNeg;
                        }
                    });
            };
            update(data);
        });
    };

    chart.update = function(data) {
        update(data);
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.xSelector = function(value) {
        if (!arguments.length) return xSelector;
        xSelector = value;
        return chart;
    };

    chart.ySelector = function(value) {
        if (!arguments.length) return ySelector;
        ySelector = value;
        return chart;
    };

    chart.scaleX = function(value) {
        if (!arguments.length) return scaleX;
        scaleX = value;
        return chart;
    };

    chart.scaleY = function(value) {
        if (!arguments.length) return scaleY;
        scaleY = value;
        return chart;
    };

    chart.fillPos = function(value) {
        if (!arguments.length) return fillPos;
        fillPos = value;
        return chart;
    };

    chart.fillNeg = function(value) {
        if (!arguments.length) return fifillNegll;
        fillNeg = value;
        return chart;
    };

    chart.padding = function(value) {
        if (!arguments.length) return padding;
        padding = value;
        return chart;
    };

    chart.widthFactor = function(value) {
        if (!arguments.length) return widthFactor;
        widthFactor = value;
        return chart;
    };

    chart.sortBy = function(value) {
        if (!arguments.length) return sortBy;
        sortBy = value;
        return chart;
    };

    chart.sortDirection = function(value) {
        if (!arguments.length) return sortDirection;
        if (value != 'desc' && value != 'asc') {
            throw Error('Only desc or asc are allowed as sort order.');
        }
        sortDirection = value;
        return chart;
    };

    return chart;
};

/* exported wbBarChart */
/**
 * Basic bar chart.
 * @return {Object} A reusable, updatable chart object.
 */
let wbBarChart = function() {
    'use strict';

    let width = 500;
    let height = 500;
    let padding = 0.1;
    let widthFactor = 1.0;
    let xSelector = 'x';
    let ySelector = 'y';
    let scaleX;
    let scaleY;
    let yExtent;
    let sortBy;
    let sortDirection = 'desc';
    let valuesShow;
    let valuesFill = 'black';
    let valuesPadding = 10;
    let valueFormat = function(v) {
        return v;
    };
    let fill = 'blue';
    let update = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            scaleX = d3
                .scaleBand()
                .rangeRound([0, width], .1)
                .padding(padding);

            scaleY = d3.scaleLinear()
                .range([height, 0]);

            update = function(data) {
                data.forEach(function(d) {
                    d[ySelector] = +d[ySelector];
                });

                if (sortBy) {
                    data.sort(function(a, b) {
                        if (sortDirection == 'desc') {
                            return +b[sortBy] - +a[sortBy];
                        } else {
                            return +a[sortBy] - +b[sortBy];
                        }
                    });
                }

                let yExtentLocal;
                if (!yExtent) {
                    yExtentLocal = [0, d3.max(data, function(d) {
                        return d[ySelector];
                    })];
                } else {
                    yExtentLocal = yExtent;
                }
                scaleY.domain(yExtentLocal);

                scaleX.domain(data.map(function(d) {
                    return d[xSelector];
                }));

                s.selectAll('.rects')
                    .remove()
                    .exit()
                    .data(data)
                    .enter().append('rect')
                    .attr('class', 'rects')
                    .attr('x', function(d) {
                        if (widthFactor >= 1) {
                            return scaleX(d[xSelector]);
                        } else {
                            let diff = scaleX.bandwidth() -
                                scaleX.bandwidth() * widthFactor;
                            return scaleX(d[xSelector]) + diff / 2;
                        }
                    })
                    .attr('width', function(d) {
                        return scaleX.bandwidth() * widthFactor;
                    })
                    .attr('y', function(d) {
                        return scaleY(d[ySelector]);
                    })
                    .attr('height', function(d) {
                        return height - scaleY(d[ySelector]);
                    })
                    .attr('fill', function(d, i) {
                        if (typeof fill === 'string') {
                            return fill;
                        } else if (typeof fill === 'function') {
                            return fill(i);
                        } else if (typeof fill === 'object' &&
                            String(fill).startsWith('rgb')) {
                            return fill;
                        } else {
                            return fill[i];
                        }
                    });

                if (!valuesShow) {
                    return;
                }

                s.selectAll('.values')
                    .remove()
                    .exit()
                    .data(data)
                    .enter().append('text')
                    .attr('class', 'values')
                    .attr('fill', valuesFill)
                    .attr('text-anchor', 'middle')
                    .attr('x', function(d) {
                        return scaleX(d[xSelector]) + scaleX.bandwidth() / 2;
                    })
                    .attr('y', function(d) {
                        return scaleY(d[ySelector]) - valuesPadding;
                    })
                    .text(function(d) {
                        return valueFormat(d[ySelector]);
                    });
            };
            update(data);
        });
    };

    chart.update = function(data) {
        update(data);
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.xSelector = function(value) {
        if (!arguments.length) return xSelector;
        xSelector = value;
        return chart;
    };

    chart.ySelector = function(value) {
        if (!arguments.length) return ySelector;
        ySelector = value;
        return chart;
    };

    chart.scaleX = function(value) {
        if (!arguments.length) return scaleX;
        scaleX = value;
        return chart;
    };

    chart.scaleY = function(value) {
        if (!arguments.length) return scaleY;
        scaleY = value;
        return chart;
    };

    chart.fill = function(value) {
        if (!arguments.length) return fill;
        fill = value;
        return chart;
    };

    chart.yExtent = function(value) {
        if (!arguments.length) return yExtent;
        yExtent = value;
        return chart;
    };

    chart.valuesShow = function(value) {
        if (!arguments.length) return valuesShow;
        valuesShow = value;
        return chart;
    };

    chart.valuesFill = function(value) {
        if (!arguments.length) return valuesFill;
        valuesFill = value;
        return chart;
    };

    chart.valueFormat = function(value) {
        if (!arguments.length) return valueFormat;
        valueFormat = value;
        return chart;
    };

    chart.padding = function(value) {
        if (!arguments.length) return padding;
        padding = value;
        return chart;
    };

    chart.widthFactor = function(value) {
        if (!arguments.length) return widthFactor;
        widthFactor = value;
        return chart;
    };

    chart.sortDirection = function(value) {
        if (!arguments.length) return sortDirection;
        if (value != 'desc' && value != 'asc') {
            throw Error('Only desc or asc are allowed as sort order.');
        }
        sortDirection = value;
        return chart;
    };

    chart.sortBy = function(value) {
        if (!arguments.length) return sortBy;
        sortBy = value;
        return chart;
    };

    return chart;
};

/* exported wbChordDiagram */
/**
 * Chord diagram.
 * @return {Object} A reusable, updatable chart object.
 */
let wbChordDiagram = function() {
    'use strict';

    let radius = 500;
    let fill = 'black';
    let colors = d3.scaleOrdinal(d3.schemeCategory20c);
    let matrix;
    let keys;

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let innerRadius = radius / 2 - 100;

            let chord = d3.chord()
                .padAngle(0.04)
                .sortSubgroups(d3.descending)
                .sortChords(d3.descending);

            let arc = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(innerRadius + 20);

            let ribbon = d3.ribbon()
                .radius(innerRadius);


            let chords = chord(matrix);
            s
                .attr('class', 'chord-circle')
                .datum(chords);

            s.append('circle')
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .attr('r', innerRadius + 20);

            let g = s.selectAll('group')
                .data(function(chords) {
                    return chords.groups;
                })
                .enter().append('g')
                .style('fill-opacity', '.8')
                .on('mouseover', function(d, i) {
                    chordPaths.classed('fade', function(p) {
                        return p.source.index != i &&
                            p.target.index != i;
                    });
                })
                .on('mousemove', function() {})
                .on('mouseout', function() {});
            g.append('path')
                .style('stroke', fill)
                .style('fill', fill)
                .attr('d', arc);

            g.append('text')
                .each(function(d) {
                    d.angle = (d.startAngle + d.endAngle) / 2;
                })
                .attr('dy', '.35em')
                .style('font-size', '90%')
                .attr('text-anchor', function(d) {
                    return d.angle > Math.PI ? 'end' : null;
                })
                .attr('transform', function(d) {
                    return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')' +
                        'translate(' + (innerRadius + 26) + ')' +
                        (d.angle > Math.PI ? 'rotate(180)' : '');
                })
                .style('fill', fill)
                .text(function(d) {
                    return keys[d.index].key;
                });

            let chordPaths = s.selectAll('chord')
                .data(function(chords) {
                    return chords;
                })
                .enter().append('path')
                .attr('class', 'chordpaths')
                .style('fill-opacity', '.8')
                .style('stroke-width', '25px')
                .style('fill', function(d, i) {
                    return colors(i);
                })
                .attr('d', ribbon.radius(innerRadius));
        });
    };

    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    };

    chart.matrix = function(value) {
        if (!arguments.length) return matrix;
        matrix = value;
        return chart;
    };

    chart.keys = function(value) {
        if (!arguments.length) return keys;
        keys = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    chart.fill = function(value) {
        if (!arguments.length) return fill;
        fill = value;
        return chart;
    };

    return chart;
};

/* exported wbDonutChart */
/**
 * Basic donut chart with external legend.
 * @return {Object} A reusable, updatable chart object.
 */
let wbDonutChart = function() {
    'use strict';

    let radius = 500;
    let fillLegend = 'black';
    let colors = d3.scaleOrdinal(d3.schemeCategory10);

    // let update = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let pie = d3.pie()
                .value(function(d) {
                    return d.percent;
                })
                .sort(null)
                .padAngle(.03);

            let outerRadius = radius / 2;
            let innerRadius = radius / 8;

            let arc = d3.arc()
                .outerRadius(outerRadius)
                .innerRadius(innerRadius);

            s.selectAll('path')
                .data(pie(data))
                .enter()
                .append('path')
                .attr('class', 'paths')
                .attr('d', arc)
                .attr('fill', function(d, i) {
                    return colors(i);
                });

            let ordinal = d3.scaleOrdinal()
                .domain(data.map(function(d) {
                    return d.label;
                }))
                .range(data.map(function(d, i) {
                    return colors(i);
                }));

            s.append('g')
                .attr('class', 'legend')
                .attr('transform', function(d, i) {
                    return 'translate(' + (outerRadius + 10) + ',' +
                        (-outerRadius + 10) + ')';
                });
            let legend = d3.legendColor()
                .shape('path', d3.symbol().type(d3.symbolCircle).size(100)())
                .scale(ordinal);
            s.select('.legend')
                .call(legend)
                .style('fill', fillLegend)
                .style('font-size', '90%');
        });
    };

    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    };

    chart.fillLegend = function(value) {
        if (!arguments.length) return fillLegend;
        fillLegend = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    return chart;
};

/* exported wbGeoMap */
/**
 * Basic geo map projection inspired by
 * http://bl.ocks.org/oscar6echo/4423770
 * @return {Object} A reusable, updatable chart object.
 */
function wbGeoMap() {
    'use strict';

    let width = 500;
    let height = 500;
    let mapFill = '#666666';
    let mapStroke = '#555555';
    let mapStrokeWidth = 1;
    let boundsManual;
    let projection;
    let allowZoom = true;
    let update = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);
        let focused;
        let geoPath;

            let applyZoom = function(d) {
                let x = width / 2;
                let y = height / 2;
                let k = 1;

                if ((focused === null) || !(focused === d)) {
                    let centroid = geoPath.centroid(d);
                    x = +centroid[0],
                    y = +centroid[1],
                    k = 2.5;
                    focused = d;
                } else {
                    focused = null;
                };

                s.transition()
                    .duration(1000)
                    .attr('transform',
                    'translate(' + (width / 2) + ',' +
                    (height / 2) + ')scale(' + k +
                    ')translate(' + (-x) + ',' +
                        (-y) + ')')
                    .style('stroke-width', 1.75 / k + 'px');
            };

/*             let resetZoom = function() {
                focused = null;
                s.transition()
                    .duration(500)
                    .attr('transform',
                        'scale(' + 1 + ')translate(' + 0 + ',' + 0 + ')')
                    .style('stroke-width', 1.00 + 'px');
            }; */

            let bounds = d3.geoBounds(data);
            if (boundsManual) {
                bounds = boundsManual;
                // console.log("-- manually set bounds to " + bounds);
            } else {
                // console.log("-- bounds read to " + bounds);
            }
            let bottomLeft = bounds[0];
            let topRight = bounds[1];
            let rotLong = -(topRight[0] + bottomLeft[0]) / 2;
            let center = [(topRight[0] + bottomLeft[0]) / 2 +
                rotLong, (topRight[1] + bottomLeft[1]) / 2,
            ];

            projection = d3.geoAlbers()
                .parallels([bottomLeft[1], topRight[1]])
                .translate([width / 2, height / 2])
                .rotate([rotLong, 0, 0])
                .center(center);

            let bottomLeftPx = projection(bottomLeft);
            let topRightPx = projection(topRight);
            let scaleFactor = 1.00 * Math.min(width / (topRightPx[0] -
                bottomLeftPx[0]), height / (-topRightPx[1] + bottomLeftPx[1]));
            projection = d3.geoAlbers()
                .parallels([bottomLeft[1], topRight[1]])
                .rotate([rotLong, 0, 0])
                .translate([width / 2, height / 2])
                .scale(scaleFactor * 0.975 * 1000)
                .center(center);

            geoPath = d3.geoPath().projection(projection);

            update = function() {
                s.selectAll('.wb-feature-paths')
                    .exit()
                    .remove()
                    .data(data.features)
                    .enter()
                    .append('path')
                    .attr('d', geoPath)
                    .attr('class', 'wb-feature-paths')
                    .style('fill', mapFill)
                    .style('stroke', mapStroke)
                    .style('stroke-width', mapStrokeWidth);
                if (allowZoom) {
                    s.selectAll('.wb-feature-paths')
                        .on('click', applyZoom);
                }
            };
            update();
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.projection = function(value) {
        if (!arguments.length) return projection;
        projection = value;
        return chart;
    };

    chart.mapFill = function(value) {
        if (!arguments.length) return mapFill;
        mapFill = value;
        return chart;
    };

    chart.mapStroke = function(value) {
        if (!arguments.length) return mapStroke;
        mapStroke = value;
        return chart;
    };

    chart.boundsManual = function(value) {
        if (!arguments.length) return boundsManual;
        boundsManual = value;
        return chart;
    };

    chart.mapStrokeWidth = function(value) {
        if (!arguments.length) return mapStrokeWidth;
        mapStrokeWidth = value;
        return chart;
    };

    chart.allowZoom = function(value) {
        if (!arguments.length) return allowZoom;
        allowZoom = value;
        return chart;
    };

    chart.update = function() {
        update();
    };

    return chart;
};

/* exported wbHeatMap */
/**
 * Basic heat map.
 * @return {Object} A reusable, updatable chart object.
 */
function wbHeatMap() {
    'use strict';

    let width = 500;
    let height = 500;
    let fill = 'black';
    let colors = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb',
        '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58',
    ];

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            data.forEach(function(d) {
                d.day = +d.day;
                d.hour = +d.hour;
                d.value = +d.value;
            });

            let numHours = 24;
            let times = Array(numHours);
            for (let i = 0; i < times.length; i++) {
                times[i] = i + '';
            }
            let days = ['Monday', 'Tuesday',
            'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

            let gridSizeX = Math.floor(width / numHours);
            let gridSizeY = Math.floor(height / days.length);

            s.selectAll('.dayLabel')
                .data(days)
                .enter().append('text')
                .text(function(d) {
                    return d;
                })
                .attr('x', 0)
                .attr('y', function(d, i) {
                    return i * gridSizeY;
                })
                .style('text-anchor', 'end')
                .style('fill', fill)
                .attr('dominant-baseline', 'middle')
                .attr('transform', 'translate(-6,' + gridSizeY / 2 + ')');

            s.selectAll('.timeLabel')
                .data(times)
                .enter().append('text')
                .text(function(d) {
                    return d;
                })
                .attr('x', function(d, i) {
                    return i * gridSizeX;
                })
                .attr('y', 0)
                .style('text-anchor', 'middle')
                .style('fill', fill)
                .attr('transform', 'translate(' + gridSizeX / 2 + ', -6)');

            let heatMap = s.selectAll('.hour')
                .data(data)
                .enter().append('rect')
                .attr('x', function(d) {
                    return (d.hour) * gridSizeX;
                })
                .attr('y', function(d) {
                    return (d.day - 1) * gridSizeY;
                })
                .attr('class', 'hour bordered')
                .attr('width', gridSizeX)
                .attr('height', gridSizeY)
                .attr('stroke', fill)
                .attr('stroke-width', '1')
                .style('fill', fill);

            let minMax = d3.extent(data, function(d) {
                return d.value;
            });
            let colorScale = d3.scaleQuantile()
                .domain(minMax)
                .range(colors);

            heatMap.style('fill', function(d) {
                return colorScale(d.value);
            });

            let legend = s.selectAll('.legend')
                .data([0].concat(colorScale.quantiles()), function(d) {
                    return d;
                })
                .enter().append('g');

            legend.append('rect')
                .attr('x', function(d, i) {
                    return gridSizeX * 2 * i;
                })
                .attr('y', height + 10)
                .attr('width', gridSizeX * 2)
                .attr('height', gridSizeY / 2)
                .attr('stroke', fill)
                .attr('stroke-width', '1')
                .style('fill', function(d, i) {
                    return colors[i];
                });

            legend.append('text')
                .attr('dominant-baseline', 'hanging')
                .text(function(d) {
                    return '≥ ' + Math.round(d);
                })
                .attr('x', function(d, i) {
                    return gridSizeX * 2 * i;
                })
                .attr('y', height + gridSizeY)
                .style('fill', fill);
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    chart.fill = function(value) {
        if (!arguments.length) return fill;
        fill = value;
        return chart;
    };

    return chart;
};

/* exported wbLinePlot */
/**
 * Basic (multi-) line plot.
 * @return {Object} A reusable, updatable chart object.
 */
function wbLinePlot() {
    'use strict';

    let width = 500;
    let height = 500;
    let xAxisScale = d3.scaleLinear();
    let yAxisScale = d3.scaleLinear();
    let xDataPoints = 'x';
    let yDataPoints = ['y'];
    let xDataPointsFormat = function(datum) {
        return datum;
    };
    let yDataPointsFormat = function(datum) {
        return datum;
    };
    let scaleX;
    let scaleY;
    let xMinMax;
    let yMinMax;
    let setYMinToZero = false;
    let stroke = ['red'];
    let strokeWidth = 1;
    let axisColor = 'white';
    let curve = [d3.curveBasis];
    let showLegend = true;
    let legendFill = 'black';
    let legendX = 0;
    let legendY = 0;
    let lineClass;
    let dataPointRadius = 7;
    let dataPointLineFill = 'red';
    let activateTooltip = false;
    let update = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);
            let tipBox;

            if (yDataPoints.length * 2 != (curve.length + stroke.length)) {
                throw Error('If you enter more than one y-data-point,' +
                    ' you need to set the curve and stroke options with ' +
                    'equally-sized arrays.');
            }

            if (showLegend) {
                let legend = s.append('g')
                    .attr('font-size', '75%')
                    .attr('text-anchor', 'end')
                    .attr('transform', 'translate(' +
                        legendX + ',' + legendY + ')')
                    .selectAll('g')
                    .data(yDataPoints)
                    .enter().append('g')
                    .call(d3wb.util.makeUnselectable())
                    .attr('transform', function(d, i) {
                        return 'translate(0,' + i * 20 + ')';
                    });

                let rw = 19;
                legend.append('rect')
                    .attr('x', -rw)
                    .attr('width', rw)
                    .attr('height', rw)
                    .attr('fill', function(d, i) {
                        return (stroke[i]);
                    });

                legend.append('text')
                    .attr('x', -rw - 3)
                    .attr('y', 9.5)
                    .attr('dy', '0.32em')
                    .text(function(d) {
                        return d;
                    })
                    .attr('fill', legendFill);
            }

            if (activateTooltip) {
                s.append('line')
                    .attr('class', 'tooltip-line');
                s.append('text')
                    .attr('class', 'tooltip-text')
                    .attr('x', 5)
                    .attr('y', 0)
                    .style('font-size', '85%')
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'hanging')
                    .style('fill', legendFill);
                yDataPoints.forEach(function(d, i) {
                    s.append('circle')
                        .attr('class', 'tooltip-circle tooltip-circle-' + d);
                });
                tipBox = s.append('rect')
                    .attr('class', 'selector-box')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('opacity', 0);
            }

            update = function(data) {
                if (xMinMax === undefined) {
                    xMinMax = d3.extent(data, function(d) {
                        return d[xDataPoints];
                    });
                }
                if (yMinMax === undefined) {
                    yMinMax = d3.extent(data.map(function(d) {
                        return yDataPoints.map(function(e) {
                            return +d[e];
                        });
                    }).reduce(function(a, b) {
                        return a.concat(b);
                    }));
                    if (setYMinToZero) {
                        yMinMax[0] = 0;
                    }
                }
                scaleX = xAxisScale.rangeRound([0, width]).domain(xMinMax);
                scaleY = yAxisScale.rangeRound([height, 0]).domain(yMinMax);

                yDataPoints.forEach(function(d, i) {
                    let line = d3.line()
                        .curve(curve[i])
                        .x(function(d) {
                            return scaleX(d[xDataPoints]);
                        })
                        .y(function(d) {
                            return scaleY(d[yDataPoints[i]]);
                        });

                    let classs = lineClass ? lineClass :
                        'line-' + yDataPoints[i];
                    if (s.select('.' + classs).empty()) {
                        s.datum(data).append('path')
                            .attr('class', 'line ' + classs)
                            .attr('d', line)
                            .style('fill', 'none')
                            .style('stroke-linecap', 'round')
                            .style('stroke-linejoin', 'round')
                            .style('pointer-events', 'none')

                            .style('stroke-width', strokeWidth)
                            .style('stroke', stroke[i]);
                    } else {
                        s.datum(data).select('.' + classs)
                            .transition().duration(500)
                            .attr('d', line);
                    }
                });
            };

            update(data);

            let drawTooltip = function() {
                let information = [];
                let mouse = d3.mouse(s.node());
                let bisect = d3.bisector(function(d) {
                    return d[xDataPoints];
                }).right;
                let timestamp = scaleX.invert(mouse[0]);
                let index = bisect(data, timestamp);
                let startDatum = data[index - 1];
                information.push(xDataPointsFormat(startDatum[xDataPoints]));
                let endDatum = data[index];
                s.selectAll('.tooltip-line').attr('stroke', 'red')
                    .attr('x1', scaleX(timestamp))
                    .attr('x2', scaleX(timestamp))
                    .attr('y1', 0)
                    .attr('y2', height);
                yDataPoints.forEach(function(d, i) {
                    let interpolate = d3.interpolateNumber(
                        startDatum[yDataPoints[i]], endDatum[yDataPoints[i]]);
                    let range = endDatum[xDataPoints] - startDatum[xDataPoints];
                    let valueY = interpolate((timestamp % range) / range);
                    information.push(d + ' – ' + startDatum[yDataPoints[i]]);
                    s.select('.tooltip-circle-' + d)
                        .attr('cx', scaleX(timestamp))
                        .attr('cy', scaleY(valueY))
                        .attr('r', dataPointRadius)
                        .style('fill', stroke[i])
                        .style('opacity', 1.0);
                });
                let t = s.selectAll('.tooltip-text')
                    .style('opacity', 1.0);
                s.selectAll('.tooltip-text-line').remove();
                for (let i = 0; i < information.length; i++) {
                    t.append('tspan')
                        .attr('class', 'tooltip-text-line')
                        .attr('x', 5)
                        .attr('dy', function() {
                            return i == 0 ? 0 : 15;
                        })
                        .text(information[i]);
                }
            };

            let removeTooltip = function() {
                s.selectAll('.tooltip-line')
                    .attr('stroke', 'none');
                s.selectAll('.tooltip-circle')
                    .style('opacity', 0);
                s.selectAll('.tooltip-text')
                    .style('opacity', 0);
            };

            if (activateTooltip) {
                tipBox
                    .on('mousemove', drawTooltip)
                    .on('mouseout', removeTooltip);
            }
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.xAxisScale = function(value) {
        if (!arguments.length) return xAxisScale;
        xAxisScale = value;
        return chart;
    };

    chart.yAxisScale = function(value) {
        if (!arguments.length) return yAxisScale;
        yAxisScale = value;
        return chart;
    };

    chart.xDataPoints = function(value) {
        if (!arguments.length) return xDataPoints;
        xDataPoints = value;
        return chart;
    };

    chart.yDataPoints = function(value) {
        if (!arguments.length) return yDataPoints;
        yDataPoints = value.constructor === Array ? value : [value];
        return chart;
    };

    chart.axisColor = function(value) {
        if (!arguments.length) return axisColor;
        axisColor = value;
        return chart;
    };

    chart.stroke = function(value) {
        if (!arguments.length) return stroke;
        stroke = value.constructor === Array ? value : [value];
        return chart;
    };

    chart.curve = function(value) {
        if (!arguments.length) return curve;
        curve = value.constructor === Array ? value : [value];
        return chart;
    };

    chart.scaleX = function() {
        return scaleX;
    };

    chart.scaleY = function() {
        return scaleY;
    };

    chart.update = function(data) {
        update(data);
        return chart;
    };

    chart.xMinMax = function(value) {
        if (!arguments.length) return xMinMax;
        xMinMax = value;
        return chart;
    };

    chart.yMinMax = function(value) {
        if (!arguments.length) return yMinMax;
        yMinMax = value;
        return chart;
    };

    chart.legendFill = function(value) {
        if (!arguments.length) return legendFill;
        legendFill = value;
        return chart;
    };

    chart.legendX = function(value) {
        if (!arguments.length) return legendX;
        legendX = value;
        return chart;
    };

    chart.legendY = function(value) {
        if (!arguments.length) return legendY;
        legendY = value;
        return chart;
    };

    chart.strokeWidth = function(value) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = value;
        return chart;
    };

    chart.setYMinToZero = function(value) {
        if (!arguments.length) return setYMinToZero;
        setYMinToZero = value;
        return chart;
    };

    chart.dataPointLineFill = function(value) {
        if (!arguments.length) return dataPointLineFill;
        dataPointLineFill = value;
        return chart;
    };

    chart.xDataPointsFormat = function(value) {
        if (!arguments.length) return xDataPointsFormat;
        xDataPointsFormat = value;
        return chart;
    };

    chart.yDataPointsFormat = function(value) {
        if (!arguments.length) return yDataPointsFormat;
        yDataPointsFormat = value;
        return chart;
    };

    chart.activateTooltip = function(value) {
        if (!arguments.length) return activateTooltip;
        console.log('ATTENTION: This feature is experimental.');
        activateTooltip = value;
        return chart;
    };

    chart.showLegend = function(value) {
        if (!arguments.length) return showLegend;
        showLegend = value;
        return chart;
    };

    chart.lineClass = function(value) {
        if (!arguments.length) return lineClass;
        lineClass = value;
        return chart;
    };

    return chart;
}

/* exported wbNetworkDiagram */
/**
 * Network diagram.
 * @return {Object} A reusable, updatable chart object.
 */
function wbNetworkDiagram() {
    'use strict';

    let width = 500;
    let height = 500;

    let linkStroke = 'black';
    let nodeStroke = 'black';
    let nodeStrokeWidth = 1;
    let legendColor = 'black';

    let thicknessRange = [1, 10];
    let radiusRange = [5, 20];

    let legend;
    let legendShiftX = 0;
    let legendShiftY = 0;

    let collide = 0.5;

    let colors = ['red', 'green', 'blue'];

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            // ----------------------------------------------------------------
            // SIMULATION HELPERS
            // ----------------------------------------------------------------

            let ticked = function() {
                node.attr('cx', function(d) {
                    return d.x = Math.max(d.r, Math.min(width - d.r, d.x));
                })
                    .attr('cy', function(d) {
                        return d.y = Math.max(d.r, Math.min(height - d.r, d.y));
                    });
                link.attr('x1', function(d) {
                    return d.source.x;
                })
                    .attr('y1', function(d) {
                        return d.source.y;
                    })
                    .attr('x2', function(d) {
                        return d.target.x;
                    })
                    .attr('y2', function(d) {
                        return d.target.y;
                    });
            };

            let dragstarted = function(d) {
                if (!d3.event.active) simulation.alphaTarget(0.5).restart();
                d.fx = d.x;
                d.fy = d.y;
            };

            let dragged = function(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            };

            let dragended = function(d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            };

            // ----------------------------------------------------------------
            // SCALES
            // ----------------------------------------------------------------

            let radius = d3.scaleLinear().domain(
                d3.extent(data.nodes, function(d) {
                    return d.weight;
                })).range(radiusRange);


            let scaleThickness =
                d3.scaleLinear().domain(d3.extent(data.links, function(d) {
                    return d.value;
                })).range(thicknessRange);

            // ----------------------------------------------------------------
            // DATA DEFINITION
            // ----------------------------------------------------------------

            data.nodes.forEach(function(d) {
                d.r = radius(d.weight);
            });

            let link = s.append('g')
                .selectAll('line')
                .data(data.links)
                .enter().append('line')
                .attr('class', 'lines')
                .attr('stroke-width', function(d) {
                    return scaleThickness(d.value);
                })
                .style('stroke', linkStroke)
                .style('stroke-opacity', '0.6');

            let node = s.append('g')
                .selectAll('circle')
                .data(data.nodes)
                .enter().append('circle')
                .attr('class', 'circles')
                .attr('r', function(d) {
                    return d.r;
                })
                .attr('fill', function(d) {
                    return colors[d.group];
                })
                .style('stroke', nodeStroke)
                .style('stroke-width', nodeStrokeWidth)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));

            // ----------------------------------------------------------------
            // SIMULATION DEFINITION
            // ----------------------------------------------------------------

            let simulation = d3.forceSimulation()
                .force('x', d3.forceX(width))
                .force('y', d3.forceY(height))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('charge', d3.forceManyBody())
                .force('collide', d3.forceCollide().radius(function(d) {
                    return d.r + collide;
                }).iterations(3))
                .force('link', d3.forceLink().id(function(d) {
                    return d.id;
                }));

            simulation
                .nodes(data.nodes)
                .on('tick', ticked);
            simulation.force('link')
                .links(data.links);

            // ----------------------------------------------------------------
            // LEGEND DEFINITION
            // ----------------------------------------------------------------

            if (legend === undefined) {
                let arr = [];
                data.nodes.forEach(function(d) {
                    arr.push(d.group);
                });
                let set = Array.from(new Set(arr.sort()));
                legend = [];
                for (let i = 0; i < set.length; i++) {
                    legend.push([set[i], colors(set[i])]);
                }
            }

            let legendG = s.append('g')
                .attr('font-size', '75%')
                .attr('text-anchor', 'end')
                .selectAll('g')
                .data(legend)
                .enter().append('g')
                .attr('transform', function(d, i) {
                    return 'translate(0,' + (i * 20 + 10) + ')';
                });

            legendG.append('rect')
                .attr('x', width - 19 + legendShiftX)
                .attr('y', 0 + legendShiftY)
                .attr('width', 19)
                .attr('height', 19)
                .attr('fill', function(d) {
                    return d[1];
                });

            legendG.append('text')
                .attr('x', width - 24 + legendShiftX)
                .attr('y', 9.5 + legendShiftY)
                .attr('dy', '0.32em')
                .attr('fill', legendColor)
                .text(function(d) {
                    return d[0];
                });
        });
    };

    chart.legendShiftX = function(value) {
        if (!arguments.length) return legendShiftX;
        legendShiftX = value;
        return chart;
    };

    chart.legendShiftY = function(value) {
        if (!arguments.length) return legendShiftY;
        legendShiftY = value;
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.linkStroke = function(value) {
        if (!arguments.length) return linkStroke;
        linkStroke = value;
        return chart;
    };

    chart.nodeStroke = function(value) {
        if (!arguments.length) return nodeStroke;
        nodeStroke = value;
        return chart;
    };

    chart.nodeStrokeWidth = function(value) {
        if (!arguments.length) return nodeStrokeWidth;
        nodeStrokeWidth = value;
        return chart;
    };

    chart.legend = function(value) {
        if (!arguments.length) return legend;
        legend = value;
        return chart;
    };

    chart.legendColor = function(value) {
        if (!arguments.length) return legendColor;
        legendColor = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    chart.collide = function(value) {
        if (!arguments.length) return collide;
        collide = value;
        return chart;
    };

    chart.thicknessRange = function(value) {
        if (!arguments.length) return thicknessRange;
        thicknessRange = value;
        return chart;
    };

    chart.radiusRange = function(value) {
        if (!arguments.length) return radiusRange;
        radiusRange = value;
        return chart;
    };

    return chart;
};

/* exported wbNumericHistogram */
/**
 * Numeric histogram with zoom functionality.
 * @return {Object} A reusable, updatable chart object.
 */
function wbNumericHistogram() {
    'use strict';

    let width = 500;
    let height = 500;
    let barColor = 'red';
    let axisColor = 'white';
    let numBins = 50;
    let updateCallback = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let sel = d3.select(nodes[i]);

            let xMinMaxNew;
            let xMinMax = d3.extent(data, function(d) {
                return d.value;
            });
            let x = d3.scaleLinear().rangeRound([0, width]);
            let t = sel.transition().duration(750);
            let y = d3.scaleLinear().rangeRound([height, 0]);
            let xAxis = d3.axisBottom(x);
            let yAxis = d3.axisLeft(y);


            let brush = d3.brushX()
                .extent([
                    [0, 0],
                    [width, height],
                ])
                .on('end', brushed);
            let clickTimeout = null;
            let clickDelay = 350;
            sel.append('g')
                .attr('class', 'brush')
                .call(brush);
            let rectg = sel.append('g');
            sel.append('g')
                .attr('transform', 'translate(0,' + height + ')')
                .attr('class', 'axis axis-x');
            sel.append('g')
                .attr('class', 'axis axis-y');

            draw(xMinMax);

            /**
             * tbd
             * @param {*} xMinMax
             */
            function draw(xMinMax) {
                x.domain(xMinMax);
                let bins = d3.histogram()
                    .value(function(d) {
                        return d.value;
                    })
                    .domain(x.domain())
                    .thresholds(x.ticks(numBins))(data);

                let yMinMax = d3.extent(bins, function(d) {
                    return d.length;
                });
                y.domain(yMinMax);

                let rects = rectg.selectAll('.bar')
                    .remove()
                    .exit()
                    .data(bins);

                rects.enter().append('rect')
                    .attr('class', 'bar')
                    .attr('fill', barColor)
                    .attr('width', function(d, i) {
                        let wid = width / bins.length;
                        let pad = wid * 0.1;
                        wid = wid - pad;
                        return wid;
                    })
                    .attr('height', function(d) {
                        return height - y(d.length);
                    })
                    .attr('y', function(d) {
                        return y(d.length);
                    })
                    .transition(t)
                    .attr('x', function(d) {
                        return x(d.x0);
                    });

                sel.select('.axis-x').transition(t).call(xAxis);
                sel.select('.axis-y').transition(t).call(yAxis);

                sel.selectAll('.axis line')
                    .attr('stroke', axisColor);
                sel.selectAll('.axis path')
                    .attr('stroke', axisColor);
                sel.selectAll('.axis text')
                    .attr('fill', axisColor);

                updateCallback();
            };

            /**
             * Called when brush function begins.
             * @return {number} The current click timeout.
             */
            function brushed() {
                let s = d3.event.selection; // get selection..
                if (!s) { // if selection is empty ...
                    // if not active, set a timeout and return...
                    if (!clickTimeout) {
                        return clickTimeout =
                        setTimeout(notClicked, clickDelay);
                    }
                    // if click timeout not reached, then reset x selection
                    xMinMaxNew = xMinMax;
                } else {
                    // get min max values corresponding to current selection
                    xMinMaxNew = [
                        x.invert(s[0]) < xMinMax[0] ?
                        xMinMax[0] : x.invert(s[0]),
                        x.invert(s[1]) > xMinMax[1] ?
                        xMinMax[1] : x.invert(s[1]),
                    ];
                    sel.select('.brush').call(brush.move, null);
                }
                brushedEnd();
            };

            /**
             * Reset click timeout.
             */
            function notClicked() {
                clickTimeout = null;
            };

            /**
             * Called when brush action has ended.
             */
            let brushedEnd = function() {
                draw(xMinMaxNew);
            };
        });
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.barColor = function(value) {
        if (!arguments.length) return barColor;
        barColor = value;
        return chart;
    };

    chart.axisColor = function(value) {
        if (!arguments.length) return axisColor;
        axisColor = value;
        return chart;
    };

    chart.numBins = function(value) {
        if (!arguments.length) return numBins;
        numBins = value;
        return chart;
    };

    chart.updateCallback = function(value) {
        if (!arguments.length) return updateCallback;
        updateCallback = value;
        return chart;
    };

    return chart;
};

/* exported wbPackedBubbles */
/**
 * Packed bubble visualization.
 * @return {Object} A reusable, updatable chart object.
 */
function wbPackedBubbles() {
    'use strict';

    let width = 500;
    let height = 500;
    let colorRange = ['green', 'white'];
    let fillRange = ['green', 'red'];
    let fadeOpacity;
    let fadeScale;

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let minMax = d3.extent(data, function(d) {
                return d.value;
            });

            let fgColors = d3.scaleLinear().domain(minMax)
                .interpolate(d3.interpolate)
                .range(colorRange);
            let bgColors = d3.scaleLinear().domain(minMax)
                .interpolate(d3.interpolate)
                .range(fillRange);

            if (fadeOpacity) {
                fadeScale = d3.scaleLog().domain(minMax)
                    .range(fadeOpacity);
            }

            let pack = d3.pack()
                .size([width, height])
                .padding(0.3);

            let root = d3.hierarchy({
                    children: data,
                })
                .sum(function(d) {
                    return d.value;
                });

            let bubbleNodes = s.selectAll('node')
                .data(pack(root).leaves())
                .enter().append('g')
                .attr('class', 'node')
                .attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });

            bubbleNodes
                .append('a').attr('xlink:href', function(d) {
                    return d.data.link;
                })
                .append('circle')
                .attr('class', 'circles')
                .attr('id', function(d) {
                    return d.id;
                })
                .transition().duration(500)
                .attr('r', function(d) {
                    return d.r;
                })
                .style('fill', function(d) {
                    return bgColors(d.value);
                })
                .style('opacity', function(d) {
                    if (fadeOpacity) {
                        return fadeScale(d.value);
                    }
                    return '1.0';
                });

            bubbleNodes
                .append('a').attr('xlink:href', function(d) {
                    return d.data.link;
                })
                .append('text')
                .attr('class', 'texts')
                .style('font-size', '10px')
                .style('text-anchor', 'middle')
                .style('dominant-baseline', 'middle')
                .style('cursor', 'default')
                .style('user-select', 'none')
                .style('-moz-user-select', 'none')
                .attr('x', 0)
                .attr('y', 0)
                .text(function(d) {
                    return d.data.id;
                })
                .style('font-size', function(d, i, nodes) {
                    return ((2 * d.r - 10) /
                    nodes[i].getComputedTextLength() * 10) + 'px';
                })
                .style('opacity', function(d) {
                    if (fadeOpacity) {
                        return fadeScale(d.value);
                    }
                    return '1.0';
                })
                .transition().duration(1000)
                .style('fill', function(d) {
                    return fgColors(d.value);
                });
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.colorRange = function(value) {
        if (!arguments.length) return colorRange;
        colorRange = value;
        return chart;
    };

    chart.fillRange = function(value) {
        if (!arguments.length) return fillRange;
        fillRange = value;
        return chart;
    };

    chart.fadeOpacity = function(value) {
        if (!arguments.length) return fadeOpacity;
        fadeOpacity = value;
        return chart;
    };

    chart.fadeScale = function(value) {
        if (!arguments.length) return fadeScale;
        fadeScale = value;
        return chart;
    };

    return chart;
}

/* exported wbPosNeg */
/**
 * A positive-negative comparison chart.
 * @return {Object} A reusable, updatable chart object.
 */
let wbPosNeg = function() {
    'use strict';

    let width = 500;
    let height = 500;
    let padding = 0.1;
    let scaleX;
    let scaleY;
    let fillPos = 'green';
    let fillNeg = 'red';

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            data.forEach(function(d) {
                d['pos'] = +d['pos'];
                d['neg'] = +d['neg'];
                d['sum'] = +d['sum'];
            });
            // reverse to make rect-generator code easier to read
            data = data.reverse();

            let xMinMax = d3.extent(data, function(d) {
                return Math.max(d['pos'], -d['neg']);
            });
            xMinMax[0] = 0;

            scaleX = d3.scaleLinear()
                .range([0, width / 2])
                .domain(xMinMax);

            scaleY = d3
                .scaleBand()
                .rangeRound([height, 0], .1)
                .padding(0.2)
                .domain(data.map(function(d) {
                    return d['label'];
                }));

            s.selectAll('.rects-pos')
                .remove()
                .exit()
                .data(data)
                .enter().append('rect')
                .attr('class', 'rects-pos')
                .attr('x', width / 2)
                .attr('width', function(d) {
                    return scaleX(d['pos']);
                })
                .attr('y', function(d) {
                    return scaleY(d['label']);
                })
                .attr('height', function(d) {
                    return scaleY.bandwidth();
                })
                .style('fill', fillPos);

            s.selectAll('.rects-neg')
                .remove()
                .exit()
                .data(data)
                .enter().append('rect')
                .attr('class', 'rects-neg')
                .attr('x', function(d) {
                    return (width / 2) - scaleX(-d['neg']);
                })
                .attr('width', function(d) {
                    return scaleX(-d['neg']);
                })
                .attr('y', function(d) {
                    return scaleY(d['label']);
                })
                .attr('height', function(d) {
                    return scaleY.bandwidth();
                })
                .style('fill', fillNeg);
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.scaleX = function(value) {
        if (!arguments.length) return scaleX;
        scaleX = value;
        return chart;
    };

    chart.scaleY = function(value) {
        if (!arguments.length) return scaleY;
        scaleY = value;
        return chart;
    };

    chart.fillPos = function(value) {
        if (!arguments.length) return fillPos;
        fillPos = value;
        return chart;
    };

    chart.fillNeg = function(value) {
        if (!arguments.length) return fillNeg;
        fillNeg = value;
        return chart;
    };

    chart.padding = function(value) {
        if (!arguments.length) return padding;
        padding = value;
        return chart;
    };

    return chart;
};

/* exported wbSankeyDiagram */
/**
 * Classic sankey diagram.
 * @return {Object} A reusable, updatable chart object.
 */
function wbSankeyDiagram() {
    'use strict';

    let width = 500;
    let height = 500;
    let fill = 'black';
    let colors = d3.scaleOrdinal(d3.schemeCategory20c);

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let sankey = d3.sankey()
                .nodeWidth(15)
                .nodePadding(10)
                .size([width, height]);

            sankey(data);

            s.append('g')
                .attr('class', 'sankey-link')
                .style('fill', 'none')
                .style('stroke', fill)
                .style('stroke-opacity', .2)
                .selectAll('path')
                .data(data.links)
                .enter().append('path')
                .attr('d', d3.sankeyLinkHorizontal())
                .attr('stroke-width', function(d) {
                    return Math.max(1, d.width);
                });

            let node = s.append('g')
                .attr('class', 'sankey-node')
                .selectAll('g')
                .data(data.nodes)
                .enter().append('g');

            node.append('rect')
                .attr('x', function(d) {
                    return d.x0;
                })
                .attr('y', function(d) {
                    return d.y0;
                })
                .attr('height', function(d) {
                    return d.y1 - d.y0;
                })
                .attr('width', function(d) {
                    return d.x1 - d.x0;
                })
                .attr('fill', function(d) {
                    return colors(d.name.replace(/ .*/, ''));
                })
                .style('stroke', function(d) {
                    return fill;
                });

            node.append('text')
                .style('fill', function(d) {
                    return fill;
                })
                .attr('x', function(d) {
                    return d.x0 - 6;
                })
                .attr('y', function(d) {
                    return (d.y1 + d.y0) / 2;
                })
                .attr('text-anchor', 'end')
                .text(function(d) {
                    return d.name;
                })
                .filter(function(d) {
                    return d.x0 < width / 2;
                })
                .attr('x', function(d) {
                    return d.x1 + 6;
                })
                .attr('text-anchor', 'start');
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.fill = function(value) {
        if (!arguments.length) return fill;
        fill = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    return chart;
};

/* exported wbScatterPlot */
/**
 * Basic scatter plot.
 * @return {Object} A reusable, updatable chart object.
 */
function wbScatterPlot() {
    'use strict';

    let width = 500;
    let height = 500;

    let xDataPoints = 'x';
    let yDataPoints = 'y';
    let zDataPoints;

    let xAxisScale = d3.scaleLinear();
    let yAxisScale = d3.scaleLinear();
    let zAxisScale = d3.scaleLinear();

    let color;
    let colorLow = 'green';
    let colorHigh = 'red';

    let opacityDataPoints = undefined;
    let opacityRange = [0.0, 1.0];

    let update = function() {};

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);
            let rsize = 8;

            let xMinMax = d3.extent(data, function(d) {
                return d[xDataPoints];
            });
            let yMinMax = d3.extent(data, function(d) {
                return d[yDataPoints];
            });
            zDataPoints = zDataPoints || xDataPoints;
            let zMinMax = d3.extent(data, function(d) {
                return d[zDataPoints];
            });

            s.selectAll('.scatter-datapoint')
                .data(data).enter()
                .append('rect')
                .attr('class', 'scatter-datapoint')
                .attr('width', rsize)
                .attr('height', rsize)
                .attr('rx', 5);

            let x;
            let y;
            let z;
            let o;

            update = function(first) {
                first = first || false;

                if (opacityDataPoints !== undefined) {
                    o = d3.scaleLog()
                        .domain(d3.extent(data, function(d) {
                            return d[opacityDataPoints];
                        })).range(opacityRange);
                }
                x = xAxisScale.range([0, width]).domain(xMinMax);
                y = yAxisScale.range([height, 0]).domain(yMinMax);
                z = zAxisScale.domain(zMinMax)
                    .interpolate(d3.interpolate)
                    .range([colorLow, colorHigh]);

                let up;
                if (first) {
                    up = s.selectAll('.scatter-datapoint');
                } else {
                    up = s.selectAll('.scatter-datapoint')
                        .transition().duration(500);
                }

                up.attr('opacity', function(d) {
                        if (opacityDataPoints !== undefined) {
                            return o(d[opacityDataPoints]);
                        }
                        return 1.0;
                    })
                    .attr('x', function(d) {
                        return x(d[xDataPoints]) - rsize / 2;
                    })
                    .attr('y', function(d) {
                        return y(d[yDataPoints]) - rsize / 2;
                    })
                    .style('fill', function(d) {
                        return z(d[zDataPoints]);
                    });
            };
            update(true);
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.xAxisScale = function(value) {
        if (!arguments.length) return xAxisScale;
        xAxisScale = value;
        return chart;
    };

    chart.yAxisScale = function(value) {
        if (!arguments.length) return yAxisScale;
        yAxisScale = value;
        return chart;
    };

    chart.zAxisScale = function(value) {
        if (!arguments.length) return zAxisScale;
        zAxisScale = value;
        return chart;
    };

    chart.xDataPoints = function(value) {
        if (!arguments.length) return xDataPoints;
        xDataPoints = value;
        return chart;
    };

    chart.yDataPoints = function(value) {
        if (!arguments.length) return yDataPoints;
        yDataPoints = value;
        return chart;
    };

    chart.zDataPoints = function(value) {
        if (!arguments.length) return zDataPoints;
        zDataPoints = value;
        return chart;
    };

    chart.opacityDataPoints = function(value) {
        if (!arguments.length) return opacityDataPoints;
        opacityDataPoints = value;
        return chart;
    };

    chart.opacityRange = function(value) {
        if (!arguments.length) return opacityRange;
        opacityRange = value;
        return chart;
    };

    chart.colorLow = function(value) {
        if (!arguments.length) return colorLow;
        colorLow = value;
        return chart;
    };

    chart.colorHigh = function(value) {
        if (!arguments.length) return colorHigh;
        colorHigh = value;
        return chart;
    };

    chart.color = function(value) {
        if (!arguments.length) return color;
        colorLow = value;
        colorHigh = value;
        return chart;
    };

    chart.update = function() {
        update();
        return chart;
    };

    return chart;
}

/* exported wbStackedBarChart */
/**
 * Extended bar chart that supports stacked data.
 * @return {Object} A reusable, updatable chart object.
 */
function wbStackedBarChart() {
    'use strict';

    let width = 500;
    let height = 500;
    let xSelector = 'x';
    let ySelector = 'y';
    let idColumn = 'id';
    let colors = ['red', 'green', 'blue'];
    let legendFill = 'black';
    let stroke = 'black';
    let strokeWidth = 0;
    let legendX = 0;
    let legendY = 0;
    let padding = 0.1;
    let align = 0.0;
    let showLegend = true;
    let ignoreColumns = [];
    let scaleX;
    let scaleY;
    let sortBySum = false;

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            // calculate totals
            data.forEach(function(d, i) {
                let keys = Object.keys(d);
                d.total = 0;
                for (i = 0; i < keys.length; ++i) {
                    if (ignoreColumns.includes(keys[i])) {
                        continue;
                    }
                    if (keys[i] == idColumn) {
                        continue;
                    }
                    d.total = d.total + +d[keys[i]];
                }
            });

            // sort data if desired
            if (sortBySum) {
                data.sort(function(a, b) {
                    return b.total - a.total;
                });
            }

            // generate scales
            scaleX = d3.scaleBand().rangeRound([0, width])
                .padding(padding)
                .align(align);
            scaleY = d3.scaleLinear().rangeRound([height, 0]);
            let scaleZ = d3.scaleOrdinal().range(colors);
            scaleX.domain(data.map(function(d) {
                return d.id;
            }));
            scaleY.domain([0, d3.max(data, function(d) {
                return d.total;
            })]).nice();

            let keys = data.columns.filter(function(d) {
                return d != idColumn && !ignoreColumns.includes(d);
            });
            scaleZ.domain(keys);

            let stack = d3.stack().keys(keys)(data);
            // append key to each stack element for later reference
            stack.forEach(function(d) {
                d.forEach(function(e) {
                    e['keyRef'] = d.key;
                });
            });

            // draw chart
            s.append('g')
                .selectAll('g')
                .data(stack)
                .enter().append('g')
                .attr('fill', function(d) {
                    return scaleZ(d.key);
                })
                .selectAll('rect')
                .data(function(d, i) {
                    return d;
                })
                .enter().append('rect')
                .attr('class', 'rects')
                .attr('x', function(d) {
                    return scaleX(d.data.id);
                })
                .attr('y', function(d) {
                    return scaleY(d[1]);
                })
                .attr('height', function(d) {
                    return scaleY(d[0]) - scaleY(d[1]);
                })
                .attr('width', scaleX.bandwidth())
                .style('stroke', stroke)
                .style('stroke-width', strokeWidth);

            if (showLegend) {
                let legend = s.append('g')
                    .attr('font-size', '75%')
                    .attr('text-anchor', 'end')
                    .attr('transform', 'translate(' +
                        legendX + ',' + legendY + ')')
                    .selectAll('g')
                    .data(keys.slice())
                    .enter().append('g')
                    .attr('transform', function(d, i) {
                        return 'translate(0,' + i * 20 + ')';
                    });

                let rw = 19;
                legend.append('rect')
                    .attr('x', -rw)
                    .attr('width', rw)
                    .attr('height', rw)
                    .attr('fill', scaleZ);

                legend.append('text')
                    .attr('x', -rw - 3)
                    .attr('y', 9.5)
                    .attr('dy', '0.32em')
                    .text(function(d) {
                        return d;
                    })
                    .attr('fill', legendFill);
            }
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.xSelector = function(value) {
        if (!arguments.length) return xSelector;
        xSelector = value;
        return chart;
    };

    chart.ySelector = function(value) {
        if (!arguments.length) return ySelector;
        ySelector = value;
        return chart;
    };

    chart.scaleX = function(value) {
        if (!arguments.length) return scaleX;
        scaleX = value;
        return chart;
    };

    chart.scaleY = function(value) {
        if (!arguments.length) return scaleY;
        scaleY = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    chart.legendFill = function(value) {
        if (!arguments.length) return legendFill;
        legendFill = value;
        return chart;
    };

    chart.legendX = function(value) {
        if (!arguments.length) return legendX;
        legendX = value;
        return chart;
    };

    chart.legendY = function(value) {
        if (!arguments.length) return legendY;
        legendY = value;
        return chart;
    };

    chart.sortBySum = function(value) {
        if (!arguments.length) return sortBySum;
        sortBySum = value;
        return chart;
    };

    chart.ignoreColumns = function(value) {
        if (!arguments.length) return ignoreColumns;
        ignoreColumns = value;
        return chart;
    };

    chart.padding = function(value) {
        if (!arguments.length) return padding;
        padding = value;
        return chart;
    };

    chart.align = function(value) {
        if (!arguments.length) return align;
        align = value;
        return chart;
    };

    chart.showLegend = function(value) {
        if (!arguments.length) return showLegend;
        showLegend = value;
        return chart;
    };

    chart.stroke = function(value) {
        if (!arguments.length) return stroke;
        stroke = value;
        return chart;
    };

    chart.strokeWidth = function(value) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = value;
        return chart;
    };

    return chart;
};

/* exported wbStaticNumbers */
/**
 * Not a diagram, but a visualization of a list of
 * numbers and their explanations.
 * @return {Object} A reusable, updatable chart object.
 */
function wbStaticNumbers() {
    'use strict';

    let width = 500;
    let height = 500;
    let fillNumber = 'black';
    let fillLabel = 'red';

    // internal
    let debug = false;
    let REF_FONTSIZE = 20;

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let cw = width / data.length; // width of column
            let cp = (width * 0.1) / (data.length - 1); // padding betw. column
            let ol = 0.25; // number-label overlap percent

            s.selectAll('number-value')
                .data(data)
                .enter()
                .append('text')
                .text(function(d) {
                    return d.name;
                })
                .attr('x', function(d, i) {
                    return i * cw;
                })
                .attr('y', height)
                .attr('text-anchor', 'left')
                .attr('dominant-baseline', 'baseline')
                .attr('fill', fillNumber)
                .style('font-size', REF_FONTSIZE + 'px')
                .style('font-weight', 'bold')
                .text(function(d) {
                    return d.value;
                })
                .style('font-size', function(d, i, nodes) {
                    return calculateNewFontsize(nodes[i], cw, cp) + 'px';
                })
                .call(d3wb.util.makeUnselectable())
                .each(function(d, i, nodes) {
                    d.numberBox = nodes[i].getBBox();
                });

            debugNumbers(s, data);

            s.selectAll('number-label')
                .data(data)
                .enter()
                .append('text')
                .text(function(d) {
                    return d.name;
                })
                .attr('x', function(d, i) {
                    return i * cw;
                })
                .attr('y', function(d) {
                    return height - d.numberBox.height
                    + (ol * d.numberBox.height);
                })
                .attr('text-anchor', 'left')
                .attr('fill', fillLabel)
                .style('font-size', REF_FONTSIZE + 'px')
                .text(function(d) {
                    return d.label;
                })
                .style('font-size', function(d, i, nodes) {
                    return calculateNewFontsize(nodes[i], cw, cp) + 'px';
                })
                .call(d3wb.util.makeUnselectable())
                .each(function(d, i, nodes) {
                    d.numberBox = nodes[i].getBBox();
                });

            debugLabels(s, data);
        });
    };

    let calculateNewFontsize = function(thiss, cw, cp) {
        let textLength = thiss.getComputedTextLength();
        if (debug) {
            console.log('TL=' + textLength);
            console.log(thiss.getBBox().width);
        }
        return (cw - cp) / textLength * REF_FONTSIZE;
    };

    let debugNumbers = function(s, data) {
        if (!debug) return;
        s.selectAll('.debug-rect-numbers')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'debug-rect-numbers')
            .attr('x', function(d) {
                return d.numberBox.x;
            })
            .attr('y', function(d) {
                return d.numberBox.y;
            })
            .attr('height', function(d) {
                return d.numberBox.height;
            })
            .attr('width', function(d) {
                return d.numberBox.width;
            })
            .style('stroke', 'green')
            .style('stroke-width', 1)
            .style('fill', 'none');
    };

    let debugLabels = function(s, data) {
        if (!debug) return;
        s.selectAll('.debug-rect-labels')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'debug-rect-labels')
            .attr('x', function(d) {
                return d.numberBox.x;
            })
            .attr('y', function(d) {
                return d.numberBox.y;
            })
            .attr('height', function(d) {
                return d.numberBox.height;
            })
            .attr('width', function(d) {
                return d.numberBox.width;
            })
            .style('stroke', 'red')
            .style('stroke-width', 1)
            .style('fill', 'none');
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.fillNumber = function(value) {
        if (!arguments.length) return fillNumber;
        fillNumber = value;
        return chart;
    };

    chart.fillLabel = function(value) {
        if (!arguments.length) return fillLabel;
        fillLabel = value;
        return chart;
    };

    return chart;
}

/* exported wbTimeseries */
/**
 * Time series histogram.
 * @return {Object} A reusable, updatable chart object.
 */
function wbTimeseries() {
    'use strict';

    // %a - abbreviated weekday name.*
    // %c - the locale’s date and time, such as %x, %X.*
    // %b - abbreviated month name.*
    // %A - full weekday name.*
    // %B - full month name.*
    // %d - zero-padded day of the month as a decimal number [01,31].
    // %e - space-padded day of the month as a decimal number [ 1,31];
    // %H - hour (24-hour clock) as a decimal number [00,23].
    // %I - hour (12-hour clock) as a decimal number [01,12].
    // %j - day of the year as a decimal number [001,366].
    // %m - month as a decimal number [01,12].
    // %M - minute as a decimal number [00,59].
    // %L - milliseconds as a decimal number [000, 999].
    // %p - either AM or PM.*
    // %S - second as a decimal number [00,61].
    // %U - Sunday-based week of the year as a decimal number [00,53].
    // %w - Sunday-based weekday as a decimal number [0,6].
    // %W - Monday-based week of the year as a decimal number [00,53].
    // %x - the locale’s date, such as %-m/%-d/%Y.*
    // %X - the locale’s time, such as %-I:%M:%S %p.*
    // %y - year without century as a decimal number [00,99].
    // %Y - year with century as a decimal number.
    // %Z - time zone offset, such as -0700, -07:00, -07, or Z.
    // %% - a literal percent sign (%).

    let width = 500;
    let height = 500;
    let target = 'hour';
    let fill = 'red';
    let fillValues = 'orange';
    let fillAxis = 'black';
    let valueColumn = undefined;
    let valueColumnAggregation = d3.mean;
    let scaleX;
    let scaleY;
    let scaleY2;

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let minMaxData = d3.extent(data, function(d) {
                return d.date;
            });

            data.forEach(function(d) {
                d['month'] = d.date.getMonth();
                d['year'] = d.date.getFullYear();
                d['weekday'] = d.date.getDay();
                d['hour'] = d.date.getHours();
                d['minute'] = d.date.getMinutes();
                d['day'] = new Date(d.date).setHours(0, 0, 0, 0);
                d['minute-of-day'] = new Date(d.date).setSeconds(0, 0);
            });
            let minMax = d3.extent(data, function(d) {
                return d[target];
            });

            // console.log(target);
            // console.log(minMax);

            let xAxisTicks;
            let xAxisFormat;
            if (target == 'month') {
                xAxisTicks = d3.timeMonths(
                    new Date(2017, 0, 1), new Date(2017, 11, 31));
                xAxisFormat = d3.timeFormat('%B');
            } else if (target == 'year') {
                xAxisTicks = d3.timeYears(new Date(minMax[0], 0, 1),
                    new Date(minMax[1], 12, 1));
                xAxisFormat = function(f) {
                    return f;
                };
                let sub = [];
                xAxisTicks.forEach(function(d) {
                    sub.push(d.getFullYear());
                });
                xAxisTicks = sub;
            } else if (target == 'weekday') {
                xAxisTicks = [0, 1, 2, 3, 4, 5, 6];
                xAxisFormat = d3.timeFormat('%A');
            } else if (target == 'day') {
                xAxisTicks = d3.timeDays(
                    minMaxData[0], minMaxData[1]);
                xAxisFormat = d3.timeFormat('%d.%m.%Y');
            } else if (target == 'minute-of-day') {
                xAxisTicks = d3.timeMinutes(
                    minMaxData[0] - 60 * 1000, minMaxData[1]);
                xAxisFormat = d3.timeFormat('%H:%M');
            }

            scaleX = d3.scaleOrdinal().domain(xAxisTicks).range(
                d3.range(0, width, width / xAxisTicks.length));

            let padding1 = (width / xAxisTicks.length) * 0.1;

            let histogram = d3.histogram().value(function(d) {
                return d[target];
            }).thresholds(xAxisTicks);

            let bins = histogram(data);

            let maxVals = d3.max(bins, function(d) {
                return d.length;
            });

            scaleY = d3.scaleLinear()
                .range([height, 0])
                .domain([0, maxVals + 1]);

            minMax = d3.extent(bins, function(d) {
                return d.length;
            });

            let barwid = width / xAxisTicks.length - padding1;

            s.selectAll('rect')
                .data(bins)
                .enter().append('rect')
                .attr('class', 'rects')
                .attr('x', 0)
                .attr('fill', function(d) {
                    return fill;
                })
                .attr('transform', function(d) {
                    return 'translate(' + scaleX(d.x0) +
                     ',' + scaleY(d.length) + ')';
                })
                .attr('width', function(d) {
                    return barwid;
                })
                .attr('height', function(d) {
                    return height - scaleY(d.length);
                });

            if (valueColumn) {
                bins.forEach(function(d) {
                    let values = [];
                    d.forEach(function(s) {
                        values = values.concat(s.value);
                    });
                    d.mean = valueColumnAggregation(values);
                });
                let x = d3.scaleOrdinal().domain(xAxisTicks).range(
                    d3.range(0, width, width / xAxisTicks.length));
                let padding2 = (width / xAxisTicks.length) * 0.8;

                let maxVals = d3.max(bins, function(d) {
                    return d.mean;
                });
                scaleY2 = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, maxVals + 1]);

                s.selectAll('.dim')
                    .data(bins)
                    .enter().append('rect')
                    .attr('class', 'valuerects')
                    .attr('fill', function(d) {
                        return fillValues;
                    })
                    .attr('transform', function(d) {
                        let mid = barwid / 2 - (
                            width / xAxisTicks.length) * 0.1;
                        // - padding/2
                        return 'translate(' + (x(d.x0) + mid) +
                         ',' + scaleY2(d.mean) + ')';
                    })
                    .attr('width', function(d) {
                        return width / xAxisTicks.length - padding2;
                    })
                    .attr('height', function(d) {
                        return height - scaleY2(d.mean);
                    });
            }

            // manually generate the discrete x-axis
            let bar = s.append('g')
                .attr('transform', 'translate(0,' + height + ')')
                .selectAll('xaxis').data(bins).enter();

            bar.append('line')
                .attr('x1', 0).attr('x2', width).style('stroke',
                    fillAxis);

            bar.append('text').text(function(d, i) {
                    if (target != 'weekday') {
                        return xAxisFormat(xAxisTicks[i]);
                    } else {
                        // artifical dates
                        let xForm = d3.timeDays(new Date(2017, 0, 1),
                            new Date(2017, 0, 8));
                        return xAxisFormat(xForm[xAxisTicks[i]]);
                    }
                })
                .style('text-anchor', 'middle')
                .style('font-size', '70%')
                .style('fill', fillAxis)
                .attr('x', function(d, i) {
                    return i * (width / xAxisTicks.length) + (width
                        / xAxisTicks.length / 2) - (padding1 / 2);
                }).attr('y', function(d, i, nodes) {
                    return nodes[i].getBBox().height + 5;
                });

            bar.append('line')
                .attr('x1', function(d, i) {
                    return i * (width / xAxisTicks.length) + (width
                        / xAxisTicks.length / 2) - (padding1 / 2);
                }).attr('x2', function(d, i) {
                    return i * (width / xAxisTicks.length) + (width
                        / xAxisTicks.length / 2) - (padding1 / 2);
                }).attr('y1', 0).attr('y2', 5).style('stroke',
                    fillAxis);
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.target = function(value) {
        if (!arguments.length) return target;
        target = value;
        return chart;
    };

    chart.fill = function(value) {
        if (!arguments.length) return fill;
        fill = value;
        return chart;
    };

    chart.fillValues = function(value) {
        if (!arguments.length) return fillValues;
        fillValues = value;
        return chart;
    };

    chart.fillAxis = function(value) {
        if (!arguments.length) return fillAxis;
        fillAxis = value;
        return chart;
    };

    chart.scaleX = function(value) {
        if (!arguments.length) return scaleX;
        scaleX = value;
        return chart;
    };

    chart.scaleY = function(value) {
        if (!arguments.length) return scaleY;
        scaleY = value;
        return chart;
    };

    chart.scaleY2 = function(value) {
        if (!arguments.length) return scaleY2;
        scaleY2 = value;
        return chart;
    };

    chart.valueColumn = function(value) {
        if (!arguments.length) return valueColumn;
        valueColumn = value;
        return chart;
    };

    chart.valueColumnAggregation = function(value) {
        if (!arguments.length) return valueColumnAggregation;
        valueColumnAggregation = value;
        return chart;
    };

    return chart;
}

/* exported wbTreeMap */
/**
 * Basic tree map diagram.
 * @return {Object} A reusable, updatable chart object.
 */
function wbTreeMap() {
    'use strict';

    let width = 500;
    let height = 500;
    let colors = d3.scaleOrdinal(d3.schemeCategory20c);
    let fill = 'black';

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            let treemap = d3.treemap()
                .tile(d3.treemapResquarify)
                .size([width, height])
                .round(true)
                .paddingInner(1.5);

            let root = d3.hierarchy(data)
                .eachBefore(function(d) {
                    d.data.id = (d.parent ? d.parent.data.id +
                         '.' : '') + d.data.name;
                })
                .sum(function(d) {
                    return d.size;
                })
                .sort(function(a, b) {
                    return b.height - a.height || b.value - a.value;
                });

            treemap(root);

            let cell = s.selectAll('g')
                .data(root.leaves())
                .enter().append('g')
                .attr('class', 'cells')

                .attr('transform', function(d) {
                    return 'translate(' + d.x0 + ',' + d.y0 + ')';
                });

            cell.append('rect')
                .attr('id', function(d) {
                    return d.data.id;
                })
                .attr('width', function(d) {
                    return d.x1 - d.x0;
                })
                .attr('height', function(d) {
                    return d.y1 - d.y0;
                })
                .attr('fill', function(d) {
                    return colors(d.parent.data.id);
                });

            cell.append('clipPath')
                .attr('id', function(d) {
                    return 'clip-' + d.data.id;
                })
                .append('use')
                .attr('xlink:href', function(d) {
                    return '#' + d.data.id;
                });

            cell.append('text')
                .style('font-size', '75%')
                .attr('clip-path', function(d) {
                    return 'url(#clip-' + d.data.id + ')';
                })
                .selectAll('tspan')
                .data(function(d) {
                    return d.data.name.split(/(?=[A-Z][^A-Z])/g);
                })
                .enter().append('tspan')
                .attr('x', 4)
                .attr('y', function(d, i) {
                    return 13 + i * 10;
                })
                .attr('fill', fill)
                .text(function(d) {
                    return d;
                });
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    };

    chart.fill = function(value) {
        if (!arguments.length) return fill;
        fill = value;
        return chart;
    };

    return chart;
}

/* exported wbWordCloud */
/**
 * Word-cloud visualization.
 * @return {Object} A reusable, updatable chart object.
 */
function wbWordCloud() {
    'use strict';

    let width = 500;
    let height = 500;
    let colorRange = ['green', 'green'];

    let chart = function(selection) {
        selection.each(function(data, i, nodes) {
            let s = d3.select(nodes[i]);

            data.forEach(function(d) {
                d.fontsize = +d.textrank * 10000;
            });
            let minMax = d3.extent(data, function(d) {
                return d.textrank;
            });
            let fgColors = d3.scaleLinear().domain(minMax)
                .interpolate(d3.interpolate)
                .range(colorRange);

            d3.layout.cloud().size([width, height])
                .words(data)
                .padding(1)
                .rotate(0)
                .font('Roboto Condensed')
                .fontSize(function(d) {
                    return d.fontsize;
                })
                .on('end', function(data) {
                    s.attr('transform', 'translate(' +
                        (width / 2) + ',' +
                        (height / 2) + ')');

                    let cloud = s.selectAll('text')
                        .data(data, function(d) {
                            return d.text;
                        });

                    cloud.enter()
                        .append('text')
                        .style('fill', function(d) {
                            return fgColors(d.textrank);
                        })
                        .attr('text-anchor', 'middle')
                        .attr('font-size', function(d) {
                            return d.size + 'px';
                        })
                        .attr('transform', function(d) {
                            return 'translate(' + [d.x, d.y] +
                             ')rotate(' + d.rotate + ')';
                        })
                        .text(function(d) {
                            return d.text;
                        });

                    cloud.exit().remove();
                }).start();
        });
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.colorRange = function(value) {
        if (!arguments.length) return colorRange;
        colorRange = value;
        return chart;
    };

    return chart;
}
