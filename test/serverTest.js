const assert = require("chai").assert;
const request = require("request");
const fs = require("fs");
const path = require("path");

const config = require("../config/default");
const server = require("../server");

describe("Server tests", function() {
  let app;

  const smallFileName = "small.test";
  const bigFileName = "big.test";
  const smallFileTempPath = path.join(config.testPath, "temp/", smallFileName);
  const bigFileTempPath = path.join(config.testPath, "temp/", bigFileName);
  const smallFileSize = config.fileSizeLimit / 2;
  const bigFileSize = config.fileSizeLimit * 2;

  before(function(done) {
    app = server.listen(3000, done);

    if (config.fileSizeLimit > 1e7) {
      throw Error("Should not create very big test-files");
    }
    createTestFile(smallFileTempPath, smallFileSize);
    createTestFile(bigFileTempPath, bigFileSize);
  });

  after(function(done) {
    deleteTestFile(smallFileTempPath);
    deleteTestFile(bigFileTempPath);
    app.close(done);
  });

  describe("GET tests", function() {
    const smallFileServerPath = path.join(config.filesRoot, smallFileName);

    before(function() {
      copyTestFile(smallFileTempPath, smallFileServerPath);
    });

    after(function() {
      deleteTestFile(smallFileServerPath);
    });

    it("Should return index.html correctly", function(done) {
      request("http://localhost:3000/", function(error, response, body) {
        if (error) return done(error);

        const file = fs.readFileSync("public/index.html", {
          encoding: "utf-8"
        });
        assert.equal(body, file);

        done();
      });
    });

    it("Should return 404 for non-existing but valid filename", function(done) {
      request("http://localhost:3000/blablabla.test", function(
        error,
        response
      ) {
        if (error) return done(error);

        const expectedCode = 404;
        assert.equal(expectedCode, response.statusCode);

        done();
      });
    });

    it("Should return 400 for invalid filename", function(done) {
      request("http://localhost:3000/blablabla..test", function(
        error,
        response
      ) {
        if (error) return done(error);

        const expectedCode = 400;
        assert.equal(expectedCode, response.statusCode);

        done();
      });
    });

    it("Should return existing file correctly", function(done) {
      request("http://localhost:3000/small.test", function(
        error,
        response,
        body
      ) {
        if (error) return done(error);

        const smallFile = fs.readFileSync(smallFileServerPath);
        const expectedCode = 200;

        assert.equal(expectedCode, response.statusCode);
        assert.equal(body, smallFile);

        done();
      });
    });
  });

  describe("POST tests", function() {
    const reqOptions = {
      url: "http://localhost:3000/" + bigFileName,
      method: "POST"
    };

    it("Should not upload big file", function(done) {
      const bigFile = new fs.ReadStream(bigFileTempPath);

      bigFile.pipe(
        request(reqOptions, function(error, response) {
          if (error) return done(error);

          const expectedCode = 413;
          assert.equal(response.statusCode, expectedCode);

          done();
        })
      );
    });
  });
});

const createTestFile = (path, size) => fs.writeFileSync(path, new Buffer(size));

const deleteTestFile = path => fs.unlinkSync(path);

const copyTestFile = (from, to) =>
  fs.createReadStream(from).pipe(fs.createWriteStream(to));
