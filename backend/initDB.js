const db = require('./db');
const fs = require('fs');
const path = require('path');

async function initDB() {
  const schemas = [
    'schema.sql',
    'schema_widget.sql',
    'schema_admin.sql',
    'schema_auth.sql',
    'schema_pagos.sql',
  ];

  for (const file of schemas) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Schema no encontrado: ${file}`);
      continue;
    }
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await db.query(sql);
      console.log(`✅ Schema aplicado: ${file}`);
    } catch (e) {
      // Si las tablas ya existen no es un error real
      if (e.message.includes('already exists')) {
        console.log(`ℹ️  ${file}: tablas ya existentes, OK`);
      } else {
        console.error(`❌ Error en ${file}:`, e.message);
      }
    }
  }
}

module.exports = initDB;
