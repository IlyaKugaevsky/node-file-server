const rewire = require("rewire");
const assert = require("chai").assert;

const fileApi = rewire("../../api/fileApi");

describe("getPath", function() {
  
  const getPath = fileApi.__get__("getPath");

  it("Should return only the path", function() {
    const inputUrl = "http://www.abc.com/x/y/z/something";
    const expectedPath = "/x/y/z/something";

    const path = getPath(inputUrl);

    assert.equal(path, expectedPath);
  });

});

describe("getFilename", function() {
  
  const getFilename = fileApi.__get__("getFilename");

  it("Should return filename correctly", function() {
    const inputUrl = "http://www.abc.com/something.xyz";
    const expectedFilename = "something.xyz";

    const filename = getFilename(inputUrl);

    assert.equal(filename, expectedFilename);
  });

});

describe("isValidFileName", function() {
  
  const isValidFilename = fileApi.__get__("isValidFilename");

  it("Should not pass any '/' ", function() {
    const filename = "x/y";
    assert.isFalse(isValidFilename(filename));
  });

  it("Should not pass any '..' ", function() {
    const filename = "x..y";
    assert.isFalse(isValidFilename(filename));
  });

  it("Should not pass empty string", function() {
    const filename = "";
    assert.isFalse(isValidFilename(filename));
  });

  it("Should pass valid filenames", function() {
    const filename = "blablabla.test";
    assert.isTrue(isValidFilename(filename));
  });

});