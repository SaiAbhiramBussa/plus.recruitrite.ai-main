import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { useContext } from "react";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

export default function BillingCard(props: any) {
  const { item } = props;
  const { color } = useContext(AppContext);

  return (
    <tr className={`h-12 table-row border`}>
      <td className="truncate pl-6 text-sm mt-2 flex items-center font-light">
        <Link href={item.invoice_url} className="flex items-center">
          <FontAwesomeIcon
            style={{
              backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
              color: color?.primaryAccent,
            }}
            icon={faFileLines}
            className="h-3 w-3 p-2 mr-2 rounded-full"
          />
          <div>{item.invoice_id}</div>
        </Link>
      </td>
      <td className="truncate text-sm items-center font-light lg:max-w-[2vw] lg:min-w-[2vw]">
        <div>{new Date(item?.start_date).toLocaleDateString()}</div>
      </td>
      <td className="truncate text-sm px-1 font-light text-xs lg:text-sm truncate">
        {item?.end_date ? new Date(item?.end_date).toLocaleDateString() : ""}
      </td>
      <td className="truncate text-sm px-1 font-light text-xs lg:text-sm truncate">
        ${`${Number.isInteger(item?.amount) ? item?.amount : Number(item?.amount).toFixed(2)}`} USD
      </td>
      <td className="truncate px-1 text-sm mt-2 font-light items-center">
        {/* {item.subscription_type === "ai_gold" ? 'Gold Plan' : 'Silver Plan'} */}
        {item.subscription_type}
      </td>
      <td className="truncate px-1 mt-2 text-sm font-light items-center">
        {item?.is_expired ? "Inactive" : "Active"}
      </td>
      <td className="">
        <div className="px-3 py-2 status-badge">
          {/* <div className="text-xs justify-center font-light text-purple-800 px-2 py-1 items-center bg-purple-200 w-max flex rounded-full"> */}
          <FontAwesomeIcon icon={faCheck} className=" h-3 w-3 mr-1 " />
          Paid
        </div>
      </td>
      <td
        style={{ color: color?.primaryAccent }}
        className="truncate font-light text-sm px-1 mt-2 items-center"
      >
        <Link href={item.invoice_pdf}>Download</Link>
      </td>
    </tr>
  );
}
