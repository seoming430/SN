// src/api/RetrofitClient.ts
import axios from 'axios';

const baseURL = 'https://your-api-endpoint.com/'; // API 기본 URL 설정

// Axios 인스턴스 생성
const RetrofitClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (선택 사항)
// RetrofitClient.interceptors.request.use(
//   (config) => {
//     // 토큰 등의 인증 정보 추가 가능
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// 응답 인터셉터 (선택 사항)
// RetrofitClient.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export default RetrofitClient;
