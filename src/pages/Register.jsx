import { Link } from "react-router-dom";
import userApi from "../services/userApi.js";
import InputField from '../components/InputField.jsx'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { RegisterSchema } from '../schema/userSchema.js'

export default function Register() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setError
    } = useForm({
        resolver: zodResolver(RegisterSchema)
    })

    const onSubmit = async (data) => {
        try {
            const user = await userApi.register(data)
            console.log("User được đăng ký thành công: ", user)
            reset();
        } catch (error) {
            setError("formError", {
                type: "server",
                message: error.message
            })
        }
    }

    return (
        <div className="flex items-center justify-center bg-blue-500 p-8">
            <form
                className="rounded-xl shadow-md flex flex-col bg-white p-8 gap-4 w-1/2"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
            >
                <h1 className="text-xl text-center font-bold">Đăng ký</h1>

                <InputField
                    label="Tên đăng nhập"
                    type="text"
                    placeholder="Nhập tên đăng nhập..."
                    {...register("username")}
                    error={errors.username?.message}
                    
                />


                <InputField
                    label="Mật khẩu"
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    {...register("password")}
                    error={errors.password?.message}
                />


                <InputField
                    label="Xác nhận mật khẩu"
                    type="password"
                    placeholder="Nhập lại mật khẩu..."
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                />


                <InputField
                    label="Email"
                    type="email"
                    placeholder="Nhập email..."
                    {...register("email")}
                    error={errors.email?.message}
                />


                <InputField
                    label="Tên đầy đủ"
                    type="text"
                    placeholder="Nhập tên đầy đủ..."
                    {...register("fullname")}
                    error={errors.fullname?.message}
                />

                
                <InputField
                    label="Tuổi"
                    type="number"
                    placeholder="Nhập tuổi..."
                    {...register("age")}
                    error={errors.age?.message}
                />

                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                </button>

                {errors.formError && (
                    <p className="text-md font-semibold text-red-500 text-center">Error happend: {errors.formError.message}</p>
                )}

                <div className="self-center text-sm">
                    Đã có tài khoản? <span className="text-blue-400 hover:text-blue-600"><Link to="/login">Đăng nhập ngay</Link></span>
                </div>
                
            </form>
        </div>
    )
}