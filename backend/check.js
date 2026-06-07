const {Pool}=require('pg');
const p=new Pool({
  connectionString:'postgresql://transporte_joaquin_db_user:3bdbiwqvmFA9bWynkmgp2pXXzIXq3jAm@dpg-d8dghld8nd3s73dmktbg-a.oregon-postgres.render.com/transporte_joaquin_db',
  ssl:{rejectUnauthorized:false}
});
p.query('SELECT slug, mp_access_token FROM empresas WHERE slug=$1',['demo'])
 .then(r=>{console.log(r.rows[0]);p.end()})
 .catch(e=>console.error(e.message));
