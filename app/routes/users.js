var express = require('express');
var router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const WithAuth = require('../middlewares/auth');
require('dotenv').config();
const bcrypt = require('bcrypt');
const secret = process.env.JWT_TOKEN;

router.post('/register', async (req, res) => {
  const {name, email, password} = req.body;
  const user = new User({name, email, password});

  try {
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({error: 'Error registering user'})
  }
})

router.post('/login', async(req, res) => {
  const {email, password} = req.body;

  try {
    let user = await User.findOne({email});
    if(!user) res.status(401).json({error: 'Incorret email!'});
    else{
      user.isCorrectPassword(password, function(err, same){
        if(!same) res.status(401).json({error: 'Incorret password!'});
        else{
          const token = jwt.sign({email}, secret, {expiresIn: '10d'});
          res.json({user: user, token: token});
        }
      })
    }
  } catch (error) {
    res.status(500).json({error: 'Internal error, please try again'})
  }
})

/*router.put('/', WithAuth, async (req, res) => {
  const {name, email, password} = req.body;
  try {
    if(await User.findOne({email}) && email != req.email) res.json({error: 'This email is not available, please try another email'});
    else{
      req.user.isCorrectPassword(password,async function(err, same){
        if(!same) res.status(401).json({error: 'Incorret password!'});
        else{
          let user =await User.findByIdAndUpdate(req.user._id,
            {$set: {name: name, email: email}},
            {$upsert: true, 'new': true});
          const token = jwt.sign({email}, secret, {expiresIn:'10d'});
          res.json({user: user, token: token});
        }
      })
    }
  } catch (error) {
    res.status(500).json({error: 'Error updating user'})
  }
})*/

router.put('/', WithAuth, async function(req, res) {
  const {name, email} = req.body;

  try {
    var user = await User.findOneAndUpdate(
      {_id: req.user._id},
      {$set: {name: name, email: email}},
      {$upsert: true, 'new': true}
    )
    res.json(user);
  } catch (error) {
    res.status(401).json({error: error});
  }
})

/*router.put('/password', WithAuth, async (req, res) =>{
  const {password, newPassword} = req.body;
    try {
      req.user.isCorrectPassword(password, async function(err, same){
        if(same){
          bcrypt.hash(newPassword, 10,async function(err, hashedPassword){
            if(err) res.json(err);
            else{
              let user = await User.findByIdAndUpdate(req.user._id,
                {$set: {password: hashedPassword}},
                {$upsert: true, 'new': true})
              const token = jwt.sign({email: user.email}, secret, {expiresIn: '10d'});
              res.json({user: user, token: token});
            }
          })
        } else res.json({error: 'Incorret Password!'})
      })
    } catch (error) {
      res.status(500).json({error: 'Error changing password'}) 
    }
  })*/

  router.put('/password', WithAuth, async function(req, res){
    const {password} = req.body;

    try {
      var user = await User.findOne({_id: req.user._id});
      user.password = password;
      user.save;
      res.json(user);
    } catch (error) {
      res.status(401).json({error: error});
    }
  })
  router.delete('/', WithAuth, async (req, res)=>{
    try {
      let user = User.findById(req.user._id);
       await user.deleteOne();
       res.json({message: 'Success'}).status(201);
    } catch (error) {
      res.status(500).json({error: 'Error deleting user'}) 
    }
  })

  /*router.get('/', WithAuth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json(user);
    } catch (error) {
      res.status(500).json({error: error}) 
    }
  })*/

module.exports = router;
