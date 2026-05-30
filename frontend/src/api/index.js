import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getLocalidades = () => api.get('/cotizar/localidades').then(r => r.data);

export const postCotizar = (data) => api.post('/cotizar', data).then(r => r.data);

export const getTracking = (numero) => api.get(`/tracking/${numero}`).then(r => r.data);

export const postEnvio = (data) => api.post('/envios', data).then(r => r.data);

export const postCliente = (data) => api.post('/clientes', data).then(r => r.data);
