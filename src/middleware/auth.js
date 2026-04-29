function requireWebAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }

  req.session.flash = {
    type: 'error',
    message: 'Inicia sesion para continuar.'
  };

  return res.redirect('/login');
}

function requireApiAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.status(401).json({
    message: 'Autenticacion requerida.',
    backendPort: res.locals.backendPort
  });
}

module.exports = {
  requireWebAuth,
  requireApiAuth
};
