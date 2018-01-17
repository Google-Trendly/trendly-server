'use strict';

const {Router} = require('express');
const jsonParser = require('body-parser').json();
const httpErrors = require('http-errors');
const Profile = require('../model/profile');
const superagent = require('superagent');

const bearerAuthMiddleware = require('../lib/middleware/bearer-auth-middleware');

const profileRouter = module.exports = new Router();

profileRouter.post('/profiles', bearerAuthMiddleware, jsonParser, (request, response, next) => {
  if(!request.account && !request.phoneNumber)
    return next(new httpErrors(404, '__ERROR__ no account, or phonenumber given'));

  // REVIEW: break this line up
  let memberId = request.body.memberId;
  let key = process.env.API_KEY
  let url = `https://api.meetup.com/members/${memberId}?key=${key}&?fields=groups?%22`
  return superagent.get(url)
    .then(response => {
      return response.body;
    })
    .then(meetupObject => {
      return new Profile ({
        ...request.body,
        meetupMemberId: meetupObject.id,
        name: meetupObject.name,
        account: request.account._id,
      }).save()
        .then(profile => response.json(profile))
        .catch(next);
    })
    .catch(next);
});


profileRouter.get('/profiles/:id', bearerAuthMiddleware, (request, response, next) => {
  if(!request.account)
    return next(new httpErrors(404, '__ERROR__ Not Found'));
  return Profile.findById(request.params.id)
    .then(profile => response.json(profile))
    .catch(next);
});
