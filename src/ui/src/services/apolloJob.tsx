import axios from "axios";

export const UpdateApolloData = async(updatedApolloJob: any, id: any) => {
    try{
        const res = await axios.patch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/candidates/apollo-jobs/${id}/update`, updatedApolloJob,{
          withCredentials:true,
        });
        return res;
    }
    catch(err){
        return err;
    }
  }
