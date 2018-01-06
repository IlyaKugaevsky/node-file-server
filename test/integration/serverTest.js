// should(process.env.NODE_ENV).eql('test');

const sendRequest = require("request-promise").defaults({
  encoding: null,
  resolveWithFullResponse: true,
  simple: false
});

const Readable = require("stream").Readable;
const fs = require("fs-extra");

const config = require("../../config/default");
const server = require("../../server");

const host = "http://127.0.0.1:3000";
let app;

describe("Server tests", function() {

  before(function(done) {
    if (config.fileSizeLimit > 1e7)
      throw Error("Should not create very big test-files");
      
    createSmallFile();
    createBigFile();
    app = server.listen(3000, done);
  });

  beforeEach(function() {
    fs.emptyDirSync(config.filesRoot);
  });

  after(function(done) {
    fs.emptyDirSync(`${config.testRoot}/fixtures/`);
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

      it("should upload zero-size file", async function() {
        const request = sendRequest.post(`${host}/small.png`);
        const stream = new Readable();

        stream.pipe(request);
        stream.push(null);

        const response = await request;

        response.statusCode.should.be.equal(200);
        fs.statSync(`${config.filesRoot}/small.png`).size.should.equal(0);
      });
    });
  });

  describe("DELETE method", function() {
    context("when file exists", function() {
      beforeEach(function() {
        fs.copySync(
          `${config.testRoot}/fixtures/small.test`,
          `${config.filesRoot}/small.test`
        );
      });
      it("should delete it correctly with 200 OK", async function() {
        const request = sendRequest.delete(`${host}/small.test`);

        let response;
        try {
          response = await request;
        } catch (err) {
          fs.emptyDirSync(config.filesRoot);
          throw err;
        }

        response.statusCode.should.be.equal(200);
        fs.existsSync(`${config.filesRoot}/small.test`).should.be.false();
      });
    });

    context("when file doesn't exist", function() {
      it("should return 404", async function() {
        const request = sendRequest.delete(`${host}/blablabla.test`);

        const response = await request;

        fs.readdirSync(`${config.filesRoot}`).should.be.empty();
        response.statusCode.should.be.equal(404);
      });
    });
  });
});

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
