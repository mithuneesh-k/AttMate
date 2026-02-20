import axios from 'axios';
import { Platform } from 'react-native';

// For Physical Mobile App over Wi-Fi Hotspot
let API_BASE_URL = 'http://192.168.137.1:8000';

// For Laptop Browser Preview bypass CORS
if (Platform.OS === 'web') {
    API_BASE_URL = 'http://localhost:8000';
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
