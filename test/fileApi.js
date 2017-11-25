const rewire = require("rewire");
const assert = require("assert");

const fileApi = rewire("../api/fileApi");

describe("getPath", function() {
  
  const getPath = fileApi.__get__("getPath");

  it("Should return path correctly", function() {
    const inputUrl = "http://www.abc.com/x/y/z/something";
    const expectedPath = "/x/y/z/something";
    assert.equal(getPath(inputUrl), expectedPath);
  });

});
