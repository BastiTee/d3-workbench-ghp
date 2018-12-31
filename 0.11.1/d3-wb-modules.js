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
                    'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
                ],
                'shortDays': ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
                'months': ['Januar', 'Februar', 'März', 'April',
                    'Mai', 'Juni', 'Juli', 'August', 'September',
                    'Oktober', 'November', 'Dezember',
                ],
                'shortMonths': ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai',
                    'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
                ],
            }).format;
        } else {
            throw new Error('Unsupported locale.');
        }
    };

    const randomString = function() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    const websafeGuid = function() {
        return d3wb.prefix(randomString() + randomString() + '-' +
            randomString() + '-' + randomString() + '-' + randomString() +
            '-' + randomString() + randomString() + randomString());
    };

    const websafeShortGuid = function() {
        return d3wb.prefix(randomString() + randomString());
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

    const autocastNumericColumns = function(data) {
        if (data === undefined) {
            throw Error('Provided dataset is undefined.');
        }
        if (!data.columns) {
            throw Error('Dataset for auto-casting does not contain a ' +
                'columns attribute, i.e., doesn\'t seem to be an d3-like ' +
                'array of objects.');
        }
        data.forEach(function(d) {
            for (let c in data.columns) {
                if (data.columns.hasOwnProperty(c)) {
                    let key = data.columns[c];
                    d[key] = isNaN(d[key]) ? d[key] : +d[key];
                }
            }
        });
    };

    const symbol = {
        mean: 'Ø',
        median: 'x̃',
        sum: 'Σ',
    };

    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    d3wb.util = {
        setLocale: setLocale,
        changeCSVSeparator: changeCSVSeparator,
        smoothData: smoothData,
        countCsvColumn: countCsvColumn,
        websafeGuid: websafeGuid,
        websafeShortGuid: websafeShortGuid,
        injectCSS: injectCSS,
        logSVGSize: logSVGSize,
        jsonAttributeMapToCSV: jsonAttributeMapToCSV,
        getBoundingBoxCenter: getBoundingBoxCenter,
        makeUnselectable: makeUnselectable,
        autocastNumericColumns: autocastNumericColumns,
        symbol: symbol,
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
                        .attr('class', d3wb.prefix('tooltip'))
                        .style('pointer-events', 'none')
                        .style('user-select', 'none')
                        .style('-moz-user-select', 'none');
                    rect = gTooltip.append('rect')
                        .attr('class', d3wb.prefix('tooltip-box'));
                    text = gTooltip.append('text')
                        .attr('class', d3wb.prefix('tooltip-text'));
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
        const defaultAction = 'openTarget';
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
            if (action != 'openTarget') {
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
                let axis = s.append('g')
                    .attr('transform', 'translate(' + c.x + ',' +
                        c.y + ')')
                    .attr('class', d3wb.prefix('axis axis-x'))
                    .call(d3wb.util.makeUnselectable());
                c.update = function(first) {
                    first = first || false;
                    let scale = applyScaleSettings(c);
                    if (first) {
                        axis.call(scale);
                    } else {
                        axis.transition().duration(500).call(scale);
                    }
                };
                c.update(true);
                injectAxisColor(c.color, axis);
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

        let c = commonAxisElements(chart, d3.axisTop, scale);
        return chart;
    };

    let xAxisBottom = function(scale) {
        return xAxis(scale).type(d3.axisBottom);
    };

    let yAxis = function(scale) {
        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i]);
                let axis = s.append('g')
                    .attr('class', d3wb.prefix('axis axis-y'))
                    .attr('transform', 'translate(' + c.x + ',' + c.y + ')')
                    .call(d3wb.util.makeUnselectable());
                c.update = function(first) {
                    first = first || false;
                    let scale = applyScaleSettings(c);
                    if (first) {
                        axis.call(scale);
                    } else {
                        axis.transition().duration(500).call(scale);
                    }
                };
                c.update(true);
                injectAxisColor(c.color, axis);
            });
        };

        let c = commonAxisElements(chart, d3.axisLeft, scale);
        return chart;
    };

    let yAxisRight = function(scale) {
        return yAxis(scale).type(d3.axisRight);
    };

    let title = function(text) {
        if (text === undefined || text == '') {
            throw Error('Call to d3wb.add.title requires a text' +
                ' string as function argument.');
        }
        let color = 'black';
        let fontSize = '140%';

        let update = function() {};

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i].ownerSVGElement);
                let root = s.node().getBBox();
                s.append('text')
                    .attr('class', d3wb.prefix('title'))
                    .attr('x', root.width / 2)
                    .attr('y', 5)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'hanging')
                    .call(d3wb.util.makeUnselectable()).style('fill', color)
                    .style('font-size', fontSize);

                update = function() {
                    s.selectAll(d3wb.selector('title')).text(text);
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
        if (text === undefined || text == '') {
            throw Error('Call to d3wb.add.xAxisLabel requires a label' +
                ' string as function argument.');
        }

        let color = 'black';
        let padding = 15;
        let orientation = 'top';

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i].ownerSVGElement);
                let root = s.node().getBBox();
                s.append('text') // text label for the x axis
                    .attr('class', d3wb.prefix('label label-x'))
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
            if (value != 'top' && value != 'bottom') {
                throw Error('Invalid orientation for d3wb.add.xAxisLabel. ' +
                    'Allowed values: top, bottom');
            }
            orientation = value;
            return chart;
        };
        return chart;
    };

    let yAxisLabel = function(text) {
        if (text === undefined || text == '') {
            throw Error('Call to d3wb.add.yAxisLabel requires a label' +
                ' string as function argument.');
        }

        let color = 'black';
        let padding = 5;
        let orientation = 'left';

        let chart = function(selection) {
            selection.each(function(data, i, nodes) {
                let s = d3.select(nodes[i].ownerSVGElement);
                let root = s.node().getBBox();
                s.append('text') // text label for the x axis
                    .attr('class', d3wb.prefix('label label-y'))
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
            if (value != 'left' && value != 'right') {
                throw Error('Invalid orientation for d3wb.add.yAxisLabel. ' +
                    'Allowed values: left, right');
            }
            orientation = value;
            return chart;
        };
        return chart;
    };

    let legend = function() {
        let color = 'black';
        let stroke;
        let colors = ['darkblue', 'blue', 'steelblue'];
        let text = ['Item 1', 'Item 2', 'Item 3'];
        let x = 0;
        let y = 0;
        let symbol = d3.symbolTriangle;
        let symbolSize = 100;

        let chart = function(selection) {
            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);
                s.append('g')
                    .attr('class', d3wb.prefix('legend'))
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
                s.select(d3wb.selector('legend'))
                    .call(legend)
                    .style('fill', color)
                    .style('font-size', '90%');
                if (stroke) {
                    s.selectAll('path.swatch').style('stroke', stroke);
                }
                // re-class legend components
                s.selectAll('.cell')
                    .attr('class', d3wb.prefix('cell'));
                s.selectAll('.legendCells')
                    .attr('class', d3wb.prefix('legend-cells'));
                s.selectAll('.label')
                    .attr('class', d3wb.prefix('cell-label'))
                    .call(d3wb.util.makeUnselectable());
                s.selectAll('.swatch')
                    .attr('class', d3wb.prefix('cell-symbol'));
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
        if (text === undefined || text == '') {
            throw Error('Call to d3wb.add.textBox requires a text' +
                ' string as function argument.');
        }
        let x = 0;
        let y = 0;
        let width = 100;
        let height = 100;
        let fill = 'white';
        let backgroundColor = 'steelblue';
        let padding = 3;
        let borderRadius = 5;
        let adjustBackgroundHeight = true;

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
                    .attr('class', d3wb.prefix('textbox'))
                    .attr('transform', 'translate(' +
                        (x + padding) + ',' + (y + padding) + ')');

                // background color
                let bg = g.append('rect')
                    .attr('class', d3wb.prefix('textbox-bg'))
                    .attr('x', -padding)
                    .attr('y', -padding)
                    .attr('width', width + padding * 2)
                    .attr('height', height + padding * 2)
                    .attr('rx', borderRadius)
                    .attr('ry', borderRadius)
                    .attr('fill', backgroundColor);

                // draw and autoscale text
                let totalHeight = 0;
                g.selectAll(d3wb.selector('textbox-line'))
                    .data(data)
                    .enter()
                    .append('text')
                    .attr('class', d3wb.prefix('textbox-line'))
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
                g.selectAll(d3wb.selector('textbox-line'))
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

            d3.selectAll(d3wb.selector('textbox-debug')).remove();
            g.append('g').attr('class', d3wb.prefix('textbox-debug'))
                .selectAll(d3wb.selector('textbox-line-debug'))
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

    let shadow = function() {
        let blur = 3;
        let xOffset = 2;
        let yOffset = 1;
        let opacity = 0.4;
        let id = d3wb.util.websafeShortGuid() + '-shadow';

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

    /* *********************************************************************
     * PRIVATE FUNCTIONS
     * ********************************************************************* */

    let injectAxisColor = function(color, axis) {
        axis.selectAll('line')
            .style('stroke', color);
        axis.selectAll('path')
            .style('stroke', color);
        axis.selectAll('text')
            .attr('fill', color);
    };

    let applyScaleSettings = function(c) {
        let currentScale = c.type(c.scale);
        if (c.ticks) {
            currentScale.ticks(c.ticks);
        }
        if (c.tickFormat) {
            currentScale.tickFormat(c.tickFormat);
        }
        return currentScale;
    };

    let commonAxisElements = function(chart, defaultType, defaultScale) {
        if (defaultScale === undefined) {
            throw Error('Call to d3wb.add.axis requires a d3.scale as' +
                ' function argument.');
        }

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

        c.scale = defaultScale;
        chart.scale = function(value) {
            if (!arguments.length) return type;
            c.scale = value;
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

        c.color = 'black';
        chart.color = function(value) {
            if (!arguments.length) return color;
            c.color = value;
            return chart;
        };

        c.update = function() {};
        chart.update = function(scale) {
            c.update(scale);
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

    /* *********************************************************************
     * PUBLIC API
     * ********************************************************************* */

    d3wb.add = {
        xAxis: xAxis,
        xAxisTop: xAxis,
        xAxisBottom: xAxisBottom,
        xAxisLabel: xAxisLabel,
        yAxis: yAxis,
        yAxisLeft: yAxis,
        yAxisRight: yAxisRight,
        yAxisLabel: yAxisLabel,
        title: title,
        textBox: textBox,
        legend: legend,
        shadow: shadow,
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
                    let value = d3.select('#' + c.id +
                        '-control').property('value');
                    let index = options.indexOf(value);
                    c.callback(value, index);
                };

                let div = appendBaseDiv(s, c);

                let selectEl = div.append('select')
                    .attr('id', c.id + '-control')
                    .on('change', callbackImpl);
                selectEl
                    .selectAll('option')
                    .data(options).enter()
                    .append('option')
                    .attr('class', c.id + '-option')
                    .text(function(d) {
                        return d;
                    });

                callbackImpl();
                c.autoLocate();
            });
        };

        let c = commonElements(chart, 'dropdown');

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
                    let value = d3.select('#' + c.id +
                        '-control').text();
                    let idx = options.indexOf(value);
                    index = (index + 1) % (options.length);
                    c.callback(value, idx);
                    buttonEl.text(options[index]);
                };

                let div = appendBaseDiv(s, c);

                buttonEl = div.append('button')
                    .attr('id', c.id + '-control')
                    .style('user-select', 'none')
                    .style('-moz-user-select', 'none')
                    .text(options[index])
                    .on('click', callbackImpl);

                if (c.callbackOnInit) {
                    callbackImpl();
                }
                c.autoLocate();
            });
        };

        let c = commonElements(chart, 'button');

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

                let div = appendBaseDiv(s, c);

                div.append('input')
                    .attr('id', c.id + '-control')
                    .style('margin', 0)
                    .style('padding', 0)
                    .on('input', function(d, i, nodes) {
                        callbackImpl(nodes[i]);
                    });

                c.autoLocate();
            });
        };

        let c = commonElements(chart, 'textfield');

        return chart;
    };

    const infoBox = function(text) {
        let controlColor = 'black';
        let controlColorHover = 'red';
        let controlFontSize = '150%';
        let infoColor = 'white';
        let infoFill = 'black';
        let infoFontSize = '100%';
        let infoOpacity = 0.8;
        let infoContent = text || `<b>Information</b></br>
        This box contains information about the graph. It's intended ` +
            `to guide the user. You can use <i>html-style</i> as desired.
        `;

        let open = false;

        let chart = function(selection) {
            selection = resolve(selection);

            selection.each(function(d, i, nodes) {
                let s = d3.select(nodes[i]);

                let div = appendBaseDiv(s, c);

                let input = div
                    .append('p')
                    .attr('id', c.id + '-control')
                    .html('&#9432;');

                div.append('p')
                    .attr('id', c.id + '-infobox')
                    .html(infoContent);

                input.on('click', function() {
                    open = !open;
                    let opac = open ? infoOpacity : 0.0;
                    d3wb.util.injectCSS(
                        '#' + c.id + '-infobox { opacity: ' + opac + ';}');
                });

                d3wb.util.injectCSS(`
                    #` + c.id + ` {
                        pointer-events:none;
                    }
                    #` + c.id + `-control {
                        margin: 0;
                        padding: 0;
                        width: 0px;
                        color: ` + controlColor + `;
                        font-size: ` + controlFontSize + `;
                        pointer-events: auto;
                    }
                    #` + c.id + `-button:hover {
                        cursor: default;
                        color: ` + controlColorHover + `;
                    }
                    #` + c.id + `-infobox {
                        position: relative;
                        text-align: left;
                        margin: 0;
                        padding: 0.5em;
                        border-radius: 0.4em;
                        user-select: none;
                        border: 1px solid ` + infoColor + `;
                        color: ` + infoColor + `;
                        font-size: ` + infoFontSize + `;
                        background-color: ` + infoFill + `;
                        opacity: 0;
                    }
                `);
                c.autoLocate();
            });
        };

        let c = commonElements(chart, 'infobox');

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

    let appendBaseDiv = function(s, c) {
        return s.append('div')
            .attr('id', c.id)
            .style('position', 'absolute')
            .style('margin', 0)
            .style('padding', 0)
            .call(d3wb.util.makeUnselectable());
    };

    let commonElements = function(chart, type) {
        let c = {
            id: d3wb.util.websafeShortGuid() + '-' + type,
            callback: function() {
                console.log('callback.');
            },
            callbackOnInit: false,
            leftOrRightSet: false, // necessary to auto-position on default
            topOrBottomSet: false, // necessary to auto-position on default
            autoLocate: function() {
                if (!this.leftOrRightSet) {
                    d3wb.util.injectCSS(`
                        #` + c.id + ` {
                            left: 0px;
                        }`);
                }
                if (!this.topOrBottomSet) {
                    d3wb.util.injectCSS(`
                        #` + c.id + ` {
                            top: 0px;
                        }`);
                }
            },
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
            key = key.trim();
            if (key == 'left' || key == 'right') {
                c.leftOrRightSet = true;
            }
            if (key == 'bottom' || key == 'top') {
                c.topOrBottomSet = true;
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
