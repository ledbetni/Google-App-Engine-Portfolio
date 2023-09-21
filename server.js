const json2html = require('json-to-html');

const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const request = require('request');
const projectId = 'cs493portfolioproject';
const datastore = new Datastore({projectId:projectId});
const USER = "User";
const BOAT = "Boat";
const LOAD = "Load";
//const jwt = require('express-jwt');
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require('jwks-rsa');
const router = express.Router();
const login = express.Router();
app.use(express.json());
app.use(bodyParser.json());
//app.use(bodyParser.json());
app.enable('trust proxy');
const { auth } = require('express-openid-connect');
const CLIENT_ID = '4yBIMDz2T7zzD02z1Ic5D97qFuBFZN07';
const CLIENT_SECRET = '9GpQJ-h9OroJ819lofme9imXXZyG00Jd3u5JQ052P06MzZs8dzziF68repupJL4u';
const DOMAIN = 'ledbetni-portfolioproject-cs493.us.auth0.com';
const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: 'https://cs493portfolioproject.uc.r.appspot.com',
    clientID: '4yBIMDz2T7zzD02z1Ic5D97qFuBFZN07',
    issuerBaseURL: 'https://ledbetni-portfolioproject-cs493.us.auth0.com',
    secret: '9GpQJ-h9OroJ819lofme9imXXZyG00Jd3u5JQ052P06MzZs8dzziF68repupJL4u'
  };

app.use(auth(config));
//https://cs493portfolioproject.uc.r.appspot.com
//http://localhost:8080
function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
  });
/* ------------- Begin Model Functions ------------- */
function post_boat(name, type, length, load, owner) {
    var key = datastore.key(BOAT);
    if (load == undefined || load == null){
        load = [];
    }
    if (owner == undefined || owner == null){
        owner = [];
    }
    // , "self": req.protocol
    const new_boat = { "name": name, "type": type, "length": length, "loads": load, "owner": owner};
    return datastore.save({ "key": key, "data": new_boat }).then(() => { return key });
}

function post_load(volume, item, creation_date, carrier) {
    var key = datastore.key(LOAD);
    if (carrier == undefined || carrier == null){
        carrier = [];
    }
    const new_load = { "volume": volume, "item": item, "creation_date": creation_date, "carrier": carrier};
    return datastore.save({ "key": key, "data": new_load }).then(() => { return key });
}

function post_user(uniqueID) {
    var key = datastore.key(USER);
    // if (boat == undefined || boat == null){
    //     boat = [];
    // }
    const new_user = { "uniqueID": uniqueID};
    return datastore.save({ "key": key, "data": new_user }).then(() => { return key });
}
/**
* The function datastore.query returns an array, where the element at index 0
* is itself an array. Each element in the array at element 0 is a JSON object
* with an entity fromt the type "Lodging".
*/
function get_boats_unsecure(req) {
    var q = datastore.createQuery(BOAT).limit(5);
    
    var results = {};

    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
    return datastore.runQuery(q).then((entities) => {
        
        results.boats = entities[0].map(fromDatastore);
        if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
            results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + "?cursor=" + entities[1].endCursor;
        }
        return results;
        //return entities[0].map(fromDatastore);
        
    });
}

function get_boats(owner, req){
	var q = datastore.createQuery(BOAT).filter("owner", "=", owner).limit(5);
    var results = {};

    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q).then( (entities) => {
        console.log(entities);
            //results.boats = entities[0].map(fromDatastore).filter( item => item.owner == owner );
            results.boats = entities[0].map(fromDatastore);
            if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + "?cursor=" + entities[1].endCursor;
            }
            return results;
			//return entities[0].map(fromDatastore).filter( item => item.owner === owner );
		});
}

function get_loads(req) {
    var q = datastore.createQuery(LOAD).limit(5);
    var results = {};

    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
    return datastore.runQuery(q).then((entities) => {
        results.loads = entities[0].map(fromDatastore);
        if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
            results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + "?cursor=" + entities[1].endCursor;
        }
        return results;
    });
}

function get_users() {
    var q = datastore.createQuery(USER);
    //var results = {};

    // if(Object.keys(req.query).includes("cursor")){
    //     q = q.start(req.query.cursor);
    // }
    return datastore.runQuery(q).then((entities) => {
        //results.users = entities[0].map(fromDatastore);
        // if(entities[1].moreResults !== datastore.NO_MORE_RESULTS ){
        //     results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + "?cursor=" + entities[1].endCursor;
        // }
        //return results;
        return entities[0].map(fromDatastore);
        
    });
}
/**
* This function is not in the code discussed in the video. It demonstrates how
* to get a single entity from Datastore using an id.
* Note that datastore.get returns an array where each element is a JSON object
* corresponding to an entity of the Type "Lodging." If there are no entities
* in the result, then the 0th element is undefined.
* @param {number} id Int ID value
* @returns An array of length 1.
* If a lodging with the provided id exists, then the element in the array
* is that lodging
* If no lodging with the provided id exists, then the value of the
* element is undefined
*/
function get_boat(id) { 
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
        // No entity found. Don't try to add the id attribute
        return entity;
        } else {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array entity
        //var results = {};
        //results = entity.map(fromDatastore);
        //console.log(entity.map(fromDatastore));
        //results.self = JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + key.id);
        //return results;
        return entity.map(fromDatastore);
        }
    });
}

function get_load(id) {
    const key = datastore.key([LOAD, parseInt(id, 10)]);
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

function get_user(uniqueID) { 
    const key = datastore.key([USER, parseInt(uniqueID, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
        // No entity found. Don't try to add the id attribute
        return entity;
        } else {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array entity
        //var results = {};
        //results = entity.map(fromDatastore);
        //console.log(entity.map(fromDatastore));
        //results.self = JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + key.id);
        //return results;
        return entity.map(fromDatastore);
        }
    });
}

// function get_all_boat_loads(id) { 
//     const key = datastore.key([BOAT, parseInt(id, 10)]);
//     return datastore.get(key).then((entity) => {
//         if (entity[0] === undefined || entity[0] === null) {
//         // No entity found. Don't try to add the id attribute
//         return entity;
//         } else {
//         // Use Array.map to call the function fromDatastore. This function
//         // adds id attribute to every element in the array entity
//         var results = {};
//         results = entity.map(fromDatastore);
//         results.loads = entity.map(fromDatastore).loads;
//         //results.self = JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + key.id);
//         //return results;
//         console.log(results);
//         return results;
//         }
//     });
// }


function put_boat(id, name, type, length, owner, loads) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length, "owner": owner, "loads": loads};
    return datastore.save({ "key": key, "data": boat });
}

function put_load(id, volume, item, creation_date, carrier) {
    const key = datastore.key([LOAD, parseInt(id, 10)]);
    const load = { "volume": volume, "item": item, "creation_date": creation_date, "carrier": carrier};
    return datastore.save({ "key": key, "data": load });
}

// function post_load(volume, item, creation_date, carrier) {
//     var key = datastore.key(LOAD);
//     if (carrier == undefined || carrier == null){
//         carrier = [];
//     }
//     const new_load = { "volume": volume, "item": item, "creation_date": creation_date, "carrier": carrier};
//     return datastore.save({ "key": key, "data": new_load }).then(() => { return key });
// }

function put_load_to_boat(lid, bid) {
    const bkey = datastore.key([BOAT, parseInt(bid, 10)]);
    //const slip = { "number": number, "current_boat": current_boat };
    //return datastore.save({ "key": key, "data": slip });
        return datastore.get(bkey)
    .then( (boat) => {
        if( typeof(boat[0].loads) === 'undefined'){
            boat[0].loads = [];
        }
        let newLoad = {"id": lid};
        boat[0].loads.push(newLoad);
        return datastore.save({"key":bkey, "data":boat[0]});
    });
}

function put_boat_to_owner(bid, oid) {
    const okey = datastore.key([USER, parseInt(oid, 10)]);
        return datastore.get(okey)
    .then( (user) => {
        if( typeof(user[0].boats) === 'undefined'){
            user[0].boats = [];
        }
        let newBoat = {"id": bid};
        user[0].boats.push(newBoat);
        return datastore.save({"key":okey, "data":user[0]});
    });
}

function remove_boat_from_owner(oid, bid) {
    const okey = datastore.key([USER, parseInt(oid, 10)]);
        return datastore.get(okey)
    .then( (user) => {
        if( typeof(user[0].boats) === 'undefined'){
            user[0].boats = [];
        }
        let newBoat = {"id": bid};
        for(var i = 0; i < user[0].boats.length; i++){
            if(user[0].boats[i].id === bid){
                user[0].boats = user[0].boats.filter(function(arr) {
                    arr.id !== bid;
                });
            }
        }
        
        return datastore.save({"key":okey, "data":user[0]});
    });
}


function put_boat_to_load(lid, bid, bname) {
    const lkey = datastore.key([LOAD, parseInt(lid, 10)]);
        return datastore.get(lkey)
    .then( (load) => {
        //if( typeof(load[0].carrier) === 'undefined' || load[0].carrier == null){
        console.log(load);
        if (load[0].carrier == null){
            load[0].carrier = [];
        }
        let newCarrier = {"id": bid, "name": bname};
        load[0].carrier.push(newCarrier);
        return datastore.save({"key":lkey, "data":load[0]});
    });
}

function remove_load_from_boat(lid, bid) {
    const bkey = datastore.key([BOAT, parseInt(bid, 10)]);
    //const slip = { "number": number, "current_boat": current_boat };
    //return datastore.save({ "key": key, "data": slip });
        return datastore.get(bkey)
    .then( (boat) => {
        if( typeof(boat[0].loads) === 'undefined'){
            boat[0].loads = [];
        }
        let newLoad = {"id": lid};
        boat[0].loads = [];
        return datastore.save({"key":bkey, "data":boat[0]});
    });
}

function remove_carrier(lid, bid) {
    const lkey = datastore.key([LOAD, parseInt(lid, 10)]);
        return datastore.get(lkey)
    .then( (load) => {
        //if( typeof(load[0].carrier) === 'undefined' || load[0].carrier == null){
        console.log(load);
        if (load[0].carrier == null){
            load[0].carrier = [];
        }
        //let newCarrier = {"id": bid, "name": bname};
        load[0].carrier = [];
        return datastore.save({"key":lkey, "data":load[0]});
    });
}


function delete_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.delete(key);
}

function delete_load(id) {
    const key = datastore.key([LOAD, parseInt(id, 10)]);
    return datastore.delete(key);
}



 
/* ------------- End Model Functions ------------- */
/* ------------- Begin Controller Functions ------------- */
/* GET ROUTES */
router.get('/boats/unsecure', function (req, res) {
    const boat = get_boats_unsecure(req).then((boats) => {
        if (boats.boats.length > 0){
            for (let i = 0; i < boats.boats.length; i++){
                boats.boats[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + boats.boats[i].id);
                for(let j = 0; j < boats.boats[i].loads.length; j++){
                    boats.boats[i].loads[j].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boats.boats[i].loads[j].id)
                }
                
            }
            //boat[0].loads[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[0].id);
        }
        //console.log(boats.boats);
        res.status(200).json(boats);
    });
});

router.get('/boats', checkJwt, function (req, res) {
    const boat = get_boats(req.auth.sub, req).then((boats) => {
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if (boats.boats.length > 0){
            for (let i = 0; i < boats.boats.length; i++){
                //console.log(boats.boats[i]);
                boats.boats[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + boats.boats[i].id);
                for(let j = 0; j < boats.boats[i].loads.length; j++){
                    boats.boats[i].loads[j].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boats.boats[i].loads[j].id)
                }
                
            }
            //boat[0].loads[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[0].id);
        }
        //console.log(boats.boats);
        res.status(200).json(boats);
    });
});

router.get('/loads', function (req, res) {
    const load = get_loads(req).then((loads) => {
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if (loads.loads.length > 0){
            //console.log(loads.loads);
            for (let i = 0; i < loads.loads.length; i++){
                loads.loads[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + loads.loads[i].id);
                if(loads.loads[i].carrier != null){
                    loads.loads[i].carrier.self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + loads.loads[i].carrier.id)
                }
                
            }
            //boat[0].loads[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[0].id);
        }
        res.status(200).json(loads);
    });
});

router.get('/users', function (req, res) {
    const users = get_users().then((users) => {
        console.log(users);
        res.status(200).json(users);
    });
});

// router.get('/users/:uniqueID', function (req, res) {
//     get_user(req.params.uniqueID).then(user => {
//         console.log(user);
//         if (user[0] === undefined || user[0] === null) {
//         // The 0th element is undefined. This means there is no user with this id 
//         res.status(404).json({ 'Error': 'No user with this user_id exists' });
//         } 
//         else {
//         // Return the 0th element which is the user with this id
//         //console.log(user[0]);
//         user[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/users/" + user[0].id);
//         //if(user[0].loads != null || user[0].loads != undefined || user[0].loads != []){
//         if (user[0].loads.length > 0){
//             for (let i = 0; i < user[0].loads.length; i++){
//                 user[0].loads[i].name = user[0].loads[i].name;
//                 user[0].loads[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + user[0].loads[i].id)
//             }
//             //user[0].loads[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + user[0].loads[0].id);
//         }
//         res.status(200).json(user[0]);
//         //res.status(200).send(JSON.stringify(boat[0]));
//         //res.status(200).json('{ "self:" ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.id + ' }'));
//         }
//     });
// });

router.get('/boats/:id', checkJwt, function (req, res) {
    get_boat(req.params.id).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        } 
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if(boat[0].owner != req.auth.sub){
            res.status(403).json({ 'Error': 'Incorrect owner - not authorized to view this resource' });
        }
        else {
        // Return the 0th element which is the boat with this id
        //console.log(boat[0]);
        boat[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + boat[0].id);
        //if(boat[0].loads != null || boat[0].loads != undefined || boat[0].loads != []){
        if (boat[0].loads.length > 0){
            for (let i = 0; i < boat[0].loads.length; i++){
                boat[0].loads[i].name = boat[0].loads[i].name;
                boat[0].loads[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[i].id)
            }
            //boat[0].loads[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[0].id);
        }
        res.status(200).json(boat[0]);
        //res.status(200).send(JSON.stringify(boat[0]));
        //res.status(200).json('{ "self:" ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.id + ' }'));
        }
    });
});

router.get('/loads/:id', function (req, res) {
    get_load(req.params.id).then(load => {
        if (load[0] === undefined || load[0] === null) {
        // The 0th element is undefined. This means there is no load with this id 
        res.status(404).json({ 'Error': 'No load with this load_id exists' });
        return;
        } 
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        else {
        // Return the 0th element which is the load with this id
        if (load[0].carrier != null ){
            if (load[0].carrier.length > 0){
            // for (let i = 0; i < boat[0].loads.length; i++){
            //     boat[0].loads[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[i].id)
            // }
            load[0].carrier[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + load[0].carrier[0].id);
        }
        }
        load[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + load[0].id);
        res.status(200).json(load[0]);
        }
    });
});

// router.get('/boats/:id/loads', function (req, res) {
//     get_all_boat_loads(req.params.id).then(boat => {
//         if (boat[0] === undefined || boat === null) {
//         // The 0th element is undefined. This means there is no boat with this id 
//         res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
//         return
//         } else {
//         // Return the 0th element which is the boat with this id
//         console.log(boat[0]);
//         if(boat[0] != undefined){
//             boat[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + boat[0].id);
//             if (boat[0].loads.length > 0){
//                 for (let i = 0; i < boat[0].loads.length; i++){
//                     boat[0].loads[i].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[i].id)
//                 }
//                 //boat[0].loads[0].self = (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + boat[0].loads[0].id);
//             }
//             res.status(200).json(boat[0]);
//         }
//         }
//     });
// });

/* POST ROUTES */

router.post('/boats', checkJwt, function (req, res) {
    //const loadData = req.body.load ? req.body.load: [];
    console.log(req.auth.sub);
    if(!req.auth.sub){
        res.status(401).json({ 'Error': 'Must be logged in to access this resource' });
        return;
    }
    if (!req.body.name || !req.body.type || !req.body.length){
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
        return;
    }
    const accepts = req.accepts(['application/json', 'text/html']);
    if(!accepts){
        res.setHeader('Content-Type', 'application/json');
        res.status(406).send('Accept Header Not Acceptable');
        return;
    }
    else{
        post_boat(req.body.name, req.body.type, req.body.length, req.body.load, req.auth.sub).then(key => {
            // let newBoat = {"id": key.id};
            // get_users().then(users => {
            //     console.log(users);
            //     for(var i = 0; i < users.length; i++){
            //         if(users[i].uniqueID == req.auth.sub){
            //             put_boat_to_owner(key.id, users[i].id);
            //         }
            //     }
            // });
            res.status(201).send('{ "id": ' + key.id + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ', \n"loads": ' + '[]' + ', \n"owner": ' + JSON.stringify(req.auth.sub) + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + key.id) + ' }') });
}
    
});

router.post('/loads', function (req, res) {
    if (!req.body.volume || !req.body.item || !req.body.creation_date){
        res.status(400).json({ 'Error': 'The request object is missing at least one of the required attributes' });
        return;
    }
    const accepts = req.accepts(['application/json', 'text/html']);
    if(!accepts){
        res.setHeader('Content-Type', 'application/json');
        res.status(406).send('Accept Header Not Acceptable');
        return;
    }
    else{
        post_load(req.body.volume, req.body.item, req.body.creation_date).then(key => { res.status(201).send('{ "id": ' + key.id + ', \n"volume": '+ req.body.volume + ', \n"item": ' + JSON.stringify(req.body.item) + ', \n"creation_date": ' + JSON.stringify(req.body.creation_date) + ', \n"carrier": ' + '[]' + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + key.id) + ' }') });
}
//console.log(req.body.volume, req.body.item, req.body.creation_date);
});

/* PUT ROUTES */


router.put('/boats/:bid/loads/:lid', function(req, res){
    
    get_load(req.params.lid).then(load => {
        if (load[0] === undefined || load[0] === null) {
        // The 0th element is undefined. This means there is no load with this id 
            res.status(404).json({ 'Error': 'The specified boat and/or load does not exist' });
            return;
        } 
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
    
        get_boat(req.params.bid).then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
            // The 0th element is undefined. This means there is no boat with this id 
            res.status(404).json({ 'Error': 'The specified boat and/or load does not exist' });
            return;
            }
            else{
                put_load_to_boat(req.params.lid, req.params.bid).then(res.status(204).end());
                put_boat_to_load(req.params.lid, req.params.bid, boat[0].name);
            }
        });
    });
});


router.put('/boats/:bid', checkJwt, function(req, res){ 
    
    get_boat(req.params.bid).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.setHeader('Content-Type', 'application/json');
        res.status(404).json({ 'Error': 'The specified boat does not exist' });
        return;
        }
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if(boat[0].owner != req.auth.sub){
            res.status(403).json({ 'Error': 'Incorrect owner - not authorized to view this resource' });
        }
        if (!req.body.name || !req.body.type || !req.body.length){
            res.status(400).json({ 'Error': 'Must specify all attributes. Use PATCH to update individual attributes' });
            return;
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid))
            put_boat(req.params.bid, req.body.name, req.body.type, req.body.length, req.auth.sub, boat[0].loads).then(key => { res.status(303).json('{ "id": ' + req.params.bid + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid) + ' }') });
        }
    });
});


/* PATCH ROUTES TODO */
router.patch('/boats/:bid', checkJwt, function(req, res){ 
    
    get_boat(req.params.bid).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.setHeader('Content-Type', 'application/json');
        res.status(404).json({ 'Error': 'The specified boat does not exist' });
        return;
        }
        if(boat[0].owner != req.auth.sub){
            res.status(403).json({ 'Error': 'Incorrect owner - not authorized to view this resource' });
        }
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if (!req.body.name){
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid))
            put_boat(req.params.bid, boat[0].name, req.body.type, req.body.length, req.auth.sub, boat[0].loads).then(key => { res.status(200).json('{ "id": ' + req.params.bid + ', \n"name":  '+ JSON.stringify(boat[0].name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid) + ' }') });
        }
        else if (!req.body.length){
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid))
            put_boat(req.params.bid, req.body.name, req.body.type, boat[0].length, req.auth.sub, boat[0].loads).then(key => { res.status(200).json('{ "id": ' + req.params.bid + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + boat[0].length + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid) + ' }') });
        }
        else if (!req.body.type){
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid))
            put_boat(req.params.bid, req.body.name, boat[0].type, req.body.length, req.auth.sub, boat[0].loads).then(key => { res.status(200).json('{ "id": ' + req.params.bid + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(boat[0].type) + ', \n"length": ' + req.body.length + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid) + ' }') });
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid))
            put_boat(req.params.bid, req.body.name, req.body.type, req.body.length, req.auth.sub, boat[0].loads).then(key => { res.status(200).json('{ "id": ' + req.params.bid + ', \n"name":  '+ JSON.stringify(req.body.name) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/boats/" + req.params.bid) + ' }') });
        }
    });
});

router.put('/loads/:lid', function(req, res){ 

    get_load(req.params.lid).then(load => {
        if (load[0] === undefined || load[0] === null) {
        // The 0th element is undefined. This means there is no load with this id 
        res.setHeader('Content-Type', 'application/json');
        res.status(404).json({ 'Error': 'The specified load does not exist' });
        return;
        }
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if (!req.body.volume || !req.body.item || !req.body.creation_date){
            res.status(400).json({ 'Error': 'Must specify all attributes. Use PATCH to update individual attributes' });
            return;
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid))
            put_load(req.params.lid, req.body.volume, req.body.item, req.body.creation_date, load[0].carrier).then(key => { res.status(303).json('{ "id": ' + req.params.lid + ', \n"volume":  '+ JSON.stringify(req.body.volume) + ', \n"item": ' + JSON.stringify(req.body.item) + ', \n"creation_date": ' + req.body.creation_date + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid) + ' }') });
        }
    });
});

router.patch('/loads/:lid', function(req, res){ 
    
    get_load(req.params.lid).then(load => {
        if (load[0] === undefined || load[0] === null) {
        // The 0th element is undefined. This means there is no load with this id 
        res.setHeader('Content-Type', 'application/json');
        res.status(404).json({ 'Error': 'The specified load does not exist' });
        return;
        }
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.setHeader('Content-Type', 'application/json');
            res.status(406).send('Accept Header Not Acceptable');
            return;
        }
        if (!req.body.volume){
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid))
            put_load(req.params.lid, load[0].volume, req.body.item, req.body.creation_date, load[0].carrier).then(key => { res.status(200).json('{ "id": ' + req.params.lid + ', \n"volume":  '+ JSON.stringify(load[0].volume) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"length": ' + req.body.length + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid) + ' }') });
        }
        else if (!req.body.item){
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid))
            put_load(req.params.lid, req.body.volume, load[0].item, req.body.creation_date, load[0].carrier).then(key => { res.status(200).json('{ "id": ' + req.params.lid + ', \n"volume":  '+ JSON.stringify(req.body.volume) + ', \n"type": ' + JSON.stringify(req.body.type) + ', \n"volume": ' + load[0].volume + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid) + ' }') });
        }
        else if (!req.body.creation_date){
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid))
            put_load(req.params.lid, req.body.volume, req.body.item, load[0].creation_date, load[0].carrier).then(key => { res.status(200).json('{ "id": ' + req.params.lid + ', \n"volume":  '+ JSON.stringify(req.body.volume) + ', \n"creation_date": ' + JSON.stringify(load[0].creation_date) + ', \n"volume": ' + req.body.volume + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid) + ' }') });
        }
        else{
            res.setHeader('Content-Type', 'application/json');
            //res.setHeader('Location', (req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid))
            put_load(req.params.lid, req.body.volume, req.body.item, req.body.creation_date, load[0].carrier).then(key => { res.status(200).json('{ "id": ' + req.params.lid + ', \n"volume":  '+ JSON.stringify(req.body.volume) + ', \n"creation_date": ' + JSON.stringify(req.body.creation_date) + ', \n"volume": ' + req.body.volume + ', \n"self": ' + JSON.stringify(req.protocol + "://" + req.get("host") + req.baseUrl + "/loads/" + req.params.lid) + ' }') });
        }
    });
});




/* DELETE ROUTES*/
router.delete('/boats/:id', checkJwt, function (req, res) {
    get_boat(req.params.id).then(boat => {
        if (boat[0] === undefined || boat[0] === null) {
        // The 0th element is undefined. This means there is no boat with this id 
        res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
        return;
        }
        if(boat[0].owner != req.auth.sub){
            res.status(403).json({ 'Error': 'Incorrect owner - not authorized to view this resource' });
            return;
        }
        else {
            delete_boat(req.params.id).then(res.status(204).end());
        
        }
    });
    
});



router.delete('/loads/:id', function (req, res) {
    get_load(req.params.id).then(load => {
        if (load[0] === undefined || load[0] === null) {
        // The 0th element is undefined. This means there is no load with this id 
        res.status(404).json({ 'Error': 'No load with this load_id exists' });
        } else {
        // Return the 0th element which is the load with this id
        delete_load(req.params.id).then(res.status(204).end());
        }
    });
});


router.delete('/boats/:bid/loads/:lid', function (req, res) {
    get_load(req.params.lid).then(load => {
        if (load[0] === undefined || load[0] === null) {
        // The 0th element is undefined. This means there is no load with this id 
            res.status(404).json({ 'Error': 'The specified boat and/or load does not exist' });
            return;
        } 
    
        get_boat(req.params.bid).then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
            // The 0th element is undefined. This means there is no boat with this id 
            res.status(404).json({ 'Error': 'The specified boat and/or load does not exist' });
            return;
            }
            else{
                // put_boat_to_load(req.params.lid, req.params.bid, boat[0].name);
                // put_load_to_boat(req.params.lid, req.params.bid).then(res.status(204).end());
                remove_carrier(req.params.lid, req.params.bid);
                remove_load_from_boat(req.params.lid, req.params.bid).then(res.status(204).end());
            }
        });
    }); 
});

router.delete('/boats', function (req, res){
    res.set('Accept', 'GET, POST');
    res.setHeader('Content-Type', 'application/json');
    res.status(405).json({ 'Error': 'This request is not allowed to this route' });
});

// router.delete('/slips/:slipid/:boatid', function (req, res) {
//     get_slip(req.params.slipid).then(slip => {
//         if (slip[0] === undefined || slip[0] === null) {
//         // The 0th element is undefined. This means there is no slip with this id 
//             res.status(404).json({ 'Error': 'The specified boat and/or slip does not exist' });
//         } 
//         if (slip[0].current_boat){
//             res.status(403).json({ 'Error': 'The slip is not empty' });
//         }
//         console.log(slip[0].current_boat);
//     });
    
//     get_boat(req.params.id).then(boat => {
//         if (boat[0] === undefined || boat[0] === null) {
//         // The 0th element is undefined. This means there is no boat with this id 
//         res.status(404).json({ 'Error': 'No boat with this boat_id exists' });
//         } else {
//         // Return the 0th element which is the boat with this id
//         delete_boat(req.params.id).then(res.status(204).end());
//         }
//     });
    
// });

login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    var options = { method: 'POST',
            url: `https://${DOMAIN}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            body:
             { grant_type: 'password',
               username: username,
               password: password,
               client_id: CLIENT_ID,
               client_secret: CLIENT_SECRET },
            json: true };
    console.log(options);
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            console.log(response.body); // THIS IS THE JWT ACCESS TOKEN
            //res.redirect('/profile');
            res.send(body);
            //res.send(response.body.id_token);
        }
    });

});

app.get('/', function (req, res) {
   res.redirect('/profile');
});

const { requiresAuth } = require('express-openid-connect');
app.get('/profile', requiresAuth(), (req, res) => {
    const toJson = {
        "JWT Token": req.oidc.idToken,
        "User Unique ID": req.oidc.user.sub
    }

    get_users().then(users => {
        for (var i = 0; i < users.length; i++){
            if (users[i].uniqueID === req.oidc.user.sub){
                res.send( `<h1>${req.oidc.user.name} already exists in our database. Welcome back! Navigate to /logout to log out!</h1> <br/> <br/>`+ "User info: " + JSON.stringify(toJson));
                return;
            }
        }

        post_user(req.oidc.user.sub).then(user => {
            res.send( `<h1>Hello ${req.oidc.user.name}! You have been added to our database. Navigate to /logout to log out! </h1> <br/> <br/>`+ "User info: " + JSON.stringify(toJson) );
            return;
        });
       
    });

  });

/* ------------- End Controller Functions ------------- */
app.use('/', router);
app.use('/login', login);
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}...`);
});