const express = require('express');
const router = express.Router();

const User = require('../models/user.js');

const car = require('../models/cars.js');

///users/:userId/cares

router.get('/collections', async (req, res) => {
  console.log(req.session.user)
  try {
    const populatedcares = await car.find({ user: req.session.user._id }).populate('user')
    console.log(populatedcares)
    res.render('cares/index.ejs', { cars: populatedcares })
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
    const editcar = await car.findById(req.params.carId).populate('user')
    res.render('cares/edit.ejs', { car: editcar })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

router.post('/', async (req, res) => {
  try {
    req.body.user = req.session.user._id
    const newCar = await car.create(req.body)
    await newCar.save()
    res.redirect(`/cars`)
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }

})

router.delete('/:carId', async (req, res) => {
  try {
    const currentcar = await car.findById(req.params.carId)
    if(currentcar.user.equals(req.session.user._id)) {
    await currentcar.deleteOne()
    res.redirect(`/cars/collections`)
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
    res.redirect(`/cars/collections`)

  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

module.exports = router