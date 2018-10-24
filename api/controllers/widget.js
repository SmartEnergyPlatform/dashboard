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

var collectionGetter = db.getCollectionGetter("widget");

module.exports = {
    getWidgets: getWidgets,
    getWidget: getWidget,
    addWidget: addWidget,
    deleteWidget: deleteWidget,
    updateWidget: updateWidget
};

function getWidgets(req, res) {
    collectionGetter().then(function (collection) {
        collection.find({'owner':jwt.getUser(req)}).toArray(function (err, docs) {
            if (!docs.length)
                res.status(404).json();
            else if (!err)
                res.json(docs);
            else
                res.json({"message": "An unexpected error occurred."})
        });
    });
}

function getWidget(req, res) {
    var id = req.swagger.params.id.value;
    collectionGetter().then(function (collection) {
        collection.find({'_id': objectId(id),'owner':jwt.getUser(req)}).toArray(function (err, doc) {
            if (!doc.length)
                res.status(404).json();
            else if (!err)
                res.json(doc);
            else
                res.json({"message": "An unexpected error occurred."})
        });
    });
}

function addWidget(req, res) {
    var widget = req.swagger.params.widget.value;
    widget.owner = jwt.getUser(req);
    collectionGetter().then(function (collection) {
        collection.insert(widget, function (err, result) {
            if (!err) {
                res.status(201).json(result.ops[0]);
            } else
                res.json({"message": "An unexpected error occurred."});
        });
    });
}

function updateWidget(req, res) {
    var widget = req.swagger.params.widget.value;
    var id = req.swagger.params.id.value;
    widget.owner = jwt.getUser(req);
    collectionGetter().then(function (collection) {
        collection.update({'_id': objectId(id), 'owner': widget.owner}, widget, function (err, count, status) {
            if (!err) {
                res.status(204).json();
            } else
                res.json({"message": "An unexpected error occurred."});
        });
    });
}

function deleteWidget(req, res) {
    var id = req.swagger.params.id.value;
    collectionGetter().then(function (collection) {
        collection.remove({'_id': objectId(id),'owner':jwt.getUser(req)}, function (err, doc) {
            if (err)
                res.send({'message': e});
            else {
                res.status(204).json();
            }
        });
    });
}
