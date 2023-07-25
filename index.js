'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    // download images.json if it exists
    let images = [];
    try {
        const data = await s3.getObject({ Bucket: bucket, Key: 'images.json' }).promise();
        images = JSON.parse(data.Body.toString());
    } catch (err) {
        console.log('No images.json file found. Creating a new one.');
    }

    // Create --> metadata object for the uploaded image
    const imageMetadata = {
        name: key,
        size: event.Records[0].s3.object.size,
        type: event.Records[0].s3.object.contentType,
        //here we can  Add any other metadata we want to include
    };

    // this to Check if the image name already exists in images.json or not
    const existingIndex = images.findIndex((image) => image.name === key);
    if (existingIndex !== -1) {
        // If the image name exists,then  update the object in the array
        images[existingIndex] = imageMetadata;
    } else {
        // If the image name does not exist, add the new image metadata to the array
        images.push(imageMetadata);
    }

    // Upload the updated images.json file back to the S3 bucket
    await s3.putObject({
        Bucket: bucket,
        Key: 'images.json',
        Body: JSON.stringify(images),
        ContentType: 'application/json',
    }).promise();

    return {
        statusCode: 200,
        body: JSON.stringify('Image processed successfully.'),
    };
};