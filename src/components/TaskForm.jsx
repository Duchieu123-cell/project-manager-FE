import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskFormSchema } from "../schema/taskFormSchema"
import InputField from "./InputField"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import taskApi from "../services/taskApi"
import { useParams } from "react-router-dom"

function TaskForm({ initialData, onClose }) {
    console.log("Đang render TaskForm với initialData:", initialData)
    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting },
        reset
    } = useForm({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
            status: initialData?.status ?? "",
            priority: initialData?.priority ?? "",
            dueDate: initialData?.dueDate ?? ""
        }
    })

    const queryClient = useQueryClient()
    const { projectId } = useParams()

    // viết useEffect để cập nhật defaultValues khi initialData thay đổi
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData?.name ?? "",
                description: initialData?.description ?? "",
                status: initialData?.status ?? "",
                priority: initialData?.priority ?? "",
                dueDate: initialData?.dueDate ?? ""
            })
        }
    }, [initialData, reset])

    const {
        mutate,
        isPending
    } = useMutation({
        mutationFn: (formData) => (
            initialData
            ? taskApi.updateTask(initialData.id, { ...formData })
            : taskApi.addTask({ ...formData, projectId })
        ),
        onMutate: async (formData) => {
            await queryClient.cancelQueries({ queryKey: ["tasks", { projectId }] })
            const previousTasks = queryClient.getQueryData(["tasks", { projectId }]) || []

            if (!initialData) {
                // Thêm task mới vào cache, tạo một id tạm thời để hiển thị ngay lập tức
                const tempId = `temp-${Date.now()}`
                const newTask = { ...formData, id: tempId, projectId, createdAt: Math.floor(Date.now() / 1000), lastModified: Math.floor(Date.now() / 1000) }
                queryClient.setQueryData(
                    ["tasks", { projectId }],
                    (oldTasks = []) => [...oldTasks, newTask]
                )
                return { previousTasks, tempId }
            } else {
                // Cập nhật task trong cache
                queryClient.setQueryData(
                    ["tasks", { projectId }],
                    (oldTasks = []) => oldTasks.map((task) => (task.id === initialData.id ? { ...task, ...formData, lastModified: Math.floor(Date.now() / 1000) } : task))
                )
                return { previousTasks }
            }

            
        },
        onSuccess: (data, variables, context) => {
            console.log(initialData ? "Task được cập nhật thành công" : "Task mới được thêm thành công", data)
            if (!initialData && context.tempId) {
                // Thay thế task tạm thời bằng task thực sự từ server
                queryClient.setQueryData(
                    ["tasks", { projectId }],
                    (oldTasks = []) => oldTasks.map((task) => (task.id === context.tempId ? data : task))
                )
                reset()
            }
            
        },
        onError: (error, variables, context) => {
            console.error(initialData ? "Có lỗi xảy ra khi cập nhật task:" : "Có lỗi xảy ra khi thêm task:", error)
            // Hoàn tác các thay đổi trong cache nếu có lỗi
            queryClient.setQueryData(
                ["tasks", { projectId }],
                context.previousTasks
            )
        },
        onSettled: async () => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ["tasks"], exact: true }),
                queryClient.invalidateQueries({ queryKey: ["tasks", { projectId }] })
            ])
        }
    })


    return (
        <div className="m-2">
            <form
                className="flex flex-col gap-2 border-2 border-gray-300 rounded-2xl p-4"
                onSubmit={handleSubmit(mutate)}
            >

                <InputField 
                    label="Tên task"
                    type="text"
                    placeholder="Nhập tên task..."
                    {...register("name")}
                    error={errors.name?.message}
                />

                <InputField 
                    label="Mô tả task"
                    type="text"
                    placeholder="Nhập mô tả task..."
                    {...register("description")}
                    error={errors.description?.message}
                />

                <label className="font-semibold text-gray-500" htmlFor="status">Trạng thái</label>
                <select
                    id="status"
                    className="border border-gray-300 rounded p-1"
                    {...register("status")}
                >
                    <option value="">-- Chọn status --</option>
                    <option value="todo">Cần làm</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="done">Hoàn thành</option>
                </select>
                {errors.status && (
                    <p className="font-semibold text-red-500 text-sm">
                        Lỗi: {errors.status.message}
                    </p>
                )}

                <label className="font-semibold text-gray-500" htmlFor="priority">Độ ưu tiên</label>
                <select
                    id="priority"
                    className="border border-gray-300 rounded p-1"
                    {...register("priority")}
                >
                    <option value="">-- Chọn priority --</option>
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                </select>
                {errors.priority && (
                    <p className="font-semibold text-red-500 text-sm">
                        Lỗi: {errors.priority.message}
                    </p>
                )}

                <InputField
                    label="Hạn chót"
                    type="date"
                    placeholder="Chọn hạn chót..."
                    {...register("dueDate")}
                    error={errors.dueDate?.message}
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="border p-2 rounded-xl text-white bg-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="border p-2 rounded-xl text-white bg-blue-400 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang xử lý..." : (initialData ? "Sửa task" : "Thêm task")}
                    </button>
                </div>
            </form>
        </div>

    )
    
}

export default TaskForm