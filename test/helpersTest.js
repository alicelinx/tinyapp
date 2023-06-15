const { assert } = require('chai');
const { getUserByEmail } = require('../helpers');

let testUsers = {
  N12m34: {
    id: "N12m34",
    email: "a@ca",
    password: "$2a$10$KXD.WHYBXVctxitM9IZC..xYYaE9uE9FL1kAXhVmV4XqRu31zxeCK", // 1111
  },
  Ab34c2: {
    id: "Ab34c2",
    email: "b@ca",
    password: "$2a$10$H.YsenE5/rWh0c.F9uVoIuHkxRpM/LrhEGQJRstyW1FSWw777sryO", // 1111
  },
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail('a@ca', testUsers);
    const expectedUserID = 'N12m34';
    assert.equal(user.id, expectedUserID);
  });

  it('returns undefined if email is non-existent', function() {
    const user = getUserByEmail('c@ca', testUsers);
    assert.equal(user, undefined);
  });
});
