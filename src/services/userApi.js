import axiosClient from './axiosClient.js'

const userApi = {
    register(userData) {
        return axiosClient.post('/users/register', userData)
    }
}

export default userApi