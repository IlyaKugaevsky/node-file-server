//const should = require('should');
// should(process.env.NODE_ENV).eql('test');

const rp = require('request-promise').defaults({
  encoding: null,
  resolveWithFullResponse: true
});

const should = require('should');
const fs = require("fs-extra");

const config = require("../../config/default");
const server = require("../../server");

const request = require("request");
const path = require("path");

const smallFileName = "small.test";
const bigFileName = "big.test";

const host = "http://127.0.0.1:3000";

describe("Server tests", function() {
  let app;

  // const mochaAsync = function(fn) {
  //   return async function (done) {
  //     try {
  //       await fn();
  //       done();
  //     } catch (err) {
  //       done(err);
  //     }
  //   };
  // };

  const smallFileTempPath = path.join(config.testRoot, "fixtures/", smallFileName);
  const bigFileTempPath = path.join(config.testRoot, "fixtures/", bigFileName);

  const smallFileServerPath = path.join(config.filesRoot, smallFileName);

  before(function(done) {
    app = server.listen(3000, done);

    checkFileSizeLimit();

    createSmallFile();
    createBigFile();
  });

  after(function(done) {
    app.close(done);
    clearFixtures();
  });

  describe("GET method", function() {
    before(function() {
      copyTestFile(smallFileTempPath, smallFileServerPath);
    });

    after(function() {
      deleteTestFile(smallFileServerPath);
    });

    context("when index.html requested", function() {
      it("should return correctly", async function() {
        const file = fs.readFileSync("public/index.html");

        const response = await rp(`${host}/`);

        response.body.equals(file).should.be.true();
        
        
      }); 
    });

    context("when file exists", function() {
      beforeEach(function() {

      });
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
          
          if (error) {
            // see this for description https://github.com/nodejs/node/issues/947#issue-58838888
            // there is a problem in nodejs with it
            if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
              fs.existsSync(config.get('filesRoot') + '/big.png').should.be.false();
              return done();
            } else {
              return done(error);
            }
          }

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

//const createTestFile = (path, size) => fs.writeFileSync(path, new Buffer(size));

const checkFileSizeLimit = () => {
  if (config.fileSizeLimit > 1e7) 
    throw Error("Should not create very big test-files");
}

const createSmallFile = () => {
  const fileSize = 1;
  const filePath = `${config.testRoot}/fixtures/small.test`;
  fs.writeFileSync(filePath, Buffer.alloc(fileSize));
}

const createBigFile = () => {
  const fileSize = config.fileSizeLimit + 1;
  const filePath = `${config.testRoot}/fixtures/big.test`;
  fs.writeFileSync(filePath, Buffer.alloc(fileSize));
}

const clearFixtures = () => 
  fs.emptyDirSync(path.join(config.testRoot, "fixtures/"));



const deleteTestFile = path => fs.unlinkSync(path);

const copyTestFile = (from, to) =>
  fs.createReadStream(from).pipe(fs.createWriteStream(to));
