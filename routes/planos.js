const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const methodOverride = require('method-override');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'academicmanager'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Conexão estabilizada...');
});

const executeQuery = (query, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
};

router.use(methodOverride('_method'));

router.get('/', async (req, res) => {
  try {
    const planos = await executeQuery('SELECT * FROM planos_adaptativos');
    res.render('plano-adaptativo', { planos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const planos = await executeQuery('SELECT * FROM planos_adaptativos WHERE plano_id = ?', [id]);
      if (planos.length > 0) {
        res.json(planos[0]);
      } else {
        res.status(404).send('Plano não encontrado');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Erro no servidor');
    }
  });

router.post('/', async (req, res) => {
  const { nome, bimestre, descricao } = req.body;
  try {
    await executeQuery('INSERT INTO planos_adaptativos (nome, bimestre, descricao) VALUES (?, ?, ?)', [nome, bimestre, descricao]);
    res.redirect('/planos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, bimestre, descricao } = req.body;
  try {
    await executeQuery('UPDATE planos_adaptativos SET nome = ?, bimestre = ?, descricao = ? WHERE plano_id = ?', [nome, bimestre, descricao, id]);
    res.redirect('/planos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await executeQuery('DELETE FROM planos_adaptativos WHERE plano_id = ?', [id]);
    res.redirect('/planos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;