const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const userRoutes = require('./routes/users'); 
const planosRoutes = require('./routes/planos');

const app = express();
app.use(session({ secret: 'ssshhhhh', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const hbs = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        eq: function (a, b) {
            return a === b;
        }
    },
    extname: '.handlebars'
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

///////////////////////////////// CONEXÃO BANCO DE DADOS /////////////////////////////////////////////////
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academicmanager'
});

db.connect((err) => {
    if (err) {
        console.log('Erro ao conectar banco de dados', err);
        return;
    }
    console.log('Conexão estabilizada!');
});

// Rota do login
app.get('/', (req, res) => {
    req.session.destroy();
    res.render('login', { message: '', showMenu: false });
});

app.get('/views/login', (req, res) => {
    res.render('login', { message: '' });
});

app.post('/log', (req, res) => {
    var email = req.body.email;
    var pass = req.body.pass;

    var query = 'SELECT * FROM users WHERE email = ? AND pass = ?';
    db.query(query, [email, pass], function (err, results) {
        if (err) {
            console.error('Erro na consulta:', err);
            res.render('login', { message: 'Erro interno.' });
            return;
        }

/////////////////////////////////////////// PARA A LÓGICA DE RECONHECER O USUÁRIO ////////////////////////////////
        if (results.length > 0) {
            req.session.user = results[0];
            var role = results[0].role;
            var userId = results[0].id;

            switch (role) {
                case 'coordenador':
                    res.redirect('/coordenador/' + userId);
                    break;
                case 'aluno':
                    res.redirect('/aluno/' + userId);
                    break;
                case 'representante_tg':
                    res.redirect('/representante_tg/' + userId);
                    break;
                case 'diretor':
                    res.redirect('/diretor/' + userId);
                    break;
                case 'orientador':
                    res.redirect('/orientador/' + userId);
                    break;
                case 'representante_po':
                    res.redirect('/representante_po/' + userId);
                    break;
                case 'admin':
                    res.redirect('/admin/' + userId);
                    break;
                default:
                    res.render('error', { message: 'Tipo de usuário não reconhecido.' });
            }
        } else {
            res.render('login', { message: 'Login incorreto!' });
        }
    });
});

/////////////////////////////// ROTAS PARA ACESSAR AS TELAS DOS USUÁRIOS /////////////////////////////////////
app.get('/coordenador/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'coordenador') {
        res.render('coordenador', { user: req.session.user, userRole: 'coordenador', showMenu: true });
    } else {
        res.redirect('/');
    }
});

app.get('/aluno/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'aluno') {
        res.render('aluno', { user: req.session.user, userRole: 'aluno', showMenu: true });
    } else {
        res.redirect('/');
    }
});

app.get('/admin/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin', { user: req.session.user, userRole: 'admin', showMenu: true });
    } else {
        res.redirect('/');
    }
});

app.get('/diretor/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'diretor') {
        res.render('diretor', { user: req.session.user, userRole: 'diretor', showMenu: true });
    } else {
        res.redirect('/');
    }
});

app.get('/orientador/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'orientador') {
        res.render('orientador', { user: req.session.user, userRole: 'orientador', showMenu: true });
    } else {
        res.redirect('/');
    }
});

app.get('/representante_po/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'representante_po') {
        res.render('representante_po', { user: req.session.user, userRole: 'representante_po', showMenu: true });
    } else {
        res.redirect('/');
    }
});

app.get('/representante_tg/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'representante_tg') {
        res.render('representante_tg', { user: req.session.user, userRole: 'representante_tg', showMenu: true });
    } else {
        res.redirect('/');
    }
});

/////////////////////////////////// GERENCIAMENTO DE BOTÕES //////////////////////////////////////////
app.get('/plano-adaptativo/:id', (req, res) => {
  if (req.session.user && (req.session.user.role === 'representante_tg' || req.session.user.role === 'orientador')) {
    res.render('plano-adaptativo', { user: req.session.user, showMenu: false });
  } else {
    res.redirect('/');
  }
});

app.get('/contas/:id', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('contas', { user: req.session.user, showMenu: false });
    } else {
        res.redirect('/');
    }
});

////////////////////////////// CRUD DIRETOR E COORDENADOR //////////////////////////////////

/////////////////////// INICIA A ROTA DA PASTA ROUTES ///////////////////////////////////////////
const router = express.Router();

////////////////// PUXA OS DADOS CADASTRADOS ///////////////////////////////
app.get('/users', (req, res) => {
    const query = `
      SELECT u.id, u.email, u.role, COALESCE(c.nome, d.nome) as nome, COALESCE(c.cpf, d.cpf) as cpf
      FROM users u
      LEFT JOIN coordenadores c ON u.id = c.id
      LEFT JOIN diretor d ON u.id = d.id
      WHERE u.role IN ('coordenador', 'diretor')
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao buscar usuários' });
      }
      res.json(results);
    });
  });
  

//////////////////////// CADASTRA DIRETOR OU COORDENADOR ////////////////////////
  app.post('/users/add', (req, res) => {
    const { nome, cpf, cargo, email, senha } = req.body;
  
    const userQuery = 'INSERT INTO users (email, role, pass) VALUES (?, ?, ?)';
    const insertQuery = cargo === 'diretor'
      ? 'INSERT INTO diretor (id, nome, cpf) VALUES (LAST_INSERT_ID(), ?, ?)'
      : 'INSERT INTO coordenadores (id, nome, cpf) VALUES (LAST_INSERT_ID(), ?, ?)';
  
    db.beginTransaction(err => {
      if (err) throw err;
  
      db.query(userQuery, [email, cargo, senha], (err, results) => {
        if (err) {
          return db.rollback(() => {
            console.error(err);
            res.status(500).json({ error: 'Erro ao adicionar usuário' });
          });
        }
  
        db.query(insertQuery, [nome, cpf], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error(err);
              res.status(500).json({ error: 'Erro ao adicionar dados específicos do usuário' });
            });
          }
  
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error(err);
                res.status(500).json({ error: 'Erro ao adicionar dados específicos do usuário' });
              });
            }
            res.json({ success: true, message: 'Usuário adicionado com sucesso!' });
          });
        });
      });
    });
  });

//////////////////////////////// EDITA OS DADOS DO DIRETOR OU COORDENADOR ///////////////////////////////////
  app.post('/users/edit', (req, res) => {
    const { id, nome, cpf, cargo, email, senha } = req.body;
  
    const userQuery = 'UPDATE users SET email = ?, role = ?, pass = ? WHERE id = ?';
    const updateQuery = cargo === 'diretor'
      ? 'UPDATE diretor SET nome = ?, cpf = ? WHERE id = ?'
      : 'UPDATE coordenadores SET nome = ?, cpf = ? WHERE id = ?';
  
    db.query(userQuery, [email, cargo, senha, id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao editar usuário' });
      }
  
      db.query(updateQuery, [nome, cpf, id], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Erro ao editar dados específicos do usuário' });
        }
        res.json({ success: true, message: 'Usuário editado com sucesso!' });
      });
    });
  });
  
/////////////////////////////////// DELETA UM DIRETOR OU COORDENADOR ///////////////////////////
  app.post('/users/delete', (req, res) => {
    const { id } = req.body;
  
    const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
    const deleteCoordenadorQuery = 'DELETE FROM coordenadores WHERE id = ?';
    const deleteDiretorQuery = 'DELETE FROM diretor WHERE id = ?';
  
    db.query(deleteUserQuery, [id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao excluir usuário' });
      }
  
      db.query(deleteCoordenadorQuery, [id], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Erro ao excluir coordenador' });
        }
  
        db.query(deleteDiretorQuery, [id], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao excluir diretor' });
          }
          res.json({ success: true, message: 'Usuário excluído com sucesso!' });
        });
      });
    });
  });


////////////////////// INICIA O SERVIDOR //////////////////////////////////////////
app.use('/planos', planosRoutes);
app.use(router);
app.listen(8081, () => console.log('Servidor Ativo!'));