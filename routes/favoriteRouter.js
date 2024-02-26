const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favorites => {
                res.statusCode = 200
                res.setHeader('Content-type', 'application/json')
                res.json(favorites)
            })
            .catch(err => next(err))
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    req.body.forEach(campsite => {
                        if (!favorite.campsites.includes(campsite._id)) {
                            favorite.campsites.push(campsite._id);
                        }
                    });
                    favorite.save()
                        .then(updatedFavorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(updatedFavorite);
                        })
                        .catch(err => next(err));
                } else {
                    Favorite.create({ user: req.user._id, campsites: req.body })
                        .then(newFavorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(newFavorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(response => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(response);
            })
            .catch(err => next(err));
    });
favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    const campsiteId = req.params.campsiteId;
                    if (!favorite.campsites.includes(campsiteId)) {
                        favorite.campsites.push(campsiteId);
                        favorite.save()
                            .then(updatedFavorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(updatedFavorite);
                            })
                            .catch(err => next(err));
                    } else {
                        res.statusCode = 409;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('That campsite is already in the list of favorites!');
                    }
                } else {
                    Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
                        .then(newFavorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(newFavorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    const campsiteId = req.params.campsiteId;
                    const index = favorite.campsites.indexOf(campsiteId);
                    if (index !== -1) {
                        favorite.campsites.splice(index, 1);
                        favorite.save()
                            .then(updatedFavorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(updatedFavorite);
                            })
                            .catch(err => next(err));
                    } else {
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('Campsite not found in your favorites.');
                    }
                } else {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete.');
                }
            })
            .catch(err => next(err));
    });

module.exports = favoriteRouter;
