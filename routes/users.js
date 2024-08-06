const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'academicmanager',
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Conexão estabilizada');
});

router.post('/users/add', (req, res) => {
  const { nome, cpf, cargo, email, senha } = req.body;
  const table = cargo === 'coordenador' ? 'coordenadores' : 'diretor';
  const query = `INSERT INTO ${table} (nome, cpf, cargo, email, senha) VALUES (?, ?, ?, ?, ?)`;

  db.query(query, [nome, cpf, cargo, email, senha], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Usuário adicionado com sucesso' });
  });
});


router.post('/users/edit', (req, res) => {
  const { id, nome, cpf, cargo, email, senha } = req.body;
  const table = cargo === 'coordenador' ? 'coordenadores' : 'diretor';
  const query = `UPDATE ${table} SET nome = ?, cpf = ?, cargo = ?, email = ?, senha = ? WHERE id = ?`;

  db.query(query, [nome, cpf, cargo, email, senha, id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Usuário atualizado com sucesso' });
  });
});


router.post('/users/delete', (req, res) => {
  const { id, cargo } = req.body;
  const table = cargo === 'coordenador' ? 'coordenadores' : 'diretor';
  const query = `DELETE FROM ${table} WHERE id = ?`;

  db.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  });
});

module.exports = router;