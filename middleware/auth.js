const jwt = require('jsonwebtoken');

function checkAuth (req,res,next){
    try{
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        req.userData = decodedToken;
        next();
    }
    catch(er){
        return res.status(401).send({message:"You are unauthorized",error:er})
    }
}

module.exports={
    checkAuth
}