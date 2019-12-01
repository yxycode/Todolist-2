const MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const jwt = require('jsonwebtoken');

const url = 'mongodb://localhost:27017/';
const dbName = 'todolistdatabase';
const collectionUsers = 'users';
const collectionLists = 'todolists'; 
const jwtSecret = 'todolistsecret';
let database, databaseObj;

exports.init = init;
exports.createUserRequest = createUserRequest; 
exports.loginRequest = loginRequest;
exports.upsertTodoListRequest = upsertTodoListRequest; 
exports.deleteTodoListRequest = deleteTodoListRequest;
exports.retrieveTodoListsRequest = retrieveTodoListsRequest;

function generateToken(username){
  return jwt.sign({username: username}, jwtSecret, {expiresIn: '24h'});
}

function validateToken(request, callback){
  let token = request.headers['x-access-token'] || request.headers['authorization']; 
  if(token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
    if(token){
      jwt.verify(token, jwtSecret, (err, decoded) => {
        if(err){
          callback({isSuccess: false, message: 'Invalid token.'});
        } 
        else {
          request.decoded = decoded;
          callback({isSuccess: true});
        }
      });        
    }
  }    
}

function createUserRequest(request, callback){
  const email = request.body.email;
  const username = request.body.username;
  const password = request.body.password;
  createUserRecord({email: email, username: username, password: password}, callback);
}

function loginRequest(request, callback){
  const username = request.body.username;
  const password = request.body.password;
  
  findRecords(collectionUsers, {username: username, password: password}, function(result){
    if(result.isSuccess && result.result.length === 1){
      callback({isSuccess: true, token: generateToken(username)});
    }
    else {
      callback({isSuccess: false, result: result});
    }
  });
}

function upsertTodoListRequest(request, callback){
  validateToken(request, function(result){
    if(result.isSuccess){
      let decodedUserName = request.decoded.username;
      let todoList = request.body.todoList;
      upsertTodoList(decodedUserName, todoList, callback)
    }
    else {
      callback({isSuccess: false});
    }
  });
} 

function deleteTodoListRequest(request, callback){
  validateToken(request, function(result){
    if(result.isSuccess){
      const decodedUserName = request.decoded.username;
      const todoList = request.body.todoList;    
      deleteTodoList(decodedUserName, todoList,function(result){
        callback({isSuccess: true, result: result.result});
      });
    }
    else {
      callback({isSuccess: false});
    }
  });    
}

function retrieveTodoListsRequest(request, callback){
  validateToken(request, function(result){
    if(result.isSuccess){
      const decodedUserName = request.decoded.username;
      retrieveTodoLists(decodedUserName, function(result){
        callback({isSuccess: true, result: result.result});
      });
    }
    else {
      callback({isSuccess: false});
    }
  });    
}

function init(callback){
  loginMongoDB(function(result){
    createCollection(collectionUsers, function(result){
      createCollection(collectionLists, callback);
    });
  });
}

function createUserRecord(userObj, callback){
  const userObj2 = {
    email: userObj.email,
    username: userObj.username,
    password: userObj.password
  };
  const queryObj = { $or:[
    { email: userObj.email },
    { username: userObj.username }
  ]};
  findRecords(collectionUsers, queryObj, function(result){
    if(result && result.result.length == 0){
      insertRecord(collectionUsers, userObj2, function(){
        callback({success: true});
      });   
    }
    else {
      const errorObj = {success: false, errors: []};
      for(let i = 0; i < result.length; i++){
        if(result[i].email == queryObj.email){
          errorObj.errors.push('This email is already taken.');
        }
        if(result[i].username == queryObj.username){
          errorObj.errors.push('This username is already taken.');
        }
      }
      callback(errorObj);
    } 
  });

}

function upsertTodoList(userName, todoList, callback){
  const todoList2 = {
    userName: userName,
    todoListName: todoList.todoListName,
    todoListItems: []
  };
  for(let i = 0; i < todoList.todoListItems.length; i++){
    todoList2.todoListItems.push(todoList.todoListItems[i]);
  }
  if(todoList._id){
    updateRecord(collectionLists, {_id:  ObjectID(todoList._id)}, todoList2, callback)
  }
  else {
    insertRecord(collectionLists, todoList2, callback);
  }
}

function deleteTodoList(userName, todoList, callback){
  const queryObj = {
    userName: userName,
    todoListName: todoList.todoListName
  };
  if(todoList._id){
    deleteRecord(collectionLists, {_id:  ObjectID(todoList._id)}, callback);
  }  
  else{
    deleteRecord(collectionLists, queryObj, callback);
  }
}

function retrieveTodoLists(userName, callback){
  const queryObj = {
    userName: userName
  };
  findRecords(collectionLists, queryObj, callback);
}

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
    callback({isSuccess: true, result: result});
  });
}

function insertRecord(collectionName, newRecord, callback){
  databaseObj.collection(collectionName).insertOne(newRecord, function(err, result){
    handleError(err);
    callback({isSuccess: true, result: result});
  });
}

function insertRecords(collectionName, newRecords, callback){
  databaseObj.collection(collectionName).insertOne(newRecord, function(err, result){
    handleError(err);
    callback({isSuccess: true, result: result});
  });    
}

function updateRecord(collectionName, queryObj, updatedRecord, callback){
  databaseObj.collection(collectionName).updateOne(queryObj, {$set: updatedRecord }, function(err, result){
    handleError(err);
    callback({isSuccess: result.result.nModified > 0, result: result});
  });    
}

function deleteRecord(collectionName, queryObj, callback){
  databaseObj.collection(collectionName).deleteOne(queryObj, function(err, result){
    handleError(err);
    callback({isSuccess: true, result: result});
  });    
}

function deleteRecords(collectionName, queryObj, callback){
  databaseObj.collection(collectionName).deleteMany(queryObj, function(err, result){
    handleError(err);
    callback({isSuccess: result.result.deletedCount > 0, result: result});
  });      
}

function findRecords(collectionName, queryObj, callback){
  databaseObj.collection(collectionName).find(queryObj).toArray(function(err, result){
    handleError(err);
    callback({isSuccess: true, result: result});
  });    
}




