const express = require('express');
const router = express.Router();

const User = require('../models/user.js');
const car = require('../models/car.js');

router.get('/', async (req, res) => {
  const otherUsers = await User.find({ _id: { $ne: req.session.user._id } })

  res.render('collections/index.ejs', { otherUsers })
})

router.get('/:ownerId', async (req, res) => {
  const userCollection = await car.find({ owner: req.params.ownerId }).populate('owner')
  const userDetails = await User.findById(req.params.ownerId)
  res.render('collections/other-users.ejs', { userCollection, userDetails })
})

router.get('/:ownerId/:carId', async (req, res) => {
  try {
  const usercar = await car.findById(req.params.carId).populate('owner')
  const userHasFavorited = usercar.favoritedByUsers.some((user) => user.equals(req.session.user._id))
  const comments = usercar.commentsByUsers.find(req.params.carId)
  res.render('collections/show.ejs', { usercar, userHasFavorited, comments })
  }catch(error) {
    console.log(error)
    res.redirect('/')
  }
})

router.post('/:ownerId/:carId/comments', async (req,res) => {
  try{
    req.body.owner = req.session.user._id
    const currentcar = await car.findById(req.params.carId)
    currentcar.commentsByUsers.push(req.body)
  
    await currentcar.save()
    res.render('collections/show.ejs', {currentcar})

  } catch(error) {
    console.log(error)
    res.redirect('/')
  }
})

router.post('/:ownerId/:carId/favorited-by/:userId', async (req, res) => {
  try {
    await car.findByIdAndUpdate(req.params.carId, {
      $push: { favoritedByUsers: req.params.userId },
    })
    res.redirect(`/collections/${req.params.ownerId}/${req.params.carId}`)
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.delete('/:ownerId/:carId/favorited-by/:userId', async (req, res) => {
  try {
    await car.findByIdAndUpdate(req.params.carId, {
      $pull: { favoritedByUsers: req.params.userId },
    })
    res.redirect(`/collections/${req.params.ownerId}/${req.params.carId}`)
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

module.exports = router