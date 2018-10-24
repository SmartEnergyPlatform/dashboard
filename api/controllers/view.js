/*
 *    Copyright 2018 InfAI (CC SES)
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

'use strict';

var db = require('./../../lib/db');
var objectId = require('mongodb').ObjectID;
var settings = require("./../../settings");
var jwt = require("./../helpers/jwt");

var viewCollectionGetter = db.getCollectionGetter("view");
var widgetCollectionGetter = db.getCollectionGetter("widget");

module.exports = {
    getViews: getViews,
    getView: getView,
    addView: addView,
    deleteView: deleteView,
    updateView: updateView
};

function getViews(req, res) {
    var owner = jwt.getUser(req);
    viewCollectionGetter().then(function (collection) {
        collection.find({'owner':owner}).toArray(function (err, views) {
            if (!views.length)
                res.status(404).json();
            else if (!err) {
                var promises = [];
                views.forEach(function (element) {
                    promises.push(widgetCollectionGetter().then(function (collection) {
                        return new Promise(function (resolve, reject) {
                            collection.find({'view': element._id.toString(),'owner':owner}).toArray(function (err, widgets) {
                                if (err)
                                    reject();
                                else {
                                    element.widgets = widgets;
                                    resolve();
                                }
                            });
                        })
                    }));
                });

                Promise.all(promises).then(function () {
                        res.json(views);
                    },
                    function () {
                        res.json({"message": "An unexpected error occurred."})
                    });
            }
            else
                res.json({"message": "An unexpected error occurred."});
        });
    });
}

function getView(req, res) {
    var id = req.swagger.params.id.value;
    var owner = jwt.getUser(req);
    viewCollectionGetter().then(function (collection) {
        collection.findOne({'_id': objectId(id),'owner':owner}, function (err, doc) {
            if (!doc)
                res.status(404).json();
            else if (!err) {
                widgetCollectionGetter().then(function (collection) {
                    collection.find({'view': doc._id.toString(),'owner':owner}).toArray(function (err, widgets) {
                        doc.widgets = widgets;
                        console.log(doc);

                        res.json(doc);
                    })
                });
            }
            else
                res.json({"message": "An unexpected error occurred."})
        });
    });
}

function addView(req, res) {
    var widget = req.swagger.params.view.value;
    widget.owner = jwt.getUser(req);
    viewCollectionGetter().then(function (collection) {
        collection.insert(widget, function (err, result) {
            if (!err) {
                res.status(201).json(result.ops[0]);
            } else
                res.json({"message": "An unexpected error occurred."});
        });
    });
}

function updateView(req, res) {
    var widget = req.swagger.params.view.value;
    var id = req.swagger.params.id.value;
    widget.owner = jwt.getUser(req);
    viewCollectionGetter().then(function (collection) {
        collection.update({'_id': objectId(id), 'owner': widget.owner}, widget, function (err, count, status) {
            if (!err) {
                res.status(204).json();
            } else
                res.json({"message": "An unexpected error occurred."});
        });
    });
}

function deleteView(req, res) {
    var id = req.swagger.params.id.value;
    var owner = jwt.getUser(req);
    viewCollectionGetter().then(function (collection) {
        collection.remove({'_id': objectId(id),'owner':owner}, function (err, doc) {
            if (err)
                res.send({'message': e});
            else {
                widgetCollectionGetter().then(function (collection) {
                    collection.remove({'view': id.toString(),'owner':owner}, function (err, doc) {
                        if (err)
                            res.send({'message': e});
                    });
                });
                res.status(204).json();
            }
        });
    });
}