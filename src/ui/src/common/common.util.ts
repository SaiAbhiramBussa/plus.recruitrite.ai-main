import { toast } from "react-toastify";

export const isToShowDataBasedOnUser = (role: string, isRevealed: boolean): boolean => role == 'admin' ? true : isRevealed ? true : false;

export const showErrorToast = (message: string) => {
    toast.error(message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true
    });
}

export const showSuccessToast = (message: string, type?: string) => {
    if (type === 'warning') {
        toast.warning(message, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true
        });
        
        return;
    } else if (type === 'error') {
        toast.error(message, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 2000,
            hideProgressBar: true
        });

        return;
    }

    toast.success(message, {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 2000,
        hideProgressBar: true
    });
}

export interface TargetLabelFormModel {
    future_title: boolean,
    recent_title: boolean,
    recent_skip_title: boolean,
    exists_anywhere: boolean,
    summary: boolean,
}

export const keyLabelTargetLabelMapObj = {
    future_title: "Future Title",
    recent_title: "Recent Title",
    recent_skip_title: "Recent Skip Title",
    exists_anywhere: "Exists anywhere",
    summary: "Summary",
};