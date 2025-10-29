import React, { useEffect, useState } from "react";
import SignUp from "@/src/component/SignUp";

export default function SignUpPage() {

const [loading, setLoading] = useState(true);

useEffect(() => {
    if(localStorage.getItem('user')){
        window.location.href = '/dashboard'
        history.pushState(null, '/dashboard'); //removed null from between
    }
    else{
        setLoading(false);
    }
}, [])

  return(
    !loading && 
    <SignUp role='job-seeker' />
  )
}
