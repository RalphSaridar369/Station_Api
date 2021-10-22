const express = require('express');
const UserController = require('../controllers/Users');
const router = express.Router();
const authCheckToken = require('../middleware/auth');

router.get('/',UserController.getAllUsers);
router.get('/User',UserController.GetSpecificUser);
router.get('/Usertype',UserController.GetSpecificUsersType);
router.get('/UserState',UserController.GetSpecificUsersByState);
router.post('/Signup',UserController.SignUp);
router.post('/Login',UserController.Login);
router.post('/Logout', authCheckToken.checkAuth, UserController.Login);
router.put('/', authCheckToken.checkAuth, UserController.UpdateProfile);
router.delete('/', authCheckToken.checkAuth, UserController.DeleteProfile);

module.exports=router;