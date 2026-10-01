import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectFormSchema } from "../schema/projectFormSchema"
import TextareaField from "./TextareaField.jsx"
import InputField from "./InputField.jsx"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import projectApi from "../services/projectApi.js"
import AcceptToggle from "./AcceptToggle.jsx"
import DifficultyRating from "./DifficultyRating.jsx"

function ProjectForm({ initialData, onClose }) {
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
            difficulty: initialData?.difficulty ?? 0,
            isAccepted: initialData?.isAccepted ?? false,
            
        }
    })

    const queryClient = useQueryClient()

    const {
        mutate,
        isPending
    } = useMutation({
        mutationFn: (formData) => (
            initialData
            ? projectApi.updateProject(initialData.id, { ...formData })
            : projectApi.addProject({ ...formData })
        ),
        onMutate: async (formData) => {

            console.log(initialData ? "Sửa dự án" : "Thêm dự án", formData)
            
            await queryClient.cancelQueries({ queryKey: ["projects"] })
            
            const previousProjects = queryClient.getQueryData(["projects"]) || []

            if (initialData) {
                // Sửa dự án: cập nhật dữ liệu cache ngay lập tức
                queryClient.setQueryData(
                    ["projects"],
                    (oldProjects = []) => oldProjects.map((project) => project.id === initialData.id ? { ...project, ...formData } : project)
                )

                return { previousProjects }
            } else {
                // Thêm dự án: thêm dữ liệu cache ngay lập tức
                const tempId = `temp ${Date.now()}`
                const newProject = { ...formData, id: tempId }
                queryClient.setQueryData(
                    ["projects"],
                    (oldProjects = []) => [...oldProjects, newProject]
                )

                return { previousProjects, tempId }
            }
            
        },
        onSuccess: (data, variables, context) => {
            console.log(initialData ? "Dự án đã được cập nhật:" : "Dự án mới đã được thêm:", data)
            // Cập nhật id tạm thời bằng id thực tế từ server nếu là thêm dự án
            if (!initialData) {
                queryClient.setQueryData(
                    ["projects"],
                    (oldProjects = []) => oldProjects.map((project) => project.id === context.tempId ? data : project)
                )

                // Chỉ reset form nếu là thêm dự án, không reset nếu là sửa dự án
                reset()
            }
        },
        onError: (error, variables, context) => {
            console.error(initialData ? "Request sửa dự án thất bại:" : "Request thêm dự án thất bại:", error.message)
            // Rollback dữ liệu cache về trạng thái trước đó nếu có lỗi
            queryClient.setQueryData(
                ["projects"],
                context.previousProjects
            )
        },
        onSettled: () => {
            return queryClient.invalidateQueries({ queryKey: ["projects"] })
        }
    })

    return (
        <div>
            <form
                className="flex flex-col gap-2 border-2 border-gray-300 rounded-2xl p-4 bg-slate-100 text-black dark:text-white dark:bg-blue-400"
                onSubmit={handleSubmit(mutate)}
            >

                <InputField
                    label="Tên dự án"
                    type="text"
                    placeholder="Nhập tên dự án..."
                    {...register("name")}
                    error={errors.name?.message}
                />

                <TextareaField
                    label="Mô tả dự án"
                    placeholder="Nhập mô tả dự án..."
                    {...register("description")}
                    error={errors.description?.message}
                />

                <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                        <DifficultyRating
                            difficulty={field.value}
                            onDifficultyChange={field.onChange}
                            disabled={isPending}
                            error={errors.difficulty?.message}
                        />
                    )}
                />

                <Controller
                    name="isAccepted"
                    control={control}
                    render={({ field }) => (
                        <AcceptToggle 
                            isAccepted={field.value}
                            onToggle={field.onChange}
                            disabled={isPending}
                        />
                    )}
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="border p-2 rounded-xl text-white bg-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="border p-2 rounded-xl text-white bg-blue-400 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isPending}
                    >
                        { isPending ? "Đang xử lý..." : (initialData ? "Sửa dự án" : "Thêm dự án")}
                    </button>
                </div>
                
            </form>
        </div>
        
    )
    
}

export default ProjectForm