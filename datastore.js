const {Datastore} = require('@google-cloud/datastore');
const projectId = 'cs493project4-385503';

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore({projectId:projectId});
module.exports.fromDatastore = function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}