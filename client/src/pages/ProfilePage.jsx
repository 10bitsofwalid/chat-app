import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {

    const { authUser, updateProfile } = useContext(AuthContext)

    const [selectedImg, setSelectedImg] = useState(null)
    const navigate = useNavigate();
    const [name, setName] = useState(authUser?.fullName || '')
    const [bio, setBio] = useState(authUser?.bio || '')

    // redirect to login if not authenticated
    useEffect(() => {
        if (!authUser) navigate('/login');
    }, [authUser, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedImg && !authUser?.profilePic) {
            toast.error("Please upload a profile image to continue");
            return;
        }

        if (!selectedImg) {
            await updateProfile({ fullName: name, bio });
            navigate('/');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        reader.onload = async () => {
            const base64Image = reader.result;
            await updateProfile({ profilePic: base64Image, fullName: name, bio })
            navigate('/')
        }

    }

    return (
        <div className='min-h-screen flex items-center justify-center p-4 xl:p-0'>
            <div className='w-full max-w-3xl bg-[#FFFFFF] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#334155] flex flex-col-reverse md:flex-row items-center justify-between rounded-3xl shadow-sm dark:shadow-none overflow-hidden transition-all duration-300'>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-8 md:p-12 w-full md:flex-1">
                    <h3 className="text-2xl font-semibold tracking-tight">Profile Details</h3>
                    <label htmlFor="avatar" className='flex items-center gap-4 cursor-pointer group'>
                        <input onChange={(e) => setSelectedImg(e.target.files[0])} type="file" id='avatar' accept='.png, .jpeg, .jpg' hidden />
                        <img src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon} alt="" className={`w-14 h-14 object-cover shadow-sm border border-[#E2E8F0] dark:border-[#334155] group-hover:ring-2 ring-[#6366F1] transition-all ${selectedImg ? 'rounded-full' : 'rounded-xl'}`} />
                        <span className="text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#6366F1] transition-colors">Upload profile image</span>
                    </label>
                    <div className="flex flex-col gap-4">
                        <input onChange={(e) => setName(e.target.value)} value={name} type="text" required placeholder='Your Name' className='p-3 bg-white dark:bg-[#0F172A]/50 border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all placeholder-[#64748B] dark:placeholder-[#64748B] text-[#0F172A] dark:text-[#F8FAFC]' />
                        <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder="Write a short bio..." required className="p-3 bg-white dark:bg-[#0F172A]/50 border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-all placeholder-[#64748B] dark:placeholder-[#64748B] text-[#0F172A] dark:text-[#F8FAFC] resize-none" rows={4}></textarea>
                    </div>
                    <button type="submit" className="mt-2 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] shadow-sm">Save Profile</button>
                </form>
                <div className="flex justify-center items-center py-10 px-6 w-full md:w-auto md:min-w-[280px] h-full border-b md:border-b-0 md:border-l border-[#E2E8F0] dark:border-[#334155] bg-[#F1F5F9] dark:bg-[#020617] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/10 z-0"></div>
                    <div className="relative group z-10 p-2 rounded-full border border-[#E2E8F0] dark:border-[#334155] bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-sm">
                        <img className="max-w-[150px] w-full aspect-square object-cover rounded-full transition-transform group-hover:scale-[1.02] duration-300" src={selectedImg ? URL.createObjectURL(selectedImg) : authUser?.profilePic || assets.logo_icon} alt="Profile" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
