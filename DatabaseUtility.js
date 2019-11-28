const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/';
const dbName = 'todolistdatabase';
const collectionUsers = 'users';
const collectionLists = 'todolists'; 
let database, databaseObj;

function handleError(err){
  if(err){
    throw err;
  }
}

function loginMongoDB(callback){
  MongoClient.connect(url + dbName, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db){
    handleError(err);
    database = db;
    databaseObj = database.db(dbName);
    console.log(`Database ${dbName} created.`);
    callback();
  });    
}

function createCollection(collectionName, callback){
  databaseObj.createCollection(collectionName, function(err, result){
    handleError(err);
    console.log(`Collection ${collectionName} created.`);
    callback(result);
  });
}

function insertRecord(collectionName, newRecord, callback){
  databaseObj.collection(collectionName).insertOne(newRecord, function(err, result){
    handleError(err);
    callback(result);
  });
}

function insertRecords(collectionName, newRecords, callback){
  databaseObj.collection(collectionName).insertOne(newRecord, function(err, result){
    handleError(err);
    callback(result);
  });    
}

function updateRecord(collectionName, queryObj, updatedRecord, callback){
  databaseObj.collection(collectionName).update(queryObj, updatedRecord, function(err, result){
    handleError(err);
    callback(result);
  });    
}

function deleteRecord(collectionName, queryObj, callback){
  databaseObj.collection(collectionName).deleteOne(queryObj, function(err, result){
    handleError(err);
    callback(result);
  });    
}

function deleteRecords(collectionName, queryObj, callback){
  databaseObj.collection(collectionName).deleteMany(queryObj, function(err, result){
    handleError(err);
    callback(result);
  });      
}

function findRecords(collectionName, queryObj, callback){
  databaseObj.collection(collectionName).find(queryObj).toArray(function(err, result){
    handleError(err);
    callback(result);
  });    
}




