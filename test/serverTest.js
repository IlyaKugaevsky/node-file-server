const assert = require("chai").assert;
const request = require("request");
const fs = require("fs");
const path = require("path");

const config = require("../config/default");
const server = require("../server");

describe("Server tests", function() {
  let app;

  const smallFilePath = path.join(config.testPath, "temp/small.test");
  const bigFilePath = path.join(config.testPath, "temp/big.test");
  const smallFileSize = config.fileSizeLimit / 2;
  const bigFileSize = config.fileSizeLimit * 2;

  before( function(done) {
    app = server.listen(3000, done);

    if (config.fileSizeLimit > 1e7) {
      throw Error("Should not create very big test-files");
    }
    createTestFile(smallFilePath, smallFileSize);
    createTestFile(bigFilePath, bigFileSize);
  });

  after(function(done) {
    deleteTestFile(smallFilePath);
    deleteTestFile(bigFilePath);
    app.close(done);
  });


  it("Should return index.html", function(done) {
    request("http://localhost:3000", function(error, response, body) {
      if (error) return done(error);

      const file = fs.readFileSync("public/index.html", { encoding: "utf-8" });
      assert.equal(body, file);

      done();
    });
  });

  it("Should return 404 for non-existing but valid filename", function(done) {
    request("http://localhost:3000/blablabla.test", function(error, response) {
      if (error) return done(error);

      const expectedCode = 404;
      assert.equal(expectedCode, response.statusCode);

      done();
    });
  });

  it("Should return 400 for invalid filename", function(done) {
    request("http://localhost:3000/blablabla..test", function(error, response) {
      if (error) return done(error);

      const expectedCode = 400;
      assert.equal(expectedCode, response.statusCode);

      done();
    });
  });
});

const createTestFile = (path, size) => {
  fs.writeFileSync(path, new Buffer(size));
};

const deleteTestFile = path => {
  fs.unlinkSync(path);
};
