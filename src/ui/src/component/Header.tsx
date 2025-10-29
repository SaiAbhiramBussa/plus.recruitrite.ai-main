import { Popover } from "@headlessui/react";
import Link from "next/link";
import { useContext} from "react";
import CustomizationsData from "@/src/utils/CustomizationData";
import AppContext from "@/src/context/Context";
import Image from "next/image";

export default function Header(){
    const { color} = useContext(AppContext);
    const customizationsData: any = CustomizationsData[4].data;

return (
<div className="flex flex-col w-full fixed top-0 z-40">
<div style={{ backgroundColor: color?.innerBg }} className="shadow">
  <div className="mx-auto flex justify-between px-2 sm:px-4 lg:px-8">
    <Popover className="flex h-16 justify-between w-screen">
      <div className="flex items-center px-2 lg:px-0 space-x-6">
        <div>
                        <Image
              src={customizationsData.logo}
              width={customizationsData.width}
              height={customizationsData.height}
              alt="logo"
            />
      
        </div>
      
      </div>
    
        <div className="flex items-center justify-end">
          <div className="flex items-center justify-end">
                <div style={{
                    backgroundColor: color?.primaryAccent,
                    color: color?.btnAccent,
                  }
                }
                  className="px-4 py-2 rounded mr-4"
                >
                <Link href="/signin">Go to Login</Link>
                </div>
          </div>
        </div>
    </Popover>
  </div>
</div>
</div>
    )
}