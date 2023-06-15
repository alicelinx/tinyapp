const getUserByEmail = function(email, database) {
  let user = null;
  for (const userID in database) {
    if (database[userID].email === email) {
      user = database[userID];
    }
  }
  return user;
};

module.exports = { getUserByEmail };