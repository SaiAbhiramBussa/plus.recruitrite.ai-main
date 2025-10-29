import { createContext, useState, useContext } from "react";

type Props = {  
 children: React.ReactNode;
}
interface AuthContextType {
 auth : boolean;
 setAuth : (auth:boolean)=> void;
}

// export const AuthContext = createContext<AuthContextType>({
//     auth: false,
//     setAuth: ()=>{},
// });

export const AuthContext = createContext({})

export const AuthContextProvider = ({ children }:Props) => {
    // const [auth, setAuth] = useState(false);

    const [auth, setAuth] = useState({
        isLoading: true,
        isLoggedIn: false,
        user: null,
        language:'en',
      });

    return (
        <AuthContext.Provider value={{auth, setAuth}}>
            {children}
        </AuthContext.Provider>
    )
}

// export default AuthContext;