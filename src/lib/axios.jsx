import axios from 'axios';

//https://docs.google.com/spreadsheets/d/1w_S1h4dDDs2c-hrFb8aluEWTUxEtaCLS_gJ1S-SPugc/edit?usp=sharing

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'text/plain;charset=utf-8',
    },
});

export default api;