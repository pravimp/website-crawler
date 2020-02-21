// config example
// node -e 'require("./crawler").init({url: "http://www.arstechnica.com", limit: 10})'
// https://www.freecodecamp.org/news/the-ultimate-guide-to-web-scraping-with-node-js-daa2027dcd3/ use request promise
Crawler = ((config) => {
    var request = require('request');
    var cheerio = require('cheerio');
    // Private
    var Obj = {},
        urlSplit, count, currentUrl,
        createObject = () => {
            console.log("###############################"); 
            console.log("Creating Object");
            Obj.info = {
                pagesToVisit: [],
                pagesVisited: [],
                numberOfPagesVisited: 0
            };
            Obj.result = {
                url: {
                    internal: [],
                    external: []
                }
            };
        },
        prefixDomain = (relativePath) => currentUrl + relativePath,
        createReport = () => {
            console.log("Creating Report");
            var fs = require('fs');
            var path = require('path');
            var os = require('os');
            var fileName = path.join(__dirname, 'reports', urlSplit + ".csv");
            var output = [];
            for (var key in Obj.result.url) {
                if (Obj.result.url.hasOwnProperty(key)) {
                    var row = [];
                    row.push(key);
                    Obj.result.url[key].map((item) => { row.push(item) });
                    output.push(row.join());
                }
            }
            if (output.length > 0 && row.length > 0) {
                fs.writeFileSync(fileName, output.join(os.EOL));
                console.log("Report Created. Available at - " + fileName);
            }
        },
        addUrlToPagesToVisitArray = (url) => { Obj.info.pagesToVisit.push(url); },
        getLinks = ($) => {
            var links = {
                relative: [],
                absolute: []
            };
            var anchorTagsWithRelativeLink = $("a[href^='/']");
            var anchorTagsWithAbsoluteLink = $("a[href^='http']");
            anchorTagsWithRelativeLink.each(function(item) {
                var attr = $(this).attr('href')
                addUrlToPagesToVisitArray(prefixDomain(attr));
                Obj.result.url.internal.push(attr);
            });
            anchorTagsWithAbsoluteLink.each(function(item) {
                var attr = $(this).attr('href');
                Obj.result.url.external.push(attr);
                addUrlToPagesToVisitArray(attr);
            });
            // updateInfoArrays
            Obj.info.pagesVisited.push(Obj.info.pagesToVisit.shift());
        },
        getbody = (responseBody) => cheerio.load(responseBody),
        requestBody = (url) => {
            //TODO update this logic current url should just be the host name
            currentUrl = url;
            var bodyRequest = new Promise(function(resolve, reject) {
                request(url, function(error, response, responseBody) {
                    if (error) {
                        console.log("Error", error);
                    } else {
                        if (response.statusCode === 200) {
                            //parse body
                            console.log("Response - Success");
                            resolve(responseBody);
                        } else if (response.statusCode === 403) {
                            console.log("Response - Forbidden");
                        } else {
                            //TODO handle other response status
                        }
                    }
                });
            }).then(getbody).then(getLinks).then(getOnToNextUrl);
        },
        getOnToNextUrl = () => {
            if (Obj.config.limit) {
                if (count > Obj.config.limit) {
                    console.log("###############################"); 
                    console.log("Page limit reached");
                    console.log("###############################");
                    createReport();
                    return false;
                } else {
                    console.log("###############################");        
                    console.log(count + " - visiting " + Obj.info.pagesToVisit[0]);
                    requestBody(Obj.info.pagesToVisit[0]);
                    count++;
                }
            } else {
                console.log(count + " Limit not configured");
                requestBody(Obj.info.pagesToVisit[0]);
                count++;
            }
        }
    // Public
    Obj.init = function(config) {
        Obj.config = Object.assign({}, config);
        createObject();
        urlSplit = Obj.config.url.split('www.')[1].split('.com')[0];
        addUrlToPagesToVisitArray(Obj.config.url);
        count = 1;
        getOnToNextUrl();
    }
    return Obj;
})();

module.exports.init = function(options) {
    return Crawler.init(options);
};
