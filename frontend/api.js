import axios from 'axios';

const API_BASE_URL = 'http://10.165.173.171:8000'; // Local Network IP for physical device

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
