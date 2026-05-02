const svgCaptcha = require("svg-captcha");

exports.generateCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 2,
    color: true,
  });

  req.session.captcha = captcha.text;

  console.log("Captcha stored:", req.session.captcha); // 🔍 debug

  res.type("svg");
  res.send(captcha.data);
};
