import React, { useContext, useState } from 'react'
import { toast } from 'react-hot-toast'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

    const [currState, setCurrState] = useState("Sign up")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [bio, setBio] = useState("")
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    // Forgot Password states
    const [resetSent, setResetSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const { login } = useContext(AuthContext)

    React.useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const onSubmitHandler = (event) => {
        event.preventDefault();

        const newErrors = {};
        if (!email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address";

        if (currState !== "Forgot Password") {
            if (!password) newErrors.password = "Password is required";
            else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
        }

        if (currState === 'Sign up') {
            if (!isDataSubmitted) {
                if (!fullName) newErrors.fullName = "Full name is required";
            } else {
                if (!bio) newErrors.bio = "Bio is required";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        if (currState === "Forgot Password") {
            toast.success("Password reset link sent to your email!");
            setResetSent(true);
            setResendTimer(60);
            return;
        }

        if (currState === 'Sign up' && !isDataSubmitted) {
            setIsDataSubmitted(true)
            return;
        }

        login(currState === "Sign up" ? 'signup' : 'login', { fullName, email, password, bio })
    }

    return (
        <div className='min-h-screen flex items-center justify-center gap-16 sm:justify-evenly max-sm:flex-col pt-10 pb-10 px-4'>
            {/*left side*/}
            <div className="flex flex-col items-center gap-4">
                <img src={assets.logo_icon} alt="Logo" className='w-24 h-24 object-contain' />
                <h1 className="text-[#0F172A] dark:text-[#F8FAFC] text-3xl font-bold tracking-tight">Your Chats</h1>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-lg font-light tracking-wide text-center">Connect & Collaborate</p>
            </div>

            {/*right side*/}
            <form onSubmit={onSubmitHandler} className='bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] p-8 md:p-10 flex flex-col gap-6 rounded-3xl shadow-sm dark:shadow-none w-full max-w-md transition-all duration-300'>
                <h2 className='font-semibold text-3xl flex justify-between items-center tracking-tight'>
                    {currState}
                    {isDataSubmitted && <img src={assets.arrow_icon} alt="" className='w-5 cursor-pointer dark:invert' onClick={() => setIsDataSubmitted(false)} />}
                </h2>

                {currState === "Sign up" && !isDataSubmitted && (
                    <div className="flex flex-col gap-1">
                        <input
                            onChange={(e) => { setFullName(e.target.value); setErrors({ ...errors, fullName: null }) }}
                            value={fullName}
                            type="text"
                            className={`p-3 bg-white dark:bg-[#0F172A]/50 border ${errors.fullName ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#334155]'} text-[#0F172A] dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all placeholder-[#64748B] dark:placeholder-[#64748B]`}
                            placeholder="Full Name"
                        />
                        {errors.fullName && <span className="text-red-500 text-xs px-1">{errors.fullName}</span>}
                    </div>
                )}

                {!isDataSubmitted && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <input
                                onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: null }) }}
                                value={email}
                                type="email"
                                placeholder='Email Address'
                                className={`p-3 bg-white dark:bg-[#0F172A]/50 border ${errors.email ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#334155]'} text-[#0F172A] dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all placeholder-[#64748B] dark:placeholder-[#64748B]`}
                            />
                            {errors.email && <span className="text-red-500 text-xs px-1">{errors.email}</span>}
                        </div>
                        {/* Password with toggle */}
                        {currState !== "Forgot Password" && (
                            <div className="flex flex-col gap-1">
                                <div className="relative">
                                    <input
                                        onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: null }) }}
                                        value={password}
                                        type={showPassword ? "text" : "password"}
                                        placeholder='Password'
                                        className={`w-full p-3 pr-12 bg-white dark:bg-[#0F172A]/50 border ${errors.password ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#334155]'} text-[#0F172A] dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all placeholder-[#64748B] dark:placeholder-[#64748B]`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#6366F1] transition-colors text-lg"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                {errors.password && <span className="text-red-500 text-xs px-1">{errors.password}</span>}
                                {currState === "Login" && (
                                    <p onClick={() => { setCurrState("Forgot Password"); setErrors({}); setResetSent(false); }} className="text-sm text-[#6366F1] hover:text-[#4F46E5] text-right cursor-pointer mt-1">
                                        Forgot Password?
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {currState === "Sign up" && isDataSubmitted && (
                    <div className="flex flex-col gap-1">
                        <textarea
                            onChange={(e) => { setBio(e.target.value); setErrors({ ...errors, bio: null }) }}
                            value={bio}
                            rows={4}
                            className={`p-3 bg-white dark:bg-[#0F172A]/50 border ${errors.bio ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#334155]'} text-[#0F172A] dark:text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all placeholder-[#64748B] dark:placeholder-[#64748B] resize-none`}
                            placeholder='Provide a short bio...'
                        ></textarea>
                        {errors.bio && <span className="text-red-500 text-xs px-1">{errors.bio}</span>}
                    </div>
                )}

                {currState === "Forgot Password" && resetSent ? (
                    <div className="flex flex-col gap-4 text-center mt-2">
                        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                            If an account exists with this email, a reset link has been sent.
                        </p>
                        <button
                            type="button"
                            disabled={resendTimer > 0}
                            onClick={() => {
                                toast.success("Password reset link resent to your email!");
                                setResendTimer(60);
                            }}
                            className='py-3.5 bg-[#F1F5F9] dark:bg-[#334155] border border-[#E2E8F0] dark:border-[#475569] text-[#0F172A] dark:text-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition-all duration-300 shadow-sm'
                        >
                            {resendTimer > 0 ? `Resend Email in ${resendTimer}s` : "Resend Email"}
                        </button>
                    </div>
                ) : (
                    <button type='submit' className='py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.01] shadow-sm'>
                        {currState === "Sign up" ? (isDataSubmitted ? "Create Account" : "Continue") : currState === "Forgot Password" ? "Send Reset Link" : "Login Now"}
                    </button>
                )}

                {currState !== "Forgot Password" && (
                    <div className='flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8]'>
                        <input type="checkbox" className="accent-[#6366F1] w-4 h-4 rounded cursor-pointer" id="terms" />
                        <label htmlFor="terms" className="cursor-pointer select-none">Agree to terms & privacy policy.</label>
                    </div>
                )}

                <div className='flex flex-col gap-2'>
                    {currState === "Sign up" || currState === "Forgot Password" ? (
                        <p className='text-sm text-[#64748B] dark:text-[#94A3B8] text-center'>Already have an account? <span onClick={() => { setCurrState("Login"); setIsDataSubmitted(false); setErrors({}); setResetSent(false); }} className='font-medium text-[#3B82F6] dark:text-[#60A5FA] hover:text-[#6366F1] cursor-pointer transition-colors'>Login here</span></p>
                    ) : (
                        <p className='text-sm text-[#64748B] dark:text-[#94A3B8] text-center'>Create an account? <span onClick={() => { setCurrState("Sign up"); setErrors({}); setResetSent(false); }} className='font-medium text-[#3B82F6] dark:text-[#60A5FA] hover:text-[#6366F1] cursor-pointer transition-colors'>Click here</span></p>
                    )}
                </div>

            </form>

        </div>
    )
}

export default LoginPage
