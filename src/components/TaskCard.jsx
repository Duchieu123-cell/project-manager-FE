import formatTimestamp from "../helper/formatTimestamp.js"
import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleArrowLeft, faCircleArrowRight } from "@fortawesome/free-solid-svg-icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import taskApi from "../services/taskApi.js"
import { PERMISSIONS } from "../data/permissionData.js"
import CanAccess from "./CanAccess.jsx"

function TaskCard({ task, projectId, onEdit, editDisabled, deleteDisabled }) {
    const { 
        id: taskId, 
        name, 
        description, 
        status, 
        priority, 
        createdAt, 
        dueDate
    } = task
    const queryClient = useQueryClient()
    const {
        mutate: onDelete
    } = useMutation({
        mutationFn: () => taskApi.deleteTask(taskId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["tasks", { projectId }] })

            const previousTasks = queryClient.getQueryData(["tasks", { projectId }])

            queryClient.setQueryData(["tasks", { projectId }], (oldTasks) => {
                return oldTasks.filter(task => task.id !== taskId)
            })
            return { previousTasks }

        },
        onError: (err, variables, context) => {
            console.error("Xóa task thất bại:", err.message)
            // Rollback dữ liệu cũ
            queryClient.setQueryData(
                ["tasks", { projectId }],
                context.previousTasks
            )
        },
        onSettled: () => {
            return queryClient.invalidateQueries({ queryKey: ["tasks", { projectId }] })
        }
    })

    const {
        mutate: onStatusChange
    } = useMutation({
        mutationFn: (newStatus) => taskApi.updateTaskStatus(taskId, newStatus),
        onMutate: async (newStatus) => {
            await queryClient.cancelQueries({ queryKey: ["tasks", { projectId }] })

            const previousTasks = queryClient.getQueryData(["tasks", { projectId }])

            queryClient.setQueryData(
                ["tasks", { projectId }],
                (oldTasks) => oldTasks.map(
                    (task) => (task.id === taskId ? { ...task, status: newStatus } : task)
                )
            )

            return { previousTasks }

        },
        onSuccess: (data, variables, context) => {
            console.log(`Cập nhật trạng thái của task ${name} thành công`)
        },
        onError: (err, variables, context) => {
            console.error("Cập nhật trạng thái task thất bại:", err.message)
            // Rollback dữ liệu cũ
            queryClient.setQueryData(
                ["tasks", { projectId }],
                context.previousTasks
            )
        },
        onSettled: () => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ["tasks"], exact: true }),
                queryClient.invalidateQueries({ queryKey: ["tasks", { projectId }] })
            ])
        }
    })
    
    const classifyStatusButton = () => {
        return (
            <div className="grid grid-cols-2 mt-2 text-sm gap-2">
                <CanAccess 
                    permissions={[PERMISSIONS.TASK_UPDATE, PERMISSIONS.TASK_DELETE]} 
                    requiredAll={true}
                >
                    <button
                        className="rounded-xl bg-blue-400 p-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onEdit}
                        disabled={editDisabled}
                    >
                        Edit
                    </button>
                    <button
                        className="rounded-xl bg-red-400 p-2 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onDelete}
                        disabled={deleteDisabled}
                    >
                        Delete
                    </button>
                </CanAccess>
                
                <CanAccess 
                    permissions={[PERMISSIONS.TASK_UPDATE]} 
                    requiredAll={true}
                >
                    {status !== "in_progress" ? (
                        <button
                            className="rounded-xl bg-yellow-300 p-2 col-span-2 hover:bg-yellow-600"
                            onClick={() => onStatusChange("in_progress")}
                        >
                            {status === "todo" ? (
                                <>
                                    In-progress <FontAwesomeIcon icon={faCircleArrowRight} />
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCircleArrowLeft} /> In-progress
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            className="rounded-xl bg-gray-500 p-2 hover:bg-yellow-700"
                            onClick={() => onStatusChange("todo")}
                        >
                            <FontAwesomeIcon icon={faCircleArrowLeft} /> Todo
                        </button>
                    )}

                    {status === "in_progress" && (
                        <button 
                            className="rounded-xl bg-green-500 p-2 hover:bg-green-700"
                            onClick={() => onStatusChange("done")}
                        >
                            Done <FontAwesomeIcon icon={faCircleArrowRight} />
                        </button>
                    )}
                </CanAccess>
            </div>

        )
    }

    return (
        <div className="flex flex-col border border-gray-500 rounded-lg p-4">
            <p className="text-lg font-semibold text-center mb-4">{name}</p>
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">Mô tả: {description}</p>
            <p className="text-sm text-gray-500">Tạo: {formatTimestamp(createdAt)}</p>
            <p 
                className={`text-sm ${priority === "high" ? "text-red-500" : priority === "medium" ? "text-yellow-500" : "text-green-500"}`}
            >
                Độ ưu tiên: {priority}
            </p>
            <p className="text-sm text-gray-500">Hạn: {formatTimestamp(dueDate)}</p>
            {classifyStatusButton()}
        </div>
    )
}

export default memo(TaskCard)