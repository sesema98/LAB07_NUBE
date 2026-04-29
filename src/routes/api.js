const express = require('express');
const {
  verifyUserCredentials,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../db');
const { requireApiAuth } = require('../middleware/auth');

const router = express.Router();

function normalizeProductInput(body) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const price = Number.parseFloat(body.price);
  const stock = Number.parseInt(body.stock, 10);
  const errors = [];

  if (!name) {
    errors.push('El nombre es obligatorio.');
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.push('El precio debe ser un numero mayor o igual a 0.');
  }

  if (!Number.isInteger(stock) || stock < 0) {
    errors.push('El stock debe ser un entero mayor o igual a 0.');
  }

  return {
    errors,
    product: {
      name,
      description,
      price,
      stock
    }
  };
}

function respond(res, statusCode, payload) {
  return res.status(statusCode).json({
    ...payload,
    backendPort: res.locals.backendPort
  });
}

router.post('/login', (req, res, next) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = verifyUserCredentials(username, password);

  if (!user) {
    return respond(res, 401, {
      message: 'Usuario o contrasena incorrectos.'
    });
  }

  return req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.user = user;

    return respond(res, 200, {
      message: 'Sesion iniciada correctamente.',
      user
    });
  });
});

router.post('/logout', requireApiAuth, (req, res, next) => {
  return req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('multi-instance.sid');
    return respond(res, 200, {
      message: 'Sesion cerrada correctamente.'
    });
  });
});

router.get('/session', (req, res) => {
  if (!req.session.user) {
    return respond(res, 200, {
      authenticated: false
    });
  }

  return respond(res, 200, {
    authenticated: true,
    user: req.session.user
  });
});

router.get('/products', requireApiAuth, (req, res) => {
  return respond(res, 200, {
    products: listProducts()
  });
});

router.get('/products/:id', requireApiAuth, (req, res) => {
  const product = getProductById(req.params.id);

  if (!product) {
    return respond(res, 404, {
      message: 'Producto no encontrado.'
    });
  }

  return respond(res, 200, {
    product
  });
});

router.post('/products', requireApiAuth, (req, res) => {
  const { errors, product } = normalizeProductInput(req.body);

  if (errors.length > 0) {
    return respond(res, 400, {
      message: 'Error de validacion.',
      errors
    });
  }

  const createdProduct = createProduct(product);

  return respond(res, 201, {
    message: 'Producto creado correctamente.',
    product: createdProduct
  });
});

router.put('/products/:id', requireApiAuth, (req, res) => {
  const existingProduct = getProductById(req.params.id);

  if (!existingProduct) {
    return respond(res, 404, {
      message: 'Producto no encontrado.'
    });
  }

  const { errors, product } = normalizeProductInput(req.body);

  if (errors.length > 0) {
    return respond(res, 400, {
      message: 'Error de validacion.',
      errors
    });
  }

  const updatedProduct = updateProduct(req.params.id, product);

  return respond(res, 200, {
    message: 'Producto actualizado correctamente.',
    product: updatedProduct
  });
});

router.delete('/products/:id', requireApiAuth, (req, res) => {
  const wasDeleted = deleteProduct(req.params.id);

  if (!wasDeleted) {
    return respond(res, 404, {
      message: 'Producto no encontrado.'
    });
  }

  return respond(res, 200, {
    message: 'Producto eliminado correctamente.'
  });
});

module.exports = router;
