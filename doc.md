<!--

1. error handling
2. aggregation pipeline
3. the working of JWT
4. postman setup
5. implement maximum login attempts
6. Virtual populate
7. merge params
8. Calculations

 -->

## Links used

- https://mailtrap.io/inboxes/1621180/messages

### API

1. API(Application Programming Interface) is the piece of software that can by another piece of software, in order to allow the applications to talk to each other.

## REST ARCHITECTURE

- Separate API into logical resources
- Expose structured, resource-based URLS: this means to make an application accessible to the clients.
- Use HTTP methods: No verbs like:

  - (GET -> getTours), instead use (GET -> tours)
  - addNewTour -> POST -> tours
  - updateTour -> PUT -> tours/7
  - getTourByUser -> GET -> users/3/tours

- Send data as JSON using "JSend"
- Be stateless: All state must be handled on the client. This means that each request must contain all the information necessary to process a certain request. The server should not have to remember the previous requests.

## Request-response cycle together with middlewares

It goes like this: request/response object -> middleware(next()) -> response

Middlewares are there for the processing of data. For, example parsing body(json()), adding headers, logging,..

Routes are also middlewares

N.B: Middlewares are called before the request-response cycle ends, otherwise no result from them will be seen.

## Environment variables

### MONGODB

## Features

- Document based: field-value data structure
- Scalable: very easy to distribute data across multiple machines
- Flexible: each document can have different number of fields and type of fields.
- perfomant: embedded data models, indexing, sharding, flexible documents, native duplication

BSON data format is used. It's typed.

## Mongoose :

It's a Object Data Model(ODM) library for MongoDb and Node.js, a higher level of abstraction

- Mongoose schema: where we model the data, by describing the structure of the data, default values and validation
- Mongoose model: a wrapper for the schema, providing the interface to the database for CRUD operations.

## MVC architecture

- Model: business logic => code that actually deals with the business problem that we set out to solve.Business rules, works and business needs. For example, checking user credentials, validating user input data

- Controller : Application logic => code only deals with the application's implementation, not the underlying business problem we're trying to solve.(managing requests and responses( techniqual aspects)). Lies between model and view

- View: presentation logic

Flow: request comes -> hit the router -> controller -> interact with model to get data -> response -> response to the view

** NOde js debugging **

/_
sudo npm i ndb --global;
sudo npm i ndb;
sudo npm i --save-dev ndb;
_/

## Errors

- Programming errors: bugs that the developers introduce into the code. They are difficult to find and handle.(ex: using await without async, using req.query instead of req.body)

- Operational errors: problems that we can predict will happen at some point, so we just need to handle them in advance.(invalid path accessed, failed to connect to the server, request timeout)

## JSON

Stateless solutions for authentication(no need to store sessions on the server).

The user provides email and password to the server, and they are checked.
On logging in, the user is assigned a token on which it is attached to every request that the client sends to the server. This token is stored in the cookie or localstorage

## Security best practices

- Compromised database

  - Strongly encrypt the passwords with salt and hash(bcrypt)
  - Strongly encrypt password reset token(SHA 256)

- Brute force attacks( A hacker trying to guess the passwords)

  - use bcrypt(to make the login request slow)
  - implement rate limiting(express-rate-limit): block the much more requests from one ip
  - implement maximum login attempts

- CROSS-SITE scripting (XSS) attacks( A hacker injects his scripts into our page to run his malicious code)

  - Store JWT in HTTPOnly cookies
  - Sanitize user input data
  - Set special HTTP headers( helmet package)

- Denial-Of-Service attacks( A hacker sends much more requests to the server, and then the application becomes unavailable)

  - implement rate limiting(express-rate-limit)
  - Limit body payload(in body-parser): limit the amount of data to be sent in the post or patch request
  - Avoid evil regular expressions in codes: they take an exponential time to run for non-matching inputs and they can be exploited to bring down the entire application down.

- NOSQL query injection attack: (a hacker instead of inserting valid data, he injects a query in order to create query expressions that are going to translate to true)

  - Use mongoose for MongoDb(because of SchemaTypes)
  - Sanitize user input data

  ### Note: Some other good practices out there

  - Always use HTTPS
  - Don't commit sensitive Config data to Git
  - Don't send error details to the clients
  - Create random password token with an expiry date
  - Deny access to JWT after password change
  - Implement two-factor authentication ````
  - Keep user logged in with refresh tokens ````

  ## Status codes

  - 499: many requests
  - 401:
  - 403:
  - 201:
  - 200: ok

#### Data modelling

- Types of relationships between data

  - One

-
