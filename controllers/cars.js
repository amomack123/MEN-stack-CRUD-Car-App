const express = require('express');
const router = express.Router();

const User = require('../models/user.js');
const car = require('../models/car.js');

///users/:userId/cares

router.get('/', async (req, res) => {
  try {
    const populatedcares = await car.find({ owner: req.session.user }).populate('owner')
    res.render('cares/index.ejs', { cares: populatedcares })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.get('/new', (req, res) => {
  res.render('cares/new.ejs')
})

router.get('/:carId', async (req, res) => {
  try {
    const carData = await car.findById(req.params.carId)
    res.render('cares/show.ejs', { car: carData })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.get('/:carId/edit', async (req, res) => {
  try {
    const editcar = await car.findById(req.params.carId).populate('owner')
    res.render('cares/edit.ejs', { car: editcar })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.post('/', async (req, res) => {
  try {
    req.body.owner = req.session.user._id
    if (req.body.isForSale === "on") {
      req.body.isForSale = true;
    } else {
      req.body.isForSale = false;
    }
    await car.create(req.body)
    res.redirect(`/users/${req.session.user._id}/cares`)
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }

})

router.delete('/:carId', async (req, res) => {
  try {
    const currentcar = await car.findById(req.params.carId)
    if(currentcar.owner.equals(req.session.user._id)) {
    await currentcar.deleteOne()
    res.redirect(`/users/${req.session.user._id}/cares`)
  } else {
    res.redirect('/')
  }
  
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.put('/:carId', async (req, res) => {
  try {
    req.body.owner = req.session.user._id
    if (req.body.isForSale === 'on') {
      req.body.isForSale = true
    } else {
      req.body.isForSale = false
    }
    await car.findByIdAndUpdate(req.params.carId, req.body)
    res.redirect(`/users/${req.session.user._id}/cares/${req.params.carId}`)

  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

module.exports = router