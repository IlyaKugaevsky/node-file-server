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
  const smallFileTempPath = path.join(config.testRoot, "temp/", smallFileName);
  const bigFileTempPath = path.join(config.testRoot, "temp/", bigFileName);
  const smallFileSize = Math.min(10, config.fileSizeLimit);
  const bigFileSize = config.fileSizeLimit + 1;
  const smallFileServerPath = path.join(config.filesRoot, smallFileName);

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
    it("Should not upload big file", function(done) {
      const bigFile = new fs.ReadStream(bigFileTempPath);

      const reqOptions = {
        url: "http://localhost:3000/" + bigFileName,
        method: "POST"
      };

      bigFile.pipe(
        request(reqOptions, function(error, response) {
          if (error) return done(error);

          const expectedCode = 413;
          assert.equal(response.statusCode, expectedCode);

          done();
        })
      );
    });

    it("Should upload small file correctly", function(done) {
      const smallFile = fs.readFileSync(smallFileTempPath);
      const fileStream = new fs.ReadStream(smallFileTempPath);

      const reqOptions = {
        url: "http://localhost:3000/" + smallFileName,
        method: "POST"
      };

      fileStream.pipe(
        request(reqOptions, function(error, response) {
          if (error) return done(error);

          const expectedCode = 200;
          const uploadedFile = fs.readFileSync(smallFileServerPath);
          assert.equal(response.statusCode, expectedCode);
          assert.equal(uploadedFile.toString(), smallFile.toString());

          fs.unlinkSync(smallFileServerPath);
          done();
        })
      );
    });

    it("Should detect if file is already exists", function(done) {
      copyTestFile(smallFileTempPath, smallFileServerPath);
      const fileStream = new fs.ReadStream(smallFileTempPath);

      const reqOptions = {
        url: "http://localhost:3000/" + smallFileName,
        method: "POST"
      };

      fileStream.pipe(
        request(reqOptions, function(error, response) {
          if (error) return done(error);

          const expectedCode = 409;
          assert.equal(response.statusCode, expectedCode);

          fs.unlinkSync(smallFileServerPath);
          done();
        })
      );
    });
  });

  describe("DELETE tests", function() {
    it("Should delete if file exists", function(done) {
      copyTestFile(smallFileTempPath, smallFileServerPath);

      const reqOptions = {
        url: "http://localhost:3000/" + smallFileName,
        method: "DELETE"
      };

      request(reqOptions, function(error, response) {
        if (error) return done(error);

        const expectedCode = 200;
        assert.equal(response.statusCode, expectedCode);
        const stillExists = fs.existsSync(smallFileServerPath);

        assert.isFalse(stillExists);

        if (stillExists) {
          fs.unlinkSync(smallFileServerPath);
        }

        done();
      });
    });

    it("Should return 404 if file doesn't exist", function(done) {
      const reqOptions = {
        url: "http://localhost:3000/" + smallFileName,
        method: "DELETE"
      };

      request(reqOptions, function(error, response) {
        if (error) return done(error);

        const exists = fs.existsSync(smallFileServerPath);
        const expectedCode = 404;
        assert.isFalse(exists);
        assert.equal(response.statusCode, expectedCode);

        done();
      });
    });
  });
});

const createTestFile = (path, size) => fs.writeFileSync(path, new Buffer(size));

const deleteTestFile = path => fs.unlinkSync(path);

const copyTestFile = (from, to) =>
  fs.createReadStream(from).pipe(fs.createWriteStream(to));
