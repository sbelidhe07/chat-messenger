

// Join user to chat
function userJoin(id, username, room,myCache) {
 const user = { id, username, room };
 obj = { username: username, room: room };
 
 const success = myCache.set( id, JSON.stringify(obj), 10000 );  

  return user;
}

// Get current user
function getCurrentUser(id,myCache) {
  const users = getUsers(myCache);
  console.log(users);
  console.log(id);
  console.log(users.find(user => user.id === id));
  return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id,myCache) {
 const users = getUsers(myCache);
  myCache.del(id);
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room,myCache) {
  const users = getUsers(myCache);
  return users.filter(user => user.room === room);
}

function getUsers(myCache) {
const users = [];
mykeys = myCache.keys();
mykeys.forEach(element => {
  var data = JSON.parse(myCache.get(element));
  const username = data.username;
  const room = data.room; 
  const id = element;
  const user = {id,username,room};
  users.push(user);
});
return users;
} 

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
};
