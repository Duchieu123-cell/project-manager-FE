import axiosClient from "./axiosClient";

const taskApi = {

    getAllTasks(abortSignal = null) {
        if (abortSignal) {
            return axiosClient.get('/tasks', { signal: abortSignal });
        }
        return axiosClient.get('/tasks');
    },
    
    getProjectTasks(projectId, abortSignal = null) {
        return axiosClient.get(`/tasks?projectId=${projectId}`, { signal: abortSignal });
    },

    addTask(taskData) {
        return axiosClient.post(`/tasks`, taskData);
    },

    deleteTask(taskId) {
        return axiosClient.delete(`/tasks/${taskId}`);
    },

    updateTaskStatus(taskId, newStatus) {
        return axiosClient.patch(`/tasks/${taskId}`, { status: newStatus });
    },

    updateTask(taskId, updatedData) {
        return axiosClient.patch(`/tasks/${taskId}`, updatedData);
    }
}

export default taskApi;

