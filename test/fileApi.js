const rewire = require("rewire");
const assert = require("chai").assert;

const fileApi = rewire("../api/fileApi");

describe("getPath", function() {
  
  const getPath = fileApi.__get__("getPath");

  it("Should return only the path", function() {
    const inputUrl = "http://www.abc.com/x/y/z/something";
    const expectedPath = "/x/y/z/something";

    const path = getPath(inputUrl);

    assert.equal(path, expectedPath);
  });

});

describe("isValidFileName", function() {
  
  const isValidFilename = fileApi.__get__("isValidFilename");

  it("Should not include any '/' ", function() {
    const filename = "x/y";
    assert.isFalse(isValidFilename(filename));
  });

  it("Should not include any '..' ", function() {
    const filename = "x..y";
    assert.isFalse(isValidFilename(filename));
  });

  it("Should not be empty", function() {
    const filename = "";
    assert.isFalse(isValidFilename(filename));
  });

});