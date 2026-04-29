const path = require('path');
const express = require('express');
const session = require('express-session');
const SqliteStoreFactory = require('better-sqlite3-session-store');
const { db, initializeDatabase } = require('./db');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '8081', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'change-this-secret-before-production';

initializeDatabase();

const SqliteStore = SqliteStoreFactory(session);

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.backendPort = PORT;
  res.setHeader('X-Backend-Port', String(PORT));
  return next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    name: 'multi-instance.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SqliteStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 15 * 60 * 1000
      }
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;

  if (req.session.flash) {
    delete req.session.flash;
  }

  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    backendPort: PORT,
    timestamp: new Date().toISOString()
  });
});

app.use('/', webRoutes);
app.use('/api', apiRoutes);

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      message: 'Recurso no encontrado.',
      backendPort: PORT
    });
  }

  return res.status(404).render('error', {
    title: 'No encontrado',
    heading: '404',
    message: 'La pagina solicitada no existe.'
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({
      message: 'Ocurrio un error inesperado.',
      backendPort: PORT
    });
  }

  return res.status(500).render('error', {
    title: 'Error del servidor',
    heading: '500',
    message: 'Ocurrio un error inesperado.'
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor listo en http://${HOST}:${PORT}`);
});
