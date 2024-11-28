

# webapp
Developer - Ruthvik Garlapati
NUID - 002727922
Steps to Run the project
## CSYE6225- Network Structures and Cloud Computing

Project description

Create a web application using a technology stack that meets Cloud-Native Web Application Requirements.

## Frameworks and third party libraries:

Packages required to run:
- Express
- Dotenv
- Nodemon
- Pg, pg-hstore
- Sequelize
- Cors
- Chai
- Mocha
- Spec
- Jest
- Supertest
- Bcrypt
- Moment
  
```
npm i --save express dotenv nodemon pg pg-hstore sequelize cors chai mocha spec jest supertest bcrypt moment
```

## Prerequisites for building and deploying application locally:


```javascript
// install dependencies
```
npm i --save

// start the server
npm start

// run test cases
npm test
```
```

## Endpoint URLs

### Users

```javascript
// 1. GET route to check server health
GET /healthz

// 2. GET route to retrieve user details
GET /v1/user/{userId}

// 3. POST route to add a new user to database
POST /v1/user

// 4. PUT route to update user details
PUT /v1/user/{userId}
```

### Products

```javascript
// 1. POST route to check server health
GET /v1/product

// 2. GET route to retrieve product details
GET /v1/product/{productId}

// 3. PUT route to update product details
GET /v1/product/{productId}

// 4. PATCH route to update product details
GET /v1/product/{productId}

// 5. DELETE route to delete user details
PUT /v1/product/{productId}
```


## Users Schema
### Sample JSON Request for POST


```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe@example.com",
  "password": "password"
}
```

### Sample JSON Response for GET
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "jane.doe@example.com",
  "account_created": "2016-08-29T09:12:33.001Z",
  "account_updated": "2016-08-29T09:12:33.001Z"
}
```

## Products Schema
### Sample JSON Request for POST
```json
{
  "name": "name",
  "description": "desc",
  "sku": "skew",
  "manufacturer": "manuf",
  "quantity": 10
}
```

### Sample JSON Response for GET
```json
{
  "id": 1,
  "name": "name",
  "description": "desc",
  "sku": "skew",
  "manufacturer": "manuf",
  "quantity": 1,
  "date_added": "2016-08-29T09:12:33.001Z",
  "date_last_updated": "2016-09-29T09:12:33.001Z",
  "owner_user_id": 1
}
```

## Endpoint URLs for Images Schema
<a href = "https://app.swaggerhub.com/apis-docs/csye6225-webapp/cloud-native-webapp/spring2023-a5">Swagger v02</a>``` JavaScript
//POST Method URL for images
/v1/product/{product_id}/image
//GET Method URL for List of all images
/v1/product/{product_id}/image
//GET Method URL for a single image
/v1/product/{product_id}/image/{image_id}
//DELETE Method URL for image
/v1/product/{product_id}/image/{image_id}
```
## Sample JSON Request for GET Method
``` JSON
{
    "image_id": 1,
    "product_id": 1,
    "file_name": "IMAGE_2023-03-01T02:08:54.5454.jpg",
    "date_created": "2023-03-01T02:08:55.5555",
    "s3_bucket_path": "https://example-bucket.s3.amazonaws.com/example.jpg"
}
```
## Sample JSON Response for GET All Method
``` JSON
[
  {
    "image_id": 1,
    "product_id": 1,
    "file_name": "IMAGE_2023-03-01T02:08:54.5454.jpg",
    "date_created": "2023-03-01T02:08:55.5555",
    "s3_bucket_path": "https://example-bucket.s3.amazonaws.com/example1.jpg"
  },
  {
    "image_id": 2,
    "product_id": 1,
    "file_name": "IMAGE_2023-03-01T02:08:54.5454.jpg",
    "date_created": "2023-03-01T02:08:55.5555",
    "s3_bucket_path": "https://example-bucket.s3.amazonaws.com/example2.jpg"
  },
  {
    "image_id": 3,
    "product_id": 1,
    "file_name": "IMAGE_2023-03-01T02:08:54.5454.jpg",
    "date_created": "2023-03-01T02:08:55.5555",
    "s3_bucket_path": "https://example-bucket.s3.amazonaws.com/example3.jpg"
  }
]
```
