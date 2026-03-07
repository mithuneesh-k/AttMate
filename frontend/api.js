import axios from 'axios';
import { Platform } from 'react-native';

// Production Render Backend URL
let API_BASE_URL = 'https://attmate.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
