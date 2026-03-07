import axios from 'axios';
import { Platform } from 'react-native';

// Production Render Backend URL
let API_BASE_URL = 'http://10.34.168.171:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
