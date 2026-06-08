const {Pool}=require('pg');
const p=new Pool({
  connectionString:'postgresql://transporte_joaquin_db_user:3bdbiwqvmFA9bWynkmgp2pXXzIXq3jAm@dpg-d8dghld8nd3s73dmktbg-a.oregon-postgres.render.com/transporte_joaquin_db',
  ssl:{rejectUnauthorized:false}
});
async function run() {
  const {rows:[e]} = await p.query(
    "SELECT id, estado FROM widget_envios WHERE numero_seguimiento=$1",
    ['TJ-2026-910463']
  );
  console.log('Envio:', e);
  if (e) {
    await p.query("UPDATE widget_envios SET estado='confirmado' WHERE id=$1",[e.id]);
    await p.query(
      "INSERT INTO tracking_widget (envio_id, estado, descripcion) VALUES ($1,'confirmado','Pago aprobado. Envío confirmado.')",
      [e.id]
    );
    console.log('Confirmado y tracking creado OK');
  }
  p.end();
}
run().catch(console.error);
