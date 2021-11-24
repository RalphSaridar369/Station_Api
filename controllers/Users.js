const models = require("../models");
const Validator = require("fastest-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dir = require('../server');
const { isBuffer } = require("util");
const ExcelJS = require('exceljs');

async function getAllUsers(req, res) {
  console.log("req query:",req.query);
  if(!req.query.limit || !req.query.page)
    return res.status(400).send({message:"Please insert limit and page in your api call"})
  if(req.query.limit<1 || req.query.page<1)
    return res.status(400).send({message:"Please insert limit and page in your api call greater than zero"})
  /* const users = await models.User.findAll();
  console.log("USERS:",users);
  users.forEach(element => {
    console.log("Element:\n",element["User"])
  }); */
  let lm = parseInt(req.query.limit)
  let os = parseInt(lm * (parseInt(req.query.page)-1))
  console.log("LIMIT:",lm,"\nOFFSET:",os)
  models.User.findAll({
    attributes: { exclude: ["password"] },
    limit:lm,
    offset:os
  }).then((result) => {
    res
      .status(200)
      .send({ message: "Users fetched successfully", data: result });
  });
}

function SignUp(req, res) {
  models.User.findOne({ where: { email: req.body.email } }).then((result) => {
    if (result) res.status(403).send({ message: "User Already Exists!" });
  });

  bcryptjs.genSalt(10, (err, salt) => {
    bcryptjs.hash(req.body.password, salt, (err, hash) => {
      console.log("Hasehd Password: ", hash);
      let data = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: hash,
        profileImage: "",
        stateId: req.body.stateId,
        userType: req.body.userType==3?1:req.body.userType,
      };

      const v = new Validator();

      const schema = {
        firstname: { type: "string", optional: false, max: 255 },
        lastname: { type: "string", optional: false, max: 255 },
        email: { type: "email", optional: false, max: 255 },
        password: { type: "string", optional: false },
        stateId: { type: "number", optional: false, max: 32 },
        userType: { type: "number", optional: false,min:1, max: 3 },
      };

      const validationResult = v.validate(data, schema);
      console.log("Validation: ", typeof validationResult);
      if (typeof validationResult == "boolean") {
        models.User.create(data)
          .then((result) => {
            res
              .status(200)
              .send({ message: "User was created successfully", data: result });
          })
          .catch((err) =>
            res
              .status(500)
              .send({ message: "Something Went Wrong", error: err })
          );
      } else {
        res.status(400).send({ message: validationResult });
      }
    });
  });
}

function GetSpecificUsersType(req, res) {
  const type = req.query.usertype;
  models.User.findAndCountAll({
    attributes: { exclude: ["password"] },
    where: {
      userType: type,
    },
  })
    .then((result) => {
      res
        .status(200)
        .send({ message: "Users Fetched Successfully", data: result });
    })
    .catch((err) =>
      res.status(500).send({ message: "Something Went Wrong", error: err })
    );
}

function GetSpecificUser(req, res) {
  console.log("QUERY PARAMS: ", req.query);
  const id = req.query.userid;
  models.User.findByPk(id, {
    attributes: { exclude: ["password"] },
  })
    .then((result) => {
      res
        .status(200)
        .send({ message: "User Fetched Successfully", data: result });
    })
    .catch((err) =>
      res.status(500).send({ message: "Something Went Wrong", error: err })
    );
}

function GetSpecificUsersByState(req, res) {
  const id = req.query.stateid;
  models.User.findAndCountAll({
    attributes: { exclude: ["password"] },
    where: { stateId: id },
  })
    .then((result) => {
      res
        .status(200)
        .send({ message: "User Fetched Successfully", data: result });
    })
    .catch((err) =>
      res.status(500).send({ message: "Something Went Wrong", error: err })
    );
}

function Login(req, res) {
  models.User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((result) => {
      if (result) {
        bcryptjs.compare(
          req.body.password,
          result.password,
          function (err, test) {
            console.log(`${test}\n${req.body.password}\n${result.password}`);
            if (test) {
              const token = jwt.sign(
                {
                  email: result.email,
                  userId: result.id,
                },
                process.env.SECRET_KEY,
                function (err, token) {
                  res
                    .status(200)
                    .send({ message: "User logged in", token: token });
                }
              );
            } else res.status(401).send({ message: "Wrong credentials" });
          }
        );
      } else {
        res.status(401).send({ message: "User not found" });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: "Something went wrong", error: err })
    );
}

function Logout(req, res) {
  console.log("TESt");
}

function UpdateProfile(req, res) {
  
  bcryptjs.genSalt(10, (err, salt) => {
    bcryptjs.hash(req.body.password, salt, (err, hash) => {
  let data = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: hash,
    profileImage: "",
    stateId: req.body.stateId,
    //userType: req.body.userType,
  };

  const v = new Validator();

  const schema = {
    firstname: { type: "string", optional: false, max: 255 },
    lastname: { type: "string", optional: false, max: 255 },
    email: { type: "email", optional: false, max: 255 },
    password: { type: "string", optional: false },
    stateId: { type: "number", optional: false, max: 32 },
    //userType: { type: "number", optional: false, max: 32 },
  };

  const validationResult = v.validate(data, schema);
  if (typeof validationResult == "boolean") {
    models.User.update(data,{
      where:{id:req.userData.userId}
    }).then((updated)=>{
      res.status(200).send({message:"User updated successfully",data:updated})
    }).catch(err=>res.status(500).send({message:"Something wrong happened",error:err}))
  }
  else{
    res.status(400).send({message:"Error within your data inputs",error:validationResult})
  }
});
});
}

function DeleteProfile(req, res) {
  models.User.destroy({
    where:{
      id:req.userData.userId
    }
  }).then((result)=>{
    res.status(200).send({message:"User deleted successfully",data:result})
  }).catch(err => res.status(500).send({message:"Something went wrong",error:err}))
}


const storage = multer.diskStorage({
  destination: function(req, file, cb){
      cb(null, './public/excel');
  },

  filename: function(req, file, cb){
      cb(null, new Date().getTime() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) =>{
  if(file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype ==='application/vnd.ms-excel'){
      cb(null, true);
  }
  else{
      cb(new Error('Unsupported files'), false);
  }
}

const upload = multer({
  storage: storage,
  limits:{
      fileSize:1024*1024*10,
  },
  fileFilter:fileFilter
})

function BulkUpload(req,res){
  console.log(dir)
  var workbook = xlsx.readFile(process.cwd()+'\\public\\excel\\test.xlsx');
  console.log("WORKSHEET: ",workbook)
  let worksheet  = workbook.Sheets[workbook.SheetNames[0]];
  var data = xlsx.utils.sheet_to_json(worksheet)
  console.log("DATA: ",data)

  const v = new Validator();

  const schema = {
    firstname: { type: "string", optional: false, max: 255 },
    lastname: { type: "string", optional: false, max: 255 },
    email: { type: "email", optional: false, max: 255 },
    password: { type: "string", optional: false },
    stateId: { type: "number", optional: false, max: 32 },
    userType: { type: "number", optional: false, min:1, max: 3 },
  };

  let ar=[];
  let i =0;
  let arE=[];
  let error = false;
  data.map((item,index)=>{

    let dict= {};
    for (var key in item){
      console.log(item[key])
      dict[key]=item[key]
    }

    ar.push(dict)
  })
  console.log("RESULT BECOMES: ",ar)
  
  res.status(200).send({data:ar})
}

module.exports = {
  getAllUsers,
  SignUp,
  GetSpecificUser,
  GetSpecificUsersType,
  GetSpecificUsersByState,
  Login,
  Logout,
  UpdateProfile,
  DeleteProfile,
  BulkUpload,
  upload
};
