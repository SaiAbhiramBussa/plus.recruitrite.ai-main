import TextInput from "../TextInput"
import axios from "axios"
import { useState } from "react"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import StartDateButton from "../StartDateButton";

export const ImportJobs = (props:any)=>{
    const [isLoading, setIsLoading] = useState(false)
    const [idValue, setIdValue]= useState()
    const [error, setError] = useState<string | null>()
    const [openPopover, setOpenPopover] = useState<boolean>(false);

    const handleSubmit = async (): Promise<void> => {
        setIsLoading(true)
        const idsArray = _.map(_.split(idValue, ','), Number)
        try{
          await axios.post(`${process.env.NEXT_PUBLIC_DOMAIN}/api/jobs/import_jobs`,{external_job_ids:idsArray},{
            withCredentials:true,})
            toast.success("Import Ids Added to Queue", {
                position: toast.POSITION.TOP_RIGHT,
                autoClose: 2000,
                hideProgressBar: true,
              })
            setIsLoading(true)
            props.setIsModalOpen(false)
          }
          catch(err:any){
            setIsLoading(false)
            toast.error(err?.response?.data?.error,{
                position: toast.POSITION.TOP_RIGHT,
                autoClose: 2000, 
                hideProgressBar: true
              });
          }
      };

    const handleValueChange =(value: any)=>{
        const regex = /^[0-9,]*$/;
        if(regex.test(value)){
            setError(null)
            setIdValue(value)
        }else{
            setError('Only Digits Allowed')
        }
        
    }

    const HelpIcon = () => (
      <FontAwesomeIcon
        icon={faQuestionCircle}
        onMouseEnter={() => setOpenPopover(true)}
        onMouseLeave={() => setOpenPopover(false)}
        className="h-4 mr-2 cursor-pointer"
      />
    );

    const AlertIconToolTip = ( prop : {popOverMsg: string} ) => {
      return (
        <div
          className=" bg-black bg-opacity-70 flex absolute py-2 rounded-lg left-0 top-12 ml-2"
          onMouseEnter={() => setOpenPopover(true)}
          onMouseLeave={() => setOpenPopover(false)}
        >
          <div className="text-white text-sm items-center w-full px-4 flex-col justify-start">
            {prop.popOverMsg}
          </div>
        </div>
      );
    };

    return(
        <div className="">
          {openPopover ? <AlertIconToolTip popOverMsg={'Multiple Ids are Supported with comma separation'}/> : ''}
            <div>
            <TextInput
                name="title"
                section="employer"
                value={idValue}
                label={"External Ids"}
                labelHelpIcon={<HelpIcon />}
                placeholder="Type Id's here..."
                onChange={(e: any) => handleValueChange(e.target.value)}
                error={error}
              />
            </div>
            <div className="flex flex-row-reverse mt-10">
              <StartDateButton action={handleSubmit} btnLabel={isLoading?'Submitting':'Submit'} isDisabled={!idValue || isLoading}/>
            </div> 
        </div>
    )

}