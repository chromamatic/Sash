Sash
============

  Sash is a badge issuing & hosting service that follows the metadata format of
  the awesome Mozilla Open Badge Infrastructure project. Allows developers to
  stand up their own badging platform and integrate badge creation, issuing and
  displaying into their own products.

# The Parts

  In Sash everything is scoped to an Organization. When you start Sash up
  for the first time you will be asked to create an organization. The name and
  and password you choose here will be the login information you use to manage
  and track your badges.

## Creating Badges

  Sash provides a simple CRUD interface for creating and managing your badges.
  Upon creation badges are given a unique slug based on their name. Use this
  slug url to issue badges from your application.

## Issuing Badges

  Here is the general workflow for issue a badge:
  A user on your platform fufills criteria for earning badge. Your system makes a 
  POST request to the unique badge URL generated by Sash, described above, with 
  your organization's API key and the login or email of the user in your system. 
  side call to Sash with user login or email to issue badge.
  The User is automatically initialized in the system if they don't exist (unique by 
  username and organization), and the badge is issued to them.

### Issue API

ENDPOINT: `/issue/:badge-slug`
METHOD: `POST`
PARAMS:
  `api\_key`
  `username`
  `email`: you may provide username, email or both
  `tags` (optional): Any metadata 'tags' that you want to associate to the uses, ie grouping
info

Example Response:
```json
{
  "earned": true,
  "badge": {
    "name":"Trailblazer",
    "image":"http://sash-badges.s3.amazonaws.com/badge-images/5035307c2508920200000008-original.png",
    "description":"Thanks for registering. Now get in there and learn something!",
    "criteria":"Register for the course",
    "version":"1.0.0",
    "slug":"trailblazer",
    "tags":["register","generic"],
    "issued_on":"2012-11-16T18:53:46.356Z",
    "seen":true,
    "id":"5035307c2508920200000008",
    "assertion":"http://badges.everfi.net/users/aa7e37bba4f93e5a09554d4f3c0d0ae9424dda4027061b87cbb2c1bbf5b0f660/badges/trailblazer"
  }
}
```


## Displaying Badges

  Sash provides a display API allows you to query out the badges for an individual
  User via JSON. By default badges are marked as 'unseen' by the User, this allows
  you to track which badges are new to the User and display a dialog to notify 
  the user of a new badge. Sash also provides an API call for marking
  individual badges as seen.

### Display API

Retreve a user's badges in JSON
ENDPOINT: `/badges.json'
METHOD: `GET`
PARAMS:
  `username` and or `email`
  `callback` (optional)

Example Response:
```json
{
  "name":"Trailblazer",
  "image":"http://sash-badges.s3.amazonaws.com/badge-images/5035307c2508920200000008-original.png",
  "description":"Thanks for registering. Now get in there and learn something!",
  "criteria":"Register for the course",
  "version":"1.0.0",
  "slug":"trailblazer",
  "tags":["register","generic"],
  "issued_on":"2012-11-16T18:53:46.356Z",
  "seen":true,
  "id":"5035307c2508920200000008",
  "assertion":"http://badges.everfi.net/users/aa7e37bba4f93e5a09554d4f3c0d0ae9424dda4027061b87cbb2c1bbf5b0f660/badges/trailblazer"
}
```

Mark a badge as seen by the user
ENDPOINT: `/badges/:badge\_id/seen`
METHOD: `GET`
PARAMS:
  `username` and or `email`
  `callback` (optional)

RESPONSE:
```json
  { "success": true }
```

... More documentation to come

## Technology behind Sash

  Sash is builting using Node.js on top of the delightful Express.js framework. 
  Sash uses MongoDB for the database.

## Ok COOL. How do I get started??
  1. Install the following:
    - node.js 0.10.X
    - Mongo
    - Redis
    - ImageMagick (Note: if you are developing on Mac OS X, you will need to install ImageMagick using brew from the source `brew install imagemagick --build-from-source`)

  2. `npm install` to install package dependencies

  3. run the server with `bin/devserver`

## Status

  Sash is currently under active development. If you want to get involved contact us @ engineering@everfi.com!

## License

  Sash is released under the MIT License
