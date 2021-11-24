const jwt = require("jsonwebtoken");
const models = require("../models");

function checkAuth(permission) {
  return (req, res, next) => {
    try {
      //console.log("REQ>BODY: ",req.body)
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      //console.log("DECODED TOKEN: ",decodedToken)
      //let user = await
      models.User.findByPk(decodedToken.userId).then((resu) => {
        if (resu.dataValues.userType !== permission && permission !== 4) {
          res
            .status(403)
            .send({ message: "You are unauthorized for this specific action" });
        } else {
          req.userData = decodedToken;
          next();
        }
      });
    } catch (er) {
      return res
        .status(401)
        .send({ message: "You are unauthorized", error: er });
    }
  };
}

module.exports = {
  checkAuth,
};
