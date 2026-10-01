import { useState, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import taskApi from "../services/taskApi.js"
import TaskCard from "../components/TaskCard.jsx"
import TaskForm from "../components/TaskForm.jsx"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { 
    faCircleArrowLeft, 
    faFilter, 
    faRotateRight,
    faPlus
} from "@fortawesome/free-solid-svg-icons"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import TaskFilterForm from "../components/TaskFilterForm.jsx"
import { PERMISSIONS } from "../data/permissionData.js"
import CanAccess from "../components/CanAccess.jsx"
    
export default function ProjectDetail() {
    const { projectId } = useParams()

    const {
        data: tasks = [],
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["tasks", { projectId }],
        queryFn: ({ signal }) => taskApi.getProjectTasks(projectId, signal),
    })
    const [isFormOpen, setIsFormOpen] = useState({ state: false, taskId: null })
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filterData, setFilterData] = useState({
        duedate: [],
        priority: []
    })

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Logic to filter tasks based on due date and priority
            const dueDateUnixTimestamp = new Date(task.dueDate).getTime()
            const currentUnixTimestamp = Date.now()
            const overDue = dueDateUnixTimestamp < currentUnixTimestamp
            const isDueDateMatch = (filterData.duedate.length === 0) 
                || (filterData.duedate.includes("overdue") && overDue)
                || (filterData.duedate.includes("upcoming") && !overDue)

            const isPriorityMatch = filterData.priority.length === 0 || filterData.priority.includes(task.priority); // If no priority filter is selected, include all tasks

            return isDueDateMatch && isPriorityMatch;
        });
    }, [tasks, filterData]);

    const todoTasks = useMemo(() => {
        return filteredTasks.filter(task => task.status === "todo");
    }, [filteredTasks]);

    const inProgressTasks = useMemo(() => {
        return filteredTasks.filter(task => task.status === "in_progress");
    }, [filteredTasks]);

    const doneTasks = useMemo(() => {
        return filteredTasks.filter(task => task.status === "done");
    }, [filteredTasks]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="bg-gray-300 py-4 mb-4">
                <h1 className="text-center font-bold text-blue-500 font-times">Chi tiết dự án</h1>
            </div>

            <div className="flex px-4">
                <Link
                    className="flex gap-3 items-center rounded-xl p-2 bg-gray-200 hover:bg-gray-600" 
                    to="/projects"
                >
                    <FontAwesomeIcon icon={faCircleArrowLeft} />
                    Projects
                </Link>
                <div className="flex-1 flex justify-end gap-2">
                    <button
                        className="bg-slate-300 rounded-xl p-2 hover:bg-slate-600"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <FontAwesomeIcon icon={faFilter} />
                    </button>
                    <button
                        className="bg-blue-400 rounded-xl p-2 hover:bg-blue-600"
                        onClick={() => refetch()}
                    >
                        {isFetching ? "Refetching..." : (<FontAwesomeIcon icon={faRotateRight} />)}
                    </button>
                    {!isFormOpen.state && (
                        <CanAccess
                            permissions={[PERMISSIONS.TASK_ADD]}
                        >
                            <button
                                className="bg-green-400 rounded-xl p-2 hover:bg-green-600"
                                onClick={() => setIsFormOpen({ state: true, taskId: null })}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add
                            </button>
                        </CanAccess>
                        
                    )}                    
                </div>

            </div>

            <div className="space-y-6 p-4 flex-1 overflow-y-auto">
                {isFormOpen.state && (
                    <TaskForm
                        key={isFormOpen.taskId || "new-task"}
                        initialData={isFormOpen.taskId ? tasks.find(task => task.id === isFormOpen.taskId) : null}
                        onClose={() => setIsFormOpen({ state: false, taskId: null })}
                    />
                )}

                <div>
                    <h2 className="text-2xl text-center font-bold">Danh sách task</h2>
                </div>

                {isError ? (
                    <div className="text-red-500 text-center">
                        Có lỗi xảy ra: {error.response?.data?.detail || error.message || "Lỗi không xác định"}
                    </div>
                ) : (
                    <>
                    <AnimatePresence>
                        {isFilterOpen && (
                            <TaskFilterForm
                                filterData={filterData}
                                setFilterData={setFilterData}
                                onClose={() => setIsFilterOpen(false)}
                            />
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4">
                
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center justify-between">
                                <span>Cần làm</span>
                                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                                    {todoTasks.length}
                                </span>
                            </h3>
                            
                            <div className="space-y-3">
                                {todoTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        projectId={projectId}
                                        onEdit={() => setIsFormOpen({ state: true, taskId: task.id })}
                                        editDisabled={isFormOpen.state}
                                        deleteDisabled={isFormOpen.state && isFormOpen.taskId === task.id}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center justify-between">
                                <span>Đang làm</span>
                                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                                    {inProgressTasks.length}
                                </span>
                            </h3>
                            <div className="space-y-3">
                                {inProgressTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        projectId={projectId}
                                        onEdit={() => setIsFormOpen({ state: true, taskId: task.id })}
                                        editDisabled={isFormOpen.state}
                                        deleteDisabled={isFormOpen.state && isFormOpen.taskId === task.id}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <h3 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center justify-between">
                                <span>Đã xong</span>
                                <span className="bg-emerald-100 text-emerald-600 text-xs px-2 py-1 rounded-full">
                                    {doneTasks.length}
                                </span>
                            </h3>
                            <div className="space-y-3">
                                {doneTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        projectId={projectId}
                                        onEdit={() => setIsFormOpen({ state: true, taskId: task.id })}
                                        editDisabled={isFormOpen.state}
                                        deleteDisabled={isFormOpen.state && isFormOpen.taskId === task.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    </>              
                )}
                
            </div>            
        </div>

    )
}