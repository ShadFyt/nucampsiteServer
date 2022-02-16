const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require('../authenticate');
const cors = require('./cors')

const favoriteRouter = express.Router();


favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id }).populate('user').populate('campsites')
            .then((favorites) => {
                console.log("finding user", req.user)
                console.log("favorites: ", favorites)
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorites);
            })
            .catch((err) => next(err))
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorite) => {
                console.log("document found")
                console.log("req.body:", req.body)
                if (favorite) {
                    console.log("favorite :", favorite)
                    req.body.forEach(item => {
                        console.log("item :", item)
                        console.log("campsites :", favorite.campsites)
                        if (!favorite.campsites.includes(item._id)) {
                            console.log("adding... ", item)
                            favorite.campsites.push(item._id)
                        } else { console.log(item._id, " already exists") }
                    })
                    favorite.save().then(favorite => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite)
                    }).catch(err => next(err));
                } else {
                    console.log("registering")
                    Favorite.create({ user: req.user._id, campsites: [...req.body] })
                        .then(favorite => {
                            favorite.save()
                            console.log("favorite created", favorite);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                        .catch(err => next(err))
                }
            }).catch((err) => next(err));
    })
    .put(cors.corsWithOptions, (req, res) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites");
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then((response) => {
                if (!response) {
                    res.end("You do not have any favorites to delete")
                } else {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(response);
                }
            })
            .catch((err) => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end("GET operation not supported on /favorites/:campsiteId");
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    console.log("document found :", favorite)
                    if (!favorite.campsites.includes(req.params.campsiteId)) {
                        console.log("adding", req.params.campsiteId)
                        favorite.campsites.push(req.params.campsiteId)
                        favorite.save().then(favorite => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite)
                        }).catch(err => next(err));
                    } else {
                        res.setHeader("Content-Type", "application/json");
                        res.end("That campsite is already in the list of favorites!")
                    }
                } else {
                    Favorite.create({ user: req.user._id, campsites: req.params.campsiteId })
                        .then(favorite => {
                            favorite.save()
                            console.log("favorite created", favorite);
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                        .catch(err => next(err))
                }
            }).catch(err => next(err))
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites/:campsiteId");
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    let idx = favorite.campsites.indexOf(req.params.campsiteId)
                    if (idx > -1) {
                        console.log("removing :", req.params.campsiteId)
                        favorite.campsites.splice(idx, 1)
                        favorite.save()
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                    } else {
                        res.setHeader("Content-Type", "application/json");
                        res.end(`campsite with id: ${req.params.campsiteId} not found`);
                    }
                } else {
                    res.setHeader("Content-Type", "application/json");
                    res.end(`no favorites to delete`);
                }
            }).catch(err => next(err))
    });


module.exports = favoriteRouter;