import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore.js";
import authApi from "./authApi.js";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});


axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Biến cờ đánh dấu đang trong tiến trình Refresh Token
let isRefreshing = false;
// Hàng đợi chứa các request bị 401 đang chờ token mới
let failedQueue = [];
// Hàm xử lý chạy lại hoặc hủy các request trong hàng đợi
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401
      && error.response?.data?.detail?.type === "expired_access_token"
      && !originalRequest._retry
    ) {
      // Nếu API refresh-token chính nó bị 401 -> Logout ngay lập tức
      if (originalRequest.url.includes("/auth/refresh")) {
        await authApi.logout();
        useAuthStore.getState().actions.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // TRƯỜNG HỢP 1: Đã có một request khác đang tiến hành refresh token
      // -> Đưa request hiện tại vào hàng đợi chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      // TRƯỜNG HỢP 2: Request 401 đầu tiên đứng ra nhận nhiệm vụ refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dùng axios thuần (không dùng axiosClient) để tránh lặp vô tận interceptor
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          {
            timeout: 10000,
            withCredentials: true,
          }
        );

        // Dữ liệu trả về có dạng:
        // {
        //   "access_token": "...",
        //   "token_type": "bearer"
        // }
        // refresh token mới sẽ được lưu trong cookie HttpOnly, chỉ có access token là cần lấy ra để gắn vào header Authorization

        const { access_token: newAccessToken } = response.data;

        // Cập nhật Access Token mới vào Zustand Store + localStorage
        useAuthStore.getState().actions.setNewAccessToken(newAccessToken);

        // Giải phóng hàng đợi: Cho phép các request đang chờ chạy tiếp với token mới
        processQueue(null, newAccessToken);

        // Gắn token mới vào request ban đầu và gọi lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng hết hạn/không hợp lệ -> Từ chối cả hàng đợi và Logout
        processQueue(refreshError, null);
        await authApi.logout();
        useAuthStore.getState().actions.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }


    return Promise.reject(error);
  }
);

export default axiosClient;