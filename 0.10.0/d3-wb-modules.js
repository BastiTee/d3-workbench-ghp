/**
 * d3-workbench (d3wb) 'util' extension module.
 *
 * A collection of utility functions to reduce boilerplate and to
 * speed up visualization development.
 *
 * @author BastiTee
 */
(function(global, factory) {
    if (global.d3wb === undefined) {
        throw new Error('d3wb required but not loaded.');
    }
    typeof exports === 'object' && typeof module !== 'undefined' ?
        factory(exports) : typeof define === 'function' &&
        define.amd ? define(['exports'], factory) :
        (factory((global.d3wb.util = global.d3wb.util || {})));
}(this, (function(exports) {
    'use strict';

    /* *********************************************************************
     * PUBLIC FUNCTIONS
     * ********************************************************************* */

    const changeCSVSeparator = function(sep) {
        d3.csv = function(url, callback) {
            d3.request(url)
                .mimeType('text/csv')
                .response(function(xhr) {
                    return d3.dsvFormat(sep).parse(xhr.responseText);
                })
                .get(callback);
        };
    };

    const setLocale = function(lang) {
        if (lang == 'de') {
            d3.timeFormat = d3.timeFormatLocale({
                'dateTime': '%A, der %e. %B %Y, %X',
                'date': '%d.%m.%Y',
                'time': '%H:%M:%S',
                'periods': ['AM', 'PM'],
                'days': ['Sonntag', 'Montag', 'Dienstag',
                'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
                'shortDays': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
                'months': ['Januar', 'Februar', 'März', 'April',
                'Mai', 'Juni', 'Juli', 'August', 'September',
                'Oktober', 'November', 'Dezember'],
                'shortMonths': ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai',
                'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            }).format;
        } else {
            throw new Error('Unsupported locale.');
        }
    };

    const guid = function() {
        return randomString() + randomString() + '-' + randomString()
        + '-' + randomString() + '-' + randomString() + '-'
        + randomString() + randomString() + randomString();
    };

    const websafeGuid = function() {
        return 'd3wb-' + guid();
    };

    const makeUnselectable = function() {
        return function(selection) {
            selection.each(function(data, i, nodes) {
                d3.select(nodes[i])
                    .style('user-select', 'none')
                    .style('-moz-user-select', 'none')
                    .style('-webkit-user-select', 'none')
                    .style('-ms-user-select', 'none')
                    .style('pointer-style', 'none');
            });
        };
    };

    const smoothData = function(data, xSel, ySel, window) {
        let windowArr = [];
        let winAggs = [];
        // for each window create an aggregated value
        data.forEach(function(value, index) {
            let innerIdx = index + 1;
            windowArr.push(value[ySel]);
            if (innerIdx % window == 0 || innerIdx == data.length) {
                let winAgg = d3.median(windowArr);
                winAggs.push(winAgg);
                windowArr = [];
            };
        });
        // recreate original array size
        let smoothData = [];
        let covered = 0;
        let finalPt = 0;
        for (let i in winAggs) {
            if (!Object.prototype.hasOwnProperty.call(winAggs, i)) {
                continue;
            }
            covered += window;
            let winLen = covered > data.length ? data.length % window : window;
            let left = i == 0 ? data[0][ySel] : winAggs[i - 1];
            let right = winAggs[i];
            let ip = d3.interpolate(left, right);
            let shift = 1.0 / winLen;
            let curr = 0;
            for (let j = 0; j < winLen; j++) {
                curr += shift;
                let set = {};
                set[xSel] = data[finalPt][xSel];
                set[ySel] = ip(curr);
                smoothData.push(set);
                finalPt += 1;
            }
        }
        return smoothData;
    };

    const countCsvColumn = function(data, column, sort, ignore) {
        sort = sort === undefined ? true : sort;
        let nestedData = d3.nest()
            .key(function(d) {
                return d[column];
            })
            .entries(data);
        if (ignore !== undefined && ignore.length > 0) {
            nestedData = nestedData.filter(function(d) {
                return !ignore.includes(d.key);
            });
        }
        let countData = [];
        for (let i = 0; i < nestedData.length; i++) {
            let subObj = {
                'label': nestedData[i].key,
                'count': +nestedData[i].values.length,
            };
            countData.push(subObj);
        }
        let sum = d3.sum(countData, function(d) {
            return +d.count;
        });
        countData.forEach(function(d) {
            d.percent = (+d.count / sum) * 100;
        });
        if (sort) {
            countData.sort(function(a, b) {
                return b.percent - a.percent;
            });
        }
        return countData;
    };


    const injectCSS = function(css) {
        let head = document.getElementsByTagName('head')[0];
        let s = document.createElement('style');
        if (s.styleSheet) { // IE
            s.styleSheet.cssText = css;
        } else { // the world
            s.appendChild(document.createTextNode(css));
        }
        head.appendChild(s);
    };


    const logSVGSize = function(selection) {
        let b = selection.ownerSVGElement.getBBox();
        console.log(b.x + ' x ' + b.y + ' | ' + b.width + ' x ' + b.height);
    };

    /**
     * A method to convert a JSON object holding K/V-pairs like..
     *
     * {
     *      "object_1": {
     *          "key1": "value1",
     *          "key2": "value2"
     *      },
     *     "object_2": { .. }
     * }
     *
     * to a parsed CSV object like...
     *
     * key, key1, key2
     * object_1, value1, value2
     * object_2, ..
     *
     * Method assumes that each object has same attributes.
     * @param {Object} json Input json data
     * @return {Array} Converted csv data
     */
    const jsonAttributeMapToCSV = function(json) {
        // create header
        let header = ['key'];
        let jsonMap = json[Object.keys(json)[0]];
        for (let objKey in jsonMap) {
            if (Object.prototype.hasOwnProperty.call(jsonMap, objKey)) {
                header.push(objKey); // add all object keys of first object
            }
        };
        // create csv output
        let csv = ['"' + header.join('","') + '"'];
        for (let key in json) {
            if (!Object.prototype.hasOwnProperty.call(json, key)) {
                continue;
            }
            let csvRow = [key];
            for (let h in header) {
                if (h == 0) {
                    continue;
                }
                let selector = header[h];
                csvRow.push(json[key][selector]);
            }
            csv.push('"' + csvRow.join('","') + '"');
        }
        // parse CSV string to d3-like CSV object
        let csvString = csv.join('\n');
        let csvResult = d3.csvParse(csvString);
        // fin.
        return csvResult;
    };

    const getBoundingBoxCenter = function(selection) {
        // get the DOM element from a D3 selection
        // you could also use "this" inside .each()
        let element = d3.select(selection).node();
        // use the native SVG interface to get the bounding box
        let bbox = element.getBBox();
        // return the center of the bounding box
        return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
    };

    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    d3wb.util = {
        setLocale: setLocale,
        changeCSVSeparator: changeCSVSeparator,
        smoothData: smoothData,
        countCsvColumn: countCsvColumn,
        guid: guid,
        websafeGuid: websafeGuid,
        injectCSS: injectCSS,
        logSVGSize: logSVGSize,
        jsonAttributeMapToCSV: jsonAttributeMapToCSV,
        getBoundingBoxCenter: getBoundingBoxCenter,
        makeUnselectable: makeUnselectable,
    };

    /* *********************************************************************
     * PRIVATE FUNCTIONS
     * ********************************************************************* */

    let randomString = function() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };
})));

/**
 * d3-workbench (d3wb) 'theme' extension module.
 *
 * A module to simplify working with user-defined color sets/themes.
 *
 * @author BastiTee
 */
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ?
        factory(exports) : typeof define === 'function' &&
        define.amd ? define(['exports'], factory) :
        (factory((global.d3wb.theme = global.d3wb.theme || {})));
}(this, (function(exports) {
    'use strict';

    let currentTheme = 'light';

    let themes = {
        dark: {
            background: '#1D1F21',
            black: '#282A2E',
            blue: '#5F819D',
            cyan: '#5E8D87',
            foreground: '#C5C8C6',
            green: '#8C9440',
            magenta: '#85678F',
            red: '#A54242',
            white: '#707880',
            yellow: '#DE935F',
        },
        eqie6: {
            background: '#111111',
            black: '#222222',
            blue: '#66A9B9',
            cyan: '#6D878D',
            foreground: '#CCCCCC',
            green: '#B7CE42',
            magenta: '#B7416E',
            red: '#E84F4F',
            white: '#CCCCCC',
            yellow: '#FEA63C',
        },
        google: {
            background: '#FFFFFF',
            black: '#1D1F21',
            blue: '#3971ED',
            cyan: '#3971ED',
            foreground: '#373B41',
            green: '#198844',
            magenta: '#A36AC7',
            red: '#CC342B',
            white: '#C5C8C6',
            yellow: '#FBA922',
        },
        gotham: {
            background: '#0A0F14',
            black: '#0A0F14',
            blue: '#195465',
            cyan: '#33859D',
            foreground: '#98D1CE',
            green: '#26A98B',
            magenta: '#4E5165',
            red: '#C33027',
            white: '#98D1CE',
            yellow: '#EDB54B',
        },
        light: {
            background: '#FFFFFF',
            black: '#000000',
            blue: '#87AFDF',
            cyan: '#AFDFDF',
            foreground: '#1A1D1D',
            green: '#AFD787',
            magenta: '#DFAFDF',
            red: '#D78787',
            white: '#FFFFFF',
            yellow: '#FFFFAF',
        },
        monokai: {
            background: '#272822',
            black: '#272822',
            blue: '#66D9EF',
            cyan: '#A1EFE4',
            foreground: '#F8F8F2',
            green: '#A6E22E',
            magenta: '#AE81FF',
            red: '#F92672',
            white: '#F8F8F2',
            yellow: '#F4BF75',
        },
        ocean: {
            background: '#2B303B',
            black: '#2B303B',
            blue: '#8FA1B3',
            cyan: '#96B5B4',
            foreground: '#C0C5CE',
            green: '#A3BE8C',
            magenta: '#B48EAD',
            red: '#BF616A',
            white: '#C0C5CE',
            yellow: '#EBCB8B',
        },
        sweetlove: {
            background: '#1F1F1F',
            black: '#4A3637',
            blue: '#535C5C',
            cyan: '#6D715E',
            foreground: '#C0B18B',
            green: '#7B8748',
            magenta: '#775759',
            red: '#D17B49',
            white: '#C0B18B',
            yellow: '#AF865A',
        },
        tomorrowlight: {
            background: '#FFFFFF',
            black: '#1D1F21',
            blue: '#81A2BE',
            cyan: '#8ABEB7',
            foreground: '#373B41',
            green: '#B5BD68',
            magenta: '#B294BB',
            red: '#CC6666',
            white: '#C5C8C6',
            yellow: '#F0C674',
        },
        yousay: {
            background: '#F5E7DE',
            black: '#666661',
            blue: '#4C7399',
            cyan: '#D97742',
            foreground: '#34302D',
            green: '#4C3226',
            magenta: '#BF9986',
            red: '#992E2E',
            white: '#34302D',
            yellow: '#A67C53',
        },
    };

    /* *********************************************************************
     * PUBLIC FUNCTIONS
     * ********************************************************************* */

    let array = function(arr) {
        let newArr = [];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].startsWith('#')) {
                newArr.push('' + d3.rgb(arr[i]));
            } else {
                newArr.push('' + d3wb.color(arr[i]));
            }
        }
        return newArr;
    };

    let category = function() {
        let colors = ['blue', 'red', 'green', 'magenta', 'foreground'];
        let category = [];
        for (let i = 0; i < colors.length; i++) {
            let subCat = d3wb.color.lohiScaleArray(colors[i], 5, [0.6, 0.6]);
            category = category.concat(subCat);
        }
        return category;
    };

    let categoryMain = function() {
        let colors = [
            'blue', 'cyan', 'green', 'magenta', 'red', 'yellow', 'foreground',
        ];
        let category = [];
        for (let i = 0; i < colors.length; i++) {
            category.push(castColor(colors[i]));
        }
        return category;
    };

    let interpolateToArray = function(ipol, length, loHiBound) {
        loHiBound = loHiBound || [0.0, 1.0];
        if (length <= 2) {
            return [ipol(0), ipol(1)];
        }
        let step = (loHiBound[1] - loHiBound[0]) / (length);
        let pt = loHiBound[0] + step;
        let arr = [];
        arr.push(ipol(loHiBound[0]));
        do {
            arr.push(ipol(pt));
            pt += step;
        } while (pt < loHiBound[1] - step - 0.0001);
        arr.push(ipol(loHiBound[1]));
        return arr;
    };

    let gradientArray = function(color1, color2, length, loHiBound) {
        color1 = castColor(color1);
        color2 = castColor(color2);
        let ipl = d3.interpolateRgb(color1, color2);
        return interpolateToArray(ipl, length, loHiBound);
    };

    let lohiScaleArray = function(color, length, limits) {
        limits = limits || [0.4, 0.7];
        let even = length % 2 == 0;
        let substeps = even ? length / 2 : (length + 1) / 2;
        let loAr = gradientArray('black', color, even ?
            substeps + 1 : substeps, [limits[0], 1.0]);
        let hiAr = gradientArray(color, 'white',
            substeps, [0.0, limits[1]]);
        let res = loAr.concat(hiAr.slice(1));
        // console.log(length + " = " + (even ? substeps + 1 : substeps) +
        // " + " + substeps + " >> " + res.length );
        return res;
    };

    let ordinal = function() {
        return d3.scaleOrdinal(d3wb.color.category());
    };

    let smallOrdinal = function() {
        let smallCategory = [];
        for (let i = 2; i < 25; i += 5) {
            smallCategory.push(d3wb.color.category()[i]);
        }
        return d3.scaleOrdinal(smallCategory);
    };

    let linearGradient = function(minMax, fromTo) {
        fromTo = fromTo || [d3wb.color.white, d3wb.color.black];
        return d3.scaleLinear().domain(minMax)
            .interpolate(d3.interpolate)
            .range(fromTo);
    };

    let quantile = function(minMax, colors) {
        return d3.scaleQuantile()
            .domain(minMax).range(colors);
    };

    /* *********************************************************************
     * PRIVATE FUNCTIONS
     * ********************************************************************* */

    let extendColor = function(colorObj, colorName) {
        colorObj.name = colorName;
        colorObj.fade = function(pct) {
            let lohi = lohiScaleArray(colorObj.name, 100);
            return lohi[pct];
        };
        return colorObj;
    };

    let castColor = function(color) {
        let label = color;
        if (typeof color === 'string' && !color.startsWith('rgb')) {
            color = d3.rgb(d3wb.color[color]);
            color = extendColor(color, label);
        }
        return color;
    };

    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    // sets up theme function that invokes d3wb.color object as well
    d3wb.theme = function(theme) {
        if (!arguments.length) {
            let keys = Object.keys(d3wb.color);
            let colors = [];
            for (let i in keys) {
                if (typeof d3wb.color[keys[i]] !== 'function') {
                    colors.push(d3wb.color[keys[i]].name);
                }
            }
            return colors;
        }
        currentTheme = theme;
        // console.log("changed theme to '" + theme + "'");
        let newTheme = themes[theme];
        // setup color object with public methods
        let color = {
            lohiScaleArray: lohiScaleArray,
            array: array,
            gradientArray: gradientArray,
            category: category,
            categoryMain: categoryMain,
            quantile: quantile,
            linearGradient: linearGradient,
            ordinal: ordinal,
            smallOrdinal: smallOrdinal,
        };
        // add directy accessible colors
        for (let key in newTheme) {
            if (Object.prototype.hasOwnProperty.call(newTheme, key)) {
                color[key] = d3.rgb(newTheme[key]);
                color[key] = extendColor(color[key], key);
            }
        }
        // add a theme list
        d3wb.themes = [];
        for (let key in themes) {
            if (Object.prototype.hasOwnProperty.call(themes, key)) {
                d3wb.themes.push(key);
            }
        };
        // make public
        d3wb.color = color;
    };

    d3wb.theme.add = function(name, colors) {
        // add to internal data structure
        themes[name] = colors;
        // remind the current theme
        let curTheme = currentTheme;
        // invoke custom theme so that all data structures are created
        d3wb.theme(name);
        // reset the current theme
        d3wb.theme(curTheme);
    };

    d3wb.theme(currentTheme); // sets default theme
})));

/**
 * d3-workbench (d3wb) 'mouse' extension module.
 *
 * A collection of mouse handlers such as tooltips or click-events
 * to allow for mouse-based interactivity.
 *
 * @author BastiTee
 */
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ?
        factory(exports) : typeof define === 'function' &&
        define.amd ? define(['exports'], factory) :
        (factory((global.d3wb.mouse = global.d3wb.mouse || {})));
}(this, (function(exports) {
    'use strict';

    /* *********************************************************************
     * PUBLIC FUNCTIONS
     * ********************************************************************* */

    const tooltip = function() {
        'use strict';

        let opacity = 0.8;
        let padding = 5;
        let color = 'white';
        let fill = 'black';
        let lineHeight = 20;
        let roundCorners = 5;
        let selector = function() {
            return new Date().toDateString() + '\n' +
                String(Math.floor(Math.random() * 9e8));
        };

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i]);
                let root = nodes[i].ownerSVGElement;
                let dim = root.getBBox();
                let active = false;
                let gTooltip;
                let rect;
                let text;

                let mousemove = function() {
                    let pos = d3.mouse(root);
                    let txtBox = rect.node().getBBox();
                    let newx = pos[0];
                    let newy = pos[1] - txtBox.height;
                    // STOP ON BORDERS
                    // left side
                    newx = newx - (txtBox.width / 2) < 0 ?
                        txtBox.width / 2 : newx;
                    // right side
                    newx = newx + (txtBox.width / 2) > dim.width ?
                        dim.width - (txtBox.width / 2) : newx;
                    // top side
                    newy = newy - padding < 0 ? padding : newy;
                    // bottom side
                    newy = newy + txtBox.height - padding > dim.height ?
                        dim.height - txtBox.height + padding : newy;
                    // move
                    gTooltip.attr('transform', 'translate(' +
                        newx + ',' + newy + ')');
                };

                let mouseout = function() {
                    if (!active) {
                        return;
                    }
                    active = false;
                    gTooltip.remove();
                };

                let mouseover = function(d) {
                    if (active) {
                        return;
                    }
                    active = true;
                    gTooltip = d3.select(root).append('g')
                        .style('pointer-events', 'none')
                        .style('user-select', 'none')
                        .style('-moz-user-select', 'none');
                    rect = gTooltip.append('rect');
                    text = gTooltip.append('text');
                    // append tooltip text
                    let string = '' + selector(d);
                    let split = string.split('\n');
                    for (let i in split) {
                        if (!Object.prototype.hasOwnProperty.call(split, i)) {
                            continue;
                        }
                        text.append('tspan')
                            .style('text-anchor', 'middle')
                            .style('dominant-baseline', 'hanging')
                            .style('fill', color)
                            .attr('x', 0)
                            .attr('dy', function() {
                                return i == 0 ? 0 : lineHeight;
                            })
                            .text(split[i]);
                    }
                    // append background rectangle depending on text size
                    let txtBox = text.node().getBBox();
                    rect
                        .attr('rx', roundCorners).attr('ry', roundCorners)
                        .attr('width', txtBox.width + padding * 2)
                        .attr('height', txtBox.height + padding * 2)
                        .attr('x', -(txtBox.width / 2) - padding)
                        .attr('y', -padding)
                        .attr('opacity', opacity)
                        .style('fill', fill);
                };

                s.on('mouseover', mouseover);
                s.on('mouseout', mouseout);
                s.on('mousemove', mousemove);
            });
        };

        chart.opacity = function(value) {
            if (!arguments.length) return opacity;
            opacity = value;
            return chart;
        };

        chart.padding = function(value) {
            if (!arguments.length) return padding;
            padding = value;
            return chart;
        };

        chart.color = function(value) {
            if (!arguments.length) return color;
            color = value;
            return chart;
        };

        chart.fill = function(value) {
            if (!arguments.length) return fill;
            fill = value;
            return chart;
        };

        chart.lineHeight = function(value) {
            if (!arguments.length) return lineHeight;
            lineHeight = value;
            return chart;
        };

        chart.roundCorners = function(value) {
            if (!arguments.length) return roundCorners;
            roundCorners = value;
            return chart;
        };

        chart.selector = function(value) {
            if (!arguments.length) return selector;
            selector = value;
            return chart;
        };

        return chart;
    };

    let click = function() {
        // ------------------------------------
        const defaultEvent = 'dblclick';
        const defaultAction = 'open';
        const supportedEvents = [defaultEvent];
        const supportedActions = [defaultAction];
        // ------------------------------------

        let event = defaultEvent;
        let action = defaultAction;
        let openTarget = function(d, i) {
            return 'https://d3js.org/';
        };

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i]);
                evaluateEventOpen(action, event, s);
            });
        };

        let evaluateEventOpen = function(action, event, s) {
            if (action != 'open') {
                return;
            }
            s.on(event, function(d, i) {
                let trg = openTarget(d, i);
                window.open(trg, '_blank');
            });
        };

        chart.event = function(value) {
            if (!arguments.length) return event;
            if (!supportedEvents.includes(value)) {
                throw new Error('Event \'' + value +
                 '\' not supported! Allowed: ' + supportedEvents);
            }
            event = value;
            return chart;
        };

        chart.action = function(value) {
            if (!arguments.length) return action;
            if (!supportedActions.includes(value)) {
                throw new Error('Action \'' + value +
                 '\' not supported! Allowed: ' + supportedActions);
            }
            action = value;
            return chart;
        };

        chart.openTarget = function(value) {
            if (!arguments.length) return openTarget;
            openTarget = value;
            return chart;
        };

        return chart;
    };


    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    d3wb.mouse = {
        tooltip: tooltip,
        click: click,
    };
})));

/**
 * d3-workbench (d3wb) 'add' extension module.
 *
 * A collection of functions to create recurring figure elements such as
 * x/y-axis, titles etc. with minimal boilerplate code.
 *
 * @author BastiTee
 */
(function(global, factory) {
    if (global.d3wb.util === undefined) {
        throw new Error('d3wb.util required but not loaded.');
    }
    typeof exports === 'object' && typeof module !== 'undefined' ?
        factory(exports) : typeof define === 'function' &&
        define.amd ? define(['exports'], factory) :
        (factory((global.d3wb.add = global.d3wb.add || {})));
}(this, (function(exports) {
    'use strict';

    /* *********************************************************************
     * PUBLIC FUNCTIONS
     * ********************************************************************* */

    let xAxis = function(scale) {
        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i]);
                let d3a = c.type(scale);
                appendTickStyle(d3a, c);
                let axis = s.append('g')
                    .attr('transform', 'translate(' + c.x + ',' +
                        c.y + ')')
                    .attr('class', 'wb-axis wb-axis-x')
                    .call(d3wb.util.makeUnselectable());
                injectAxisColor(c.color, 'wb-axis-x');
                c.update = function() {
                    axis.call(d3a);
                };
                c.update();
                if (rotation == 90) {
                    axis.selectAll('text')
                        .attr('y', -2)
                        .attr('x', -9)
                        .attr('dy', '.35em')
                        .style('text-anchor', 'end')
                        .attr('transform', 'rotate(-90)');
                }
            });
        };

        let rotation = undefined;
        chart.rotation = function(value) {
            if (!arguments.length) return rotation;
            rotation = value;
            return chart;
        };

        let c = commonAxisElements(chart, d3.axisTop);
        return chart;
    };

    let xAxisBottom = function(scale) {
        return xAxis(scale).type(d3.axisBottom);
    };

    let yAxis = function(scale) {
        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i]);
                let d3a = c.type(scale);
                appendTickStyle(d3a, c);
                injectAxisColor(c.color, 'wb-axis-y');
                let axis = s.append('g')
                    .attr('class', 'wb-axis wb-axis-y')
                    .attr('transform', 'translate(' + c.x + ',' + c.y + ')')
                    .call(d3wb.util.makeUnselectable());
                c.update = function() {
                    axis.call(d3a);
                };
                c.update();
            });
        };

        let c = commonAxisElements(chart, d3.axisLeft);
        return chart;
    };

    let yAxisRight = function(scale) {
        return yAxis(scale).type(d3.axisRight);
    };

    let title = function(text) {
        let color = 'red';
        let fontSize = '140%';

        let update = function() {};

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i].ownerSVGElement);
                let root = s.node().getBBox();
                s.append('text')
                    .attr('class', 'wb-title')
                    .attr('x', root.width / 2)
                    .attr('y', 5)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'hanging')
                    .call(d3wb.util.makeUnselectable()).style('fill', color)
                    .style('font-size', fontSize);

                update = function() {
                    s.selectAll('.wb-title').text(text);
                };
                update();
            });
        };

        chart.color = function(value) {
            if (!arguments.length) return color;
            color = value;
            return chart;
        };

        chart.fontSize = function(value) {
            if (!arguments.length) return fontSize;
            fontSize = value;
            return chart;
        };

        chart.text = function(value) {
            if (!arguments.length) return text;
            text = value;
            return chart;
        };

        chart.update = function() {
            update();
        };

        return chart;
    };

    let xAxisLabel = function(text) {
        let color = 'red';
        let padding = 15;
        let orientation = 'top';

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i].ownerSVGElement);
                let root = s.node().getBBox();
                s.append('text') // text label for the x axis
                    .attr('transform', function() {
                        let t = 'translate(' + (root.width / 2) + ',';
                        if (orientation == 'top') {
                            t += padding;
                        } else {
                            t += root.height - padding;
                        };
                        t += ')';
                        return t;
                    })
                    .style('text-anchor', 'middle')
                    .style('fill', color)
                    .call(d3wb.util.makeUnselectable())
                    .attr('dominant-baseline', function() {
                        if (orientation == 'top') {
                            return 'hanging';
                        } else {
                            return 'auto';
                        };
                    })
                    .text(text);
            });
        };

        chart.color = function(value) {
            if (!arguments.length) return color;
            color = value;
            return chart;
        };

        chart.orientation = function(value) {
            if (!arguments.length) return orientation;
            orientation = value;
            return chart;
        };
        return chart;
    };

    let yAxisLabel = function(text) {
        let color = 'red';
        let padding = 5;
        let orientation = 'left';

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i].ownerSVGElement);
                let root = s.node().getBBox();
                s.append('text') // text label for the x axis
                    .attr('transform', function() {
                        let t = 'translate(';
                        if (orientation == 'left') {
                            t += padding;
                        } else {
                            t += root.width - padding;
                        };
                        t += ',' + root.height / 2 + ') rotate(';
                        if (orientation == 'left') {
                            t += '-90';
                        } else {
                            t += '90';
                        };
                        t += ')';
                        return t;
                    })
                    .style('text-anchor', 'middle')
                    .attr('dominant-baseline', 'hanging')
                    .style('fill', color)
                    .call(d3wb.util.makeUnselectable())
                    .text(text);
            });
        };

        chart.color = function(value) {
            if (!arguments.length) return color;
            color = value;
            return chart;
        };

        chart.orientation = function(value) {
            if (!arguments.length) return orientation;
            orientation = value;
            return chart;
        };
        return chart;
    };

    let shadow = function() {
        let blur = 3;
        let xOffset = 2;
        let yOffset = 1;
        let opacity = 0.4;
        let id = d3wb.util.guid();

        let chart = function(selection) {
            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);
                let svg = d3.select(nodes[i].ownerSVGElement);
                let defs = svg.append('defs');
                let filter = defs.append('filter')
                    .attr('id', id);
                filter.append('feGaussianBlur')
                    .attr('in', 'SourceAlpha')
                    .attr('stdDeviation', blur)
                    .attr('result', 'blur');
                filter.append('feOffset')
                    .attr('in', 'blur')
                    .attr('dx', xOffset)
                    .attr('dy', yOffset)
                    .attr('result', 'offsetBlur');
                filter.append('feComponentTransfer')
                    .append('feFuncA')
                    .attr('type', 'linear')
                    .attr('slope', opacity);
                let feMerge = filter.append('feMerge');
                feMerge.append('feMergeNode')
                    .attr('in", "offsetBlur');
                feMerge.append('feMergeNode')
                    .attr('in', 'SourceGraphic');

                s.style('filter', 'url(#' + id + ')');
            });
        };
        return chart;
    };

    let legend = function() {
        let color = 'white';
        let stroke;
        let colors = ['red', 'green', 'blue'];
        let text = ['Item 1', 'Item 2', 'Item 3'];
        let x = 0;
        let y = 0;
        let symbol = d3.symbolCircle;
        let symbolSize = 100;

        let chart = function(selection) {
            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);
                s.append('g')
                    .attr('class', 'legend')
                    .attr('transform', 'translate(' + x + ',' + y + ')');
                let ordinal = d3.scaleOrdinal()
                    .domain(text.map(function(d) {
                        return d;
                    }))
                    .range(text.map(function(d, i) {
                        return colors[i];
                    }));
                let legend = d3.legendColor()
                    .shape('path',
                        d3.symbol().type(symbol).size(symbolSize)())
                    .scale(ordinal);
                s.select('.legend')
                    .call(legend)
                    .style('fill', color)
                    .style('font-size', '90%');
                if (stroke) {
                    s.selectAll('path.swatch').style('stroke', stroke);
                }
            });
        };

        chart.stroke = function(value) {
            if (!arguments.length) return stroke;
            stroke = value;
            return chart;
        };

        chart.x = function(value) {
            if (!arguments.length) return x;
            x = value;
            return chart;
        };

        chart.y = function(value) {
            if (!arguments.length) return y;
            y = value;
            return chart;
        };

        chart.text = function(value) {
            if (!arguments.length) return text;
            text = value;
            return chart;
        };

        chart.colors = function(value) {
            if (!arguments.length) return colors;
            colors = value;
            return chart;
        };

        chart.color = function(value) {
            if (!arguments.length) return color;
            color = value;
            return chart;
        };

        chart.symbol = function(value) {
            if (!arguments.length) return symbol;
            symbol = value;
            return chart;
        };

        chart.symbolSize = function(value) {
            if (!arguments.length) return symbolSize;
            symbolSize = value;
            return chart;
        };

        return chart;
    };

    let textBox = function(text) {
        let x = 0;
        let y = 0;
        let width = 500;
        let height = 400;
        let fill = 'white';
        let backgroundColor = 'blue';
        let padding = 0;
        let borderRadius = 0;
        let adjustBackgroundHeight = false;

        let debug = false;

        // internal
        let REF_FONTSIZE = 20;

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i]);

                data = []; // convert to objects
                // remove multiple linebreaks
                text = text.replace(/\n+/, '\n');
                text.split('\n').forEach(function(d) {
                    data.push({
                        'text': d.trim(),
                    });
                });

                // base group for text box
                let g = s.append('g')
                    .attr('class', 'wb-textbox')
                    .attr('transform', 'translate(' + x + ',' + y + ')');

                // background color
                let bg = g.append('rect')
                    .attr('x', -padding)
                    .attr('y', -padding)
                    .attr('width', width + padding * 2)
                    .attr('height', height + padding * 2)
                    .attr('rx', borderRadius)
                    .attr('ry', borderRadius)
                    .attr('fill', backgroundColor);

                // draw and autoscale text
                let totalHeight = 0;
                g.selectAll('.wb-textbox-line')
                    .data(data)
                    .enter()
                    .append('text')
                    .attr('class', 'wb-textbox-line')
                    .attr('text-anchor', 'left')
                    .attr('dominant-baseline', 'hanging')
                    .attr('fill', fill)
                    .style('font-size', REF_FONTSIZE + 'px')
                    .text(function(d) {
                        return d.text;
                    })
                    .style('font-size', function(d, i, nodes) {
                        return calculateNewFontsize(nodes[i], width) + 'px';
                    })
                    .each(function(d, i, nodes) {
                        d.numberBox = nodes[i].getBBox();
                        totalHeight += d.numberBox.height;
                    })
                    .call(d3wb.util.makeUnselectable());

                let totalShift = data.legend == 1 ? 0 :
                    (height - totalHeight) / (data.length - 1);
                totalShift = totalShift > 0 ? 0 : totalShift;

                // relocate lines according to bounding box
                g.selectAll('.wb-textbox-line')
                    .each(function(d, i, nodes) {
                        // center line inside box
                        d3.select(nodes[i])
                            .attr('x', function(d) {
                                // centering
                                let corr = width - nodes[i].getBBox().width;
                                return Math.floor(corr / 2);
                            });
                        d3.select(nodes[i])
                            .attr('y', function(d) {
                                let y = 0;
                                if (i == 0) {
                                    return y;
                                }
                                // line over line
                                for (let j = i - 1; j >= 0; j--) {
                                    y = y + nodes[j].getBBox().height +
                                        totalShift;
                                }
                                return y;
                            });
                        d.numberBox = nodes[i].getBBox();
                    });

                if (adjustBackgroundHeight) {
                    bg.attr('height', totalHeight +
                        padding * 2 + totalShift * (data.length - 1));
                }

                drawDebugFrames(s, data, g);
            });
        };

        let calculateNewFontsize = function(thiss, width) {
            let textLength = thiss.getComputedTextLength();
            return width / textLength * REF_FONTSIZE;
        };

        let drawDebugFrames = function(s, data, g) {
            if (!debug) return;

            d3.selectAll('.wb-textbox-debug').remove();
            g.append('g').attr('class', 'wb-textbox-debug')
                .selectAll('.wb-textbox-line-debug')
                .data(data)
                .enter()
                .append('rect')
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
                .style('stroke', 'yellow')
                .style('stroke-width', 1)
                .style('fill', 'none');

            g.append('circle')
                .attr('r', 4)
                .style('fill', 'yellow');
        };

        chart.x = function(value) {
            if (!arguments.length) return x;
            x = value;
            return chart;
        };

        chart.y = function(value) {
            if (!arguments.length) return y;
            y = value;
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

        chart.fill = function(value) {
            if (!arguments.length) return fill;
            fill = value;
            return chart;
        };

        chart.backgroundColor = function(value) {
            if (!arguments.length) return backgroundColor;
            backgroundColor = value;
            return chart;
        };

        chart.padding = function(value) {
            if (!arguments.length) return padding;
            padding = value;
            return chart;
        };

        chart.borderRadius = function(value) {
            if (!arguments.length) return borderRadius;
            borderRadius = value;
            return chart;
        };

        chart.adjustBackgroundHeight = function(value) {
            if (!arguments.length) return adjustBackgroundHeight;
            adjustBackgroundHeight = value;
            return chart;
        };

        return chart;
    };


    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    d3wb.add = {
        xAxis: xAxis,
        xAxisBottom: xAxisBottom,
        xAxisLabel: xAxisLabel,
        yAxis: yAxis,
        yAxisRight: yAxisRight,
        yAxisLabel: yAxisLabel,
        title: title,
        shadow: shadow,
        legend: legend,
        textBox: textBox,
    };

    /* *********************************************************************
     * PRIVATE FUNCTIONS
     * ********************************************************************* */

    let injectAxisColor = function(color, cclass) {
        d3wb.util.injectCSS(`
            .` + cclass + ` line{
              stroke: ` + color + `;
            }
            .` + cclass + ` path{
              stroke: ` + color + `;
            }
            .` + cclass + ` text{
              fill: ` + color + `;
            }
            `);
    };

    let commonAxisElements = function(chart, defaultType) {
        let c = {};

        c.x = 0;
        chart.x = function(value) {
            if (!arguments.length) return x;
            c.x = value;
            return chart;
        };

        c.y = 0;
        chart.y = function(value) {
            if (!arguments.length) return y;
            c.y = value;
            return chart;
        };

        c.type = defaultType;
        chart.type = function(value) {
            if (!arguments.length) return type;
            c.type = value;
            return chart;
        };

        c.ticks;
        chart.ticks = function(value) {
            if (!arguments.length) return ticks;
            c.ticks = value;
            return chart;
        };

        c.tickFormat;
        chart.tickFormat = function(value) {
            if (!arguments.length) return tickFormat;
            c.tickFormat = value;
            return chart;
        };

        c.color = 'red';
        chart.color = function(value) {
            if (!arguments.length) return color;
            c.color = value;
            return chart;
        };

        c.update = function() {};
        chart.update = function(scale) {
            c.update(scale);
        };

        chart.fontSize = function(value) {
            d3wb.util.injectCSS(`
                .wb-axis-x text {
                  font-size: ` + value + `;
              }`);
            return chart;
        };

        chart.truncate = function(value) {
            chart.tickFormat(function(d) {
                if (d.length > value) {
                    return d.substring(0, value) + '…';
                } else {
                    return d;
                }
            });
            return chart;
        };

        return c;
    };

    let appendTickStyle = function(d3a, c) {
        if (c.ticks) {
            d3a.ticks(c.ticks);
        }
        if (c.tickFormat) {
            d3a.tickFormat(c.tickFormat);
        }
    };
})));

/**
 * d3-workbench (d3wb) 'html' extension module.
 *
 * A collection of reusable HTML elements to extend visualizations
 * with interactive elements such as dropdowns, buttons or text fields.
 *
 * @author BastiTee
 */
(function(global, factory) {
    if (global.d3wb.util === undefined) {
        throw new Error('d3wb.util required but not loaded.');
    }
    typeof exports === 'object' && typeof module !== 'undefined' ?
        factory(exports) : typeof define === 'function' &&
        define.amd ? define(['exports'], factory) :
        (factory((global.d3wb.html = global.d3wb.html || {})));
}(this, (function(exports) {
    'use strict';

    /* *********************************************************************
     * PUBLIC FUNCTIONS
     * ********************************************************************* */

    const dropdown = function() {
        let options = ['Option 1', 'Option 2', 'Option 3'];

        let chart = function(selection) {
            selection = resolve(selection);

            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);

                let callbackImpl = function() {
                    let value = d3.select('#' + c.id).property('value');
                    let index = options.indexOf(value);
                    c.callback(value, index);
                };

                let selectDistrict = s
                    .append('select')
                    .attr('id', c.id)
                    .on('change', callbackImpl);
                selectDistrict
                    .selectAll('option')
                    .data(options).enter()
                    .append('option')
                    .text(function(d) {
                        return d;
                    });
                d3wb.util.injectCSS(`
                        #` + c.id + ` {
                            position: absolute;
                            -webkit-appearance: none;
                            -moz-appearance: none;
                            appearance: none;
                        }
                    `);
                callbackImpl();
            });
        };

        let c = commonElements(chart);

        chart.options = function(value) {
            if (!arguments.length) return options;
            options = value;
            return chart;
        };

        return chart;
    };

    const button = function() {
        let options = ['Click me'];
        let index = 0;
        let buttonEl;

        let chart = function(selection) {
            selection = resolve(selection);

            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);

                let callbackImpl = function() {
                    let value = d3.select('#' + c.id).text();
                    let idx = options.indexOf(value);
                    index = (index + 1) % (options.length);
                    c.callback(value, idx);
                    buttonEl.text(options[index]);
                };

                buttonEl = s
                    .append('button')
                    .attr('id', c.id)
                    .style('user-select', 'none')
                    .style('-moz-user-select', 'none')
                    .text(options[index])
                    .on('click', callbackImpl);

                d3wb.util.injectCSS(`
                        #` + c.id + ` {
                            position: absolute;
                        }
                    `);
                if (c.callbackOnInit) {
                    callbackImpl();
                }
            });
        };

        let c = commonElements(chart);

        chart.options = function(value) {
            if (!arguments.length) return options;
            options = value;
            return chart;
        };

        return chart;
    };

    const textfield = function() {
        let chart = function(selection) {
            selection = resolve(selection);

            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);

                let callbackImpl = function(element) {
                    c.callback(element.value);
                };

                s
                    .append('input')
                    .attr('id', c.id)
                    .on('input', function(d, i, nodes) {
                        callbackImpl(nodes[i]);
                    });

                d3wb.util.injectCSS(`
                        #` + c.id + ` {
                            position: absolute;
                        }
                    `);
            });
        };

        let c = commonElements(chart);

        return chart;
    };

    const infoBox = function() {
        let controlColor = 'white';
        let controlColorHover = 'yellow';
        let controlFontSize = '150%';
        let infoColor = 'white';
        let infoBorderColor = infoColor;
        let infoFill = 'black';
        let infoFontSize = '100%';
        let infoOpacity = 0.9;
        let infoContent = `<b>Information</b></br>
        This box contains information about the graph. It's intended ` +
            `to guide the user. You can use <i>html-style</i> as desired.
        `;

        let open = false;

        let chart = function(selection) {
            selection = resolve(selection);

            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);

                let div = s.append('div')
                    .attr('id', c.id);

                let input = div
                    .append('p')
                    .attr('id', c.id + '-in')
                    .html('&#9432;');

                div.append('p')
                    .attr('id', c.id + '-ib')
                    .html(infoContent);

                input.on('click', function() {
                    open = !open;
                    let opac = open ? infoOpacity : 0.0;
                    d3wb.util.injectCSS(
                        '#' + c.id + '-ib { opacity: ' + opac + ';}');
                });

                d3wb.util.injectCSS(`
                    #` + c.id + ` {
                        position: absolute;
                        margin: 0;
                        padding: 0;
                        pointer-events:none;
                    }
                    #` + c.id + `-in {
                        position: relative;
                        text-align: left;
                        width: 0;
                        -webkit-touch-callout: none;
                        -webkit-user-select: none;
                        -khtml-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        user-select: none;
                        margin: 0;
                        padding: 0;
                        color: ` + controlColor + `;
                        font-size: ` + controlFontSize + `;
                        pointer-events: auto;
                    }
                    #` + c.id + `-in:hover {
                        cursor: default;
                        color: ` + controlColorHover + `;
                    }
                    #` + c.id + `-ib {
                        position: relative;
                        text-align: left;
                        -webkit-touch-callout: none;
                        -webkit-user-select: none;
                        -khtml-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        user-select: none;
                        margin: 0;
                        padding: 0.5em;
                        border-radius: 0.4em;
                        border: 1px solid ` + infoBorderColor + `;
                        color: ` + infoColor + `;
                        font-size: ` + infoFontSize + `;
                        background-color: ` + infoFill + `;
                        opacity: 0;
                    }
                `);
            });
        };

        let c = commonElements(chart);

        chart.controlColor = function(value) {
            if (!arguments.length) return controlColor;
            controlColor = value;
            return chart;
        };

        chart.controlColorHover = function(value) {
            if (!arguments.length) return controlColorHover;
            controlColorHover = value;
            return chart;
        };

        chart.controlHover = function(value) {
            if (!arguments.length) return controlHover;
            controlHover = value;
            return chart;
        };

        chart.infoColor = function(value) {
            if (!arguments.length) return infoColor;
            infoColor = value;
            return chart;
        };

        chart.infoFill = function(value) {
            if (!arguments.length) return infoFill;
            infoFill = value;
            return chart;
        };

        chart.infoContent = function(value) {
            if (!arguments.length) return infoContent;
            infoContent = value;
            return chart;
        };

        return chart;
    };

    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    d3wb.html = {
        dropdown: dropdown,
        button: button,
        textfield: textfield,
        infoBox: infoBox,
    };

    /* *********************************************************************
     * PRIVATE FUNCTIONS
     * ********************************************************************* */

    let resolve = function(selection) {
        // check for cv.div parameter. If available use it instead,
        // it means user using d3wb but called cv.call() instead of
        // cv.div.call()
        if (selection['div'] !== undefined) {
            return selection['div'];
        }
        return selection;
    };

    let commonElements = function(chart) {
        let c = {
            'id': d3wb.util.websafeGuid(),
            'div': d3.select('body'),
            'callback': function() {
                console.log('callback.');
            },
            'callbackOnInit': false,
        };

        chart.id = function(value) {
            if (!arguments.length) return '#' + c.id;
            id = value;
            return chart;
        };

        chart.style = function(key, value) {
            // convert to string and check for 'px' suffix
            value = String(value);
            if (!isNaN(value) && !value.endsWith('px')) {
                value = value + 'px';
            }
            d3wb.util.injectCSS(`
                #` + c.id + ` {
                    ` + key + `: ` + value + `;
                }
            `);
            return chart;
        };

        chart.callback = function(value) {
            if (!arguments.length) return c.callback;
            c.callback = value;
            return chart;
        };

        return c;
    };
})));
