const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();

const ds = require('./datastore');

const datastore = ds.datastore;

const BOAT = "Boat";

router.use(bodyParser.json());



/* ------------- Begin Model Functions ------------- */
function post_boat(name, type, length, load, req) {
    var key = datastore.key(BOAT);
    if (load == undefined || load == null){
        load = [];
    }
    // , "self": req.protocol
    const new_boat = { "name": name, "type": type, "length": length, "loads": load};
    return datastore.save({ "key": key, "data": new_boat }).then(() => { return key });
}

function get_boats(req) {
    const q = datastore.createQuery(BOAT);
    var results = {};
        return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        // console.log(entities[0].map(fromDatastore));
        results = entities[0].map(fromDatastore);
        //results.self = JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.id);
        console.log((req.protocol + "://" + req.get("host") + req.baseUrl ));
        return results;
        //console.log(entities);
        //return entities[0].map(fromDatastore);
        
    });
}

function get_boat(id) { 
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
        // No entity found. Don't try to add the id attribute
        return entity;
        } else {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array entity
        return entity.map(fromDatastore);
        }
    });
}

function put_boat(id, name, type, length) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
}

function delete_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.delete(key);
}

function patch_boat(id, name, type, length) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
}



/* ------------- End Model Functions ------------- */
/* ------------- Begin Controller Functions ------------- */
/* GET ROUTES */
router.get('/boats', function (req, res) {
    const boats = get_boats(req).then((boats) => {
        res.status(200).json(boats);
    });
});

router.get('/boats/:id', function (req, res) {
    get_boat(req.params.id).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        } else {
        // Return the 0th element which is the boat with this id
        res.status(200).json(boat[0]);
        }
    });
});

/* POST ROUTES */

router.post('/boats', function (req, res) {
    //const loadData = req.body.load ? req.body.load: [];
    if (!req.body.name || !req.body.type || !req.body.length){
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
    }
    else{post_boat(req.body.name, req.body.type, req.body.length, req.body.load).then(key => { res.status(201).send('{ "id": ' + key.id + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ', \n"loads": ' + '[]' + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + key.id) + ' }') });}
    
});

/* PATCH ROUTES TODO */
router.patch('/boats/:id', function (req, res) {
    get_boat(req.params.id).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        }
        if (!req.body.name || !req.body.type || !req.body.length){
            res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
        }else{patch_boat(req.params.id,req.body.name, req.body.type, req.body.length).then( res.status(200).send('{"id": ' + req.params.id + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ' }') );}
    });
    
    
});

/* DELETE ROUTES*/
router.delete('/boats/:id', function (req, res) {
    get_boat(req.params.id).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        } else {
        // Return the 0th element which is the boat with this id
        delete_boat(req.params.id).then(res.status(204).end());
        }
    });
    
});

/* ------------- End Controller Functions ------------- */

module.exports = router;