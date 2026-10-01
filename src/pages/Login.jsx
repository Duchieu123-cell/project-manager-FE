// import { useAuth } from '../context/AuthContext.jsx'
import { useAuthStoreActions } from '../stores/useAuthStore.js'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import InputField from '../components/InputField.jsx'
import { LoginSchema } from '../schema/userSchema.js'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import authApi from '../services/authApi.js';

export default function Login(){
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError
    } = useForm({
        resolver: zodResolver(LoginSchema)
    });
    // const { login } = useAuth();
    const { login } = useAuthStoreActions();
    const navigate = useNavigate();
    const location = useLocation();
    const previousPath = location.state?.from?.pathname || '/';


    const onSubmit = async (data) => {

        try {
            const { access_token, token_type, permissions } = await authApi.login(data.username, data.password);

            login(access_token, permissions);
            navigate(previousPath, { replace: true });

        } catch (error) {
            setError("formError", {
                type: "server",
                message: error.message
            })
        }

    }

    return (
        <div className="h-screen flex items-center justify-center bg-blue-500 dark:bg-gray-500">
            <form
                className="rounded-xl shadow-md flex flex-col bg-white p-8 gap-4 w-1/2"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
            >
                <h1 className="text-xl text-center font-bold">Đăng nhập</h1>

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

                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                {errors.formError && (
                    <p className="text-md font-semibold text-red-400 text-center">{errors.formError.message}</p>
                )}

                <div className="self-center text-sm">
                    Chưa có tài khoản? <span className="text-blue-400 hover:text-blue-600"><Link to="/register">Đăng ký ngay</Link></span>
                </div>
                
            </form>
        </div>
    )
}