//const should = require('should');
// should(process.env.NODE_ENV).eql('test');

const sendRequest = require("request-promise").defaults({
  encoding: null,
  resolveWithFullResponse: true,
  simple: false
});

const should = require("should");
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

  const smallFileTempPath = path.join(
    config.testRoot,
    "fixtures/",
    smallFileName
  );

  const smallFileServesendRequestath = path.join(
    config.filesRoot,
    smallFileName
  );

  before(function(done) {
    checkFileSizeLimit();

    createSmallFile();
    createBigFile();

    app = server.listen(3000, done);
  });

  beforeEach(function() {
    fs.emptyDirSync(config.filesRoot);
  });

  after(function(done) {
    clearFixtures();
    app.close(done);
  });

  describe("GET method", function() {
    context("when index.html requested", function() {
      it("should return it correctly with 200 OK", async function() {
        const file = fs.readFileSync(`${config.publicRoot}/index.html`);
        const response = await sendRequest(host);

        response.statusCode.should.be.equal(200);
        response.body.equals(file).should.be.true();
      });
    });

    context("otherwise when file exists", function() {
      beforeEach(function() {
        fs.copySync(
          `${config.testRoot}/fixtures/small.test`,
          `${config.filesRoot}/small.test`
        );
      });

      it("should return it correctly with 200 OK", async function() {
        const file = fs.readFileSync(`${config.filesRoot}/small.test`);
        const response = await sendRequest(`${host}/small.test`);

        response.statusCode.should.be.equal(200);
        response.body.equals(file).should.be.true();
      });
    });

    context("otherwise when file doesn't exist", function() {
      it("should return 404 for non-existing but valid filename", async function() {
        const response = await sendRequest(`${host}/blablabla.test`);
        response.statusCode.should.be.equal(404);
      });

      it("Should return 400 for invalid filename", async function() {
        const response = await sendRequest(`${host}/blablabla..test`);
        response.statusCode.should.be.equal(400);
      });
    });
  });

  describe("POST method", function() {
    context("when file is already exists on server", function() {
      beforeEach(function() {
        fs.copySync(
          `${config.testRoot}/fixtures/small.test`,
          `${config.filesRoot}/small.test`
        );
      });

      it("should forbid to upload and return 409", async function() {
        const request = sendRequest.post(`${host}/small.test`);
        const { mtime } = fs.statSync(`${config.filesRoot}/small.test`);

        fs
          .createReadStream(`${config.testRoot}/fixtures/small.test`)
          .pipe(request);

        const response = await request;
        const { mtime: newMtime } = fs.statSync(
          `${config.filesRoot}/small.test`
        );

        response.statusCode.should.be.equal(409);
        fs.readdirSync(`${config.filesRoot}`).length.should.be.equal(1);
        mtime.should.eql(newMtime);
      });
    });

    context("otherwise", function() {
      it("should forbid to upload big file and return 413", async function() {
        const request = sendRequest.post(`${host}/big.test`);
        fs
          .createReadStream(`${config.testRoot}/fixtures/big.test`)
          .pipe(request);
        let response;

        try {
          response = await request;
        } catch (err) {
          // see ctx for description https://github.com/nodejs/node/issues/947#issue-58838888
          // there is a problem in nodejs with it
          if (err.cause && err.cause.code == "EPIPE") return;

          throw err;
        }

        fs.readdirSync(config.filesRoot).should.be.empty();
        response.statusCode.should.be.equal(413);
      });

      it("should upload small file correctly with 200 OK", async function() {
        const request = sendRequest.post(`${host}/small.test`);
        fs
          .createReadStream(`${config.testRoot}/fixtures/small.test`)
          .pipe(request);

        const response = await request;

        response.statusCode.should.be.equal(200);
      });

      
    });
  });

  describe("DELETE tests", function() {
    it("Should delete if file exists", function(done) {
      copyTestFile(smallFileTempPath, smallFileServesendRequestath);

      const reqOptions = {
        url: "http://localhost:3000/" + smallFileName,
        method: "DELETE"
      };

      request(reqOptions, function(error, response) {
        if (error) return done(error);

        const expectedCode = 200;
        assert.equal(response.statusCode, expectedCode);
        const stillExists = fs.existsSync(smallFileServesendRequestath);

        assert.isFalse(stillExists);

        if (stillExists) {
          fs.unlinkSync(smallFileServesendRequestath);
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

        const exists = fs.existsSync(smallFileServesendRequestath);
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
};

const createSmallFile = () => {
  const fileSize = 1;
  const filePath = `${config.testRoot}/fixtures/small.test`;
  fs.writeFileSync(filePath, Buffer.alloc(fileSize));
};

const createBigFile = () => {
  const fileSize = config.fileSizeLimit + 1;
  const filePath = `${config.testRoot}/fixtures/big.test`;
  fs.writeFileSync(filePath, Buffer.alloc(fileSize));
};

const clearFixtures = () =>
  fs.emptyDirSync(path.join(config.testRoot, "fixtures/"));

const deleteTestFile = path => fs.unlinkSync(path);

const copyTestFile = (from, to) =>
  fs.createReadStream(from).pipe(fs.createWriteStream(to));
