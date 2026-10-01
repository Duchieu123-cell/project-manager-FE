import axiosClient from './axiosClient.js'

const authApi = {
    login(username, password) {
        const data = new URLSearchParams();

        data.append('username', username);
        data.append('password', password);

        return axiosClient.post('/auth/token', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    },
    logout() {
        return axiosClient.post('/auth/logout')
    }
}

export default authApi