const rewire = require("rewire");
const assert = require("chai").assert;

const fileApi = rewire("../api/fileApi");

describe("server", function() {
    
    const getPath = fileApi.__get__("getPath");
  
    it("Should return only the path", function() {
      const inputUrl = "http://www.abc.com/x/y/z/something";
      const expectedPath = "/x/y/z/something";
  
      const path = getPath(inputUrl);
  
      assert.equal(path, expectedPath);
    });
  
  });