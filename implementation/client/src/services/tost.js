import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Central-ish location for toast config if needed, or just export simple wrappers
export const notifySuccess = (msg) => toast.success(msg, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
});

export const notifyError = (msg) => toast.error(msg, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
});

export const notifyInfo = (msg) => toast.info(msg, {
    position: "bottom-right",
    autoClose: 2000,
    theme: "dark",
});
