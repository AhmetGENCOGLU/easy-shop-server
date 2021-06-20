const expressJwt = require("express-jwt");

function authJwt() {
    const secret = process.env.SECRET_WORDS_FOR_LOGIN;
    return expressJwt({
        secret,
        algorithms:['HS256'],
        isRevoked:isRevoked
    }).unless({
        path:[
            { url: /\/public\/uploads(.*)/ , methods:['GET', 'OPTIONS'] },
            { url: /\/products(.*)/ , methods:['GET', 'OPTIONS'] },
            { url: /\/categories(.*)/ , methods:['GET', 'OPTIONS'] },
            { url: /\/orders(.*)/, methods: ['GET', 'OPTIONS', 'POST'] },
            `/users/login`,
            `/users/register`
        ]
    });
}

async function isRevoked(req,payload,done) {
    if(!payload.isAdmin){
        done(null, true)
    }

    done();
}

module.exports = authJwt;