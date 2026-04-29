const express = require('express');
const {
  verifyUserCredentials,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../db');
const { requireWebAuth } = require('../middleware/auth');

const router = express.Router();

function normalizeProductInput(body) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const parsedPrice = Number.parseFloat(body.price);
  const parsedStock = Number.parseInt(body.stock, 10);
  const errors = [];

  if (!name) {
    errors.push('El nombre es obligatorio.');
  }

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    errors.push('El precio debe ser un numero mayor o igual a 0.');
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    errors.push('El stock debe ser un entero mayor o igual a 0.');
  }

  return {
    errors,
    product: {
      name,
      description,
      price: Number.isFinite(parsedPrice) ? parsedPrice : body.price,
      stock: Number.isInteger(parsedStock) ? parsedStock : body.stock
    }
  };
}

function renderForm(res, options) {
  return res.render('products/form', {
    title: options.title,
    heading: options.heading,
    formAction: options.formAction,
    submitLabel: options.submitLabel,
    product: options.product,
    errors: options.errors || []
  });
}

router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/products');
  }

  return res.redirect('/login');
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/products');
  }

  return res.render('login', {
    title: 'Login'
  });
});

router.post('/login', (req, res, next) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = verifyUserCredentials(username, password);

  if (!user) {
    req.session.flash = {
      type: 'error',
      message: 'Usuario o contrasena incorrectos.'
    };

    return res.redirect('/login');
  }

  return req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.user = user;
    req.session.flash = {
      type: 'success',
      message: `Sesion iniciada en el backend ${res.locals.backendPort}.`
    };

    return res.redirect('/products');
  });
});

router.post('/logout', requireWebAuth, (req, res, next) => {
  return req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('multi-instance.sid');
    return res.redirect('/login');
  });
});

router.get('/products', requireWebAuth, (req, res) => {
  return res.render('products/list', {
    title: 'Productos',
    products: listProducts()
  });
});

router.get('/products/new', requireWebAuth, (req, res) => {
  return renderForm(res, {
    title: 'Nuevo producto',
    heading: 'Crear producto',
    formAction: '/products',
    submitLabel: 'Crear producto',
    product: {
      name: '',
      description: '',
      price: '',
      stock: 0
    }
  });
});

router.post('/products', requireWebAuth, (req, res) => {
  const { errors, product } = normalizeProductInput(req.body);

  if (errors.length > 0) {
    return renderForm(res.status(400), {
      title: 'Nuevo producto',
      heading: 'Crear producto',
      formAction: '/products',
      submitLabel: 'Crear producto',
      product,
      errors
    });
  }

  createProduct(product);
  req.session.flash = {
    type: 'success',
    message: 'Producto creado correctamente.'
  };

  return res.redirect('/products');
});

router.get('/products/:id', requireWebAuth, (req, res) => {
  const product = getProductById(req.params.id);

  if (!product) {
    return res.status(404).render('error', {
      title: 'Producto no encontrado',
      heading: '404',
      message: 'El producto solicitado no existe.'
    });
  }

  return res.render('products/show', {
    title: 'Detalle del producto',
    product
  });
});

router.get('/products/:id/edit', requireWebAuth, (req, res) => {
  const product = getProductById(req.params.id);

  if (!product) {
    return res.status(404).render('error', {
      title: 'Producto no encontrado',
      heading: '404',
      message: 'No se puede editar un producto inexistente.'
    });
  }

  return renderForm(res, {
    title: 'Editar producto',
    heading: `Editar producto #${product.id}`,
    formAction: `/products/${product.id}`,
    submitLabel: 'Guardar cambios',
    product
  });
});

router.post('/products/:id', requireWebAuth, (req, res) => {
  const existingProduct = getProductById(req.params.id);

  if (!existingProduct) {
    return res.status(404).render('error', {
      title: 'Producto no encontrado',
      heading: '404',
      message: 'No se puede actualizar un producto inexistente.'
    });
  }

  const { errors, product } = normalizeProductInput(req.body);

  if (errors.length > 0) {
    return renderForm(res.status(400), {
      title: 'Editar producto',
      heading: `Editar producto #${req.params.id}`,
      formAction: `/products/${req.params.id}`,
      submitLabel: 'Guardar cambios',
      product: {
        ...product,
        id: req.params.id
      },
      errors
    });
  }

  updateProduct(req.params.id, product);
  req.session.flash = {
    type: 'success',
    message: 'Producto actualizado correctamente.'
  };

  return res.redirect('/products');
});

router.post('/products/:id/delete', requireWebAuth, (req, res) => {
  const wasDeleted = deleteProduct(req.params.id);

  req.session.flash = {
    type: wasDeleted ? 'success' : 'error',
    message: wasDeleted
      ? 'Producto eliminado correctamente.'
      : 'No se encontro el producto a eliminar.'
  };

  return res.redirect('/products');
});

module.exports = router;
