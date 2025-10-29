import axios from "axios";

export const login = async (email: any) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/users/send/otp`,
      {
        email,
      },
      {
        withCredentials: true,
      }
    );
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response;
  } catch (error) {
    return error;
  }
};

export const register = async (user: any) => {
  try {
    let res = await axios.post(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/accounts/register`,
      { user }
    );
    return res;
  } catch (error) {
    return error;
  }
};
