const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

exports.handler = async (event) => {
  try {
    if (event.requestContext.http.method === "GET") {
      const { short_url } = event.queryStringParameters;

      if (!short_url.length)
        return {
          statusCode: 400,
          body: "Short url cannot be empty ",
        };

      let resp = await dynamodb
        .getItem({
          TableName: "shortner",
          Key: {
            short_url: { S: short_url },
          },
        })
        .promise();

      if (resp.Item === undefined) {
        return {
          statusCode: 400,
          body: "Opps! its not here.Please create short Url for this Url",
        };
      }

      return {
        statusCode: 302,
        headers: {
          location: `${resp.Item.long_url.S}`,
        },
      };
    }
    if (event.requestContext.http.method === "POST") {
      console.log("body", event.body);
      let encodedImage = event.body;
      let decodedImage = Buffer.from(encodedImage, "base64");

      let key = `${Math.floor(Math.random() * 1000 + 1)}.jpeg`;
      const long_url = `https://s3.amazonaws.com/bucket.image.my/${key}`;

      const params = {
        Bucket: "bucket.image.my",
        Key: key,
        Body: decodedImage,
        ContentType: "image/jpeg",
      };

      const uploading = await s3.putObject(params).promise();

      let response = await dynamodb
        .putItem({
          TableName: "shortner",
          Item: {
            short_url: { S: key },
            long_url: { S: long_url },
          },
        })
        .promise();

      return {
        short_url: `https://5982qhutyh.execute-api.us-east-1.amazonaws.com/BucketImage/bucketImage?short_url=${key}`,
      };
    }
  } catch (err) {
    console.log(err);
    return err;
  }
};
